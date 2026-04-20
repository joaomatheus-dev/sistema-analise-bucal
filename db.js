const crypto = require("crypto");
const { Pool } = require("pg");

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/analise_bucal";

const pool = new Pool({
  connectionString
});

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function sanitizeUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    university: row.university,
    role: row.role
  };
}

async function initDb() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        university TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        failed_login_count INTEGER NOT NULL DEFAULT 0,
        blocked_until TIMESTAMPTZ
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        source TEXT NOT NULL DEFAULT 'manual',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS images (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        image_url TEXT NOT NULL,
        image_gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_by BIGINT NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      ALTER TABLE images
      ADD COLUMN IF NOT EXISTS image_gallery JSONB NOT NULL DEFAULT '[]'::jsonb
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id BIGSERIAL PRIMARY KEY,
        image_id BIGINT NOT NULL REFERENCES images(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL REFERENCES users(id),
        text TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ativo',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token TEXT PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const existingAdmin = await client.query(
      "SELECT id FROM users WHERE email = $1",
      ["admin@analisebucal.com"]
    );

    let adminId;
    if (existingAdmin.rowCount === 0) {
      const adminInsert = await client.query(
        `
          INSERT INTO users (name, email, university, password_hash, role)
          VALUES ($1, $2, $3, $4, 'admin')
          RETURNING id
        `,
        ["Administrador", "admin@analisebucal.com", "Sistema", hashPassword("Admin@123")]
      );
      adminId = adminInsert.rows[0].id;
    } else {
      adminId = existingAdmin.rows[0].id;
    }

    const imageCount = await client.query("SELECT COUNT(*)::int AS total FROM images");
    if (imageCount.rows[0].total === 0) {
      await client.query(
        `
          INSERT INTO categories (name, source)
          VALUES ($1, 'seed')
          ON CONFLICT (name) DO NOTHING
        `,
        ["Mucosa oral"]
      );

      const imageInsert = await client.query(
        `
          INSERT INTO images (title, category, description, image_url, created_by)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `,
        [
          "Lesão branca em mucosa",
          "Mucosa oral",
          "Imagem de exemplo para triagem inicial.",
          "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80",
          adminId
        ]
      );

      await client.query(
        `
          INSERT INTO comments (image_id, user_id, text, status)
          VALUES ($1, $2, $3, 'ativo')
        `,
        [imageInsert.rows[0].id, adminId, "Verificar necessidade de biópsia conforme avaliação clínica."]
      );
    }

    await client.query(`
      INSERT INTO categories (name, source)
      SELECT DISTINCT category, 'image_seed'
      FROM images
      WHERE category IS NOT NULL AND trim(category) <> ''
      ON CONFLICT (name) DO NOTHING
    `);

    await client.query(`
      UPDATE images
      SET image_gallery = jsonb_build_array(image_url)
      WHERE image_url IS NOT NULL
        AND trim(image_url) <> ''
        AND (
          image_gallery IS NULL
          OR image_gallery = '[]'::jsonb
        )
    `);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getUserByEmail(email) {
  const result = await pool.query(
    `
      SELECT id, name, email, university, password_hash, role, failed_login_count, blocked_until
      FROM users
      WHERE lower(email) = lower($1)
    `,
    [email]
  );

  return result.rows[0] || null;
}

async function getUserByToken(token) {
  const result = await pool.query(
    `
      SELECT u.id, u.name, u.email, u.university, u.password_hash, u.role, u.failed_login_count, u.blocked_until
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = $1
    `,
    [token]
  );

  return result.rows[0] || null;
}

async function listAdmins() {
  const result = await pool.query(
    `
      SELECT id, name, email, university, role
      FROM users
      WHERE role = 'admin'
      ORDER BY lower(name), lower(email)
    `
  );

  return result.rows;
}

async function getUserById(id) {
  const result = await pool.query(
    `
      SELECT id, name, email, university, password_hash, role
      FROM users
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function countAdmins() {
  const result = await pool.query(
    `
      SELECT COUNT(*)::int AS total
      FROM users
      WHERE role = 'admin'
    `
  );

  return result.rows[0].total;
}

async function createUser({ name, email, university, password, role = "user" }) {
  const result = await pool.query(
    `
      INSERT INTO users (name, email, university, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, university, role
    `,
    [name, email, university, hashPassword(password), role]
  );

  return result.rows[0];
}

async function updateAdmin(id, { name, email, university, password }) {
  const values = [name, email, university];
  let passwordFragment = "";

  if (password) {
    values.push(hashPassword(password));
    passwordFragment = ", password_hash = $" + values.length;
  }

  values.push(id);

  const result = await pool.query(
    `
      UPDATE users
      SET
        name = $1,
        email = $2,
        university = $3
        ${passwordFragment}
      WHERE id = $${values.length}
        AND role = 'admin'
      RETURNING id, name, email, university, role
    `,
    values
  );

  return result.rows[0] || null;
}

async function deleteAdmin(id) {
  const result = await pool.query(
    `
      DELETE FROM users
      WHERE id = $1
        AND role = 'admin'
      RETURNING id, name, email, university, role
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function updateUserLoginState(id, failedLoginCount, blockedUntil) {
  await pool.query(
    `
      UPDATE users
      SET failed_login_count = $1, blocked_until = $2
      WHERE id = $3
    `,
    [failedLoginCount, blockedUntil, id]
  );
}

async function createSession(userId) {
  const token = crypto.randomBytes(24).toString("hex");
  await pool.query(
    `
      INSERT INTO sessions (token, user_id)
      VALUES ($1, $2)
    `,
    [token, userId]
  );
  return token;
}

async function removeSession(token) {
  await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
}

async function createPasswordResetToken(userId) {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1 OR expires_at < NOW()", [
    userId
  ]);
  await pool.query(
    `
      INSERT INTO password_reset_tokens (token, user_id, expires_at)
      VALUES ($1, $2, $3)
    `,
    [token, userId, expiresAt]
  );

  return { token, expiresAt };
}

async function getValidPasswordResetToken(token) {
  const result = await pool.query(
    `
      SELECT
        prt.token,
        prt.user_id AS "userId",
        prt.expires_at AS "expiresAt",
        prt.used_at AS "usedAt",
        u.email
      FROM password_reset_tokens prt
      JOIN users u ON u.id = prt.user_id
      WHERE prt.token = $1
        AND prt.used_at IS NULL
        AND prt.expires_at > NOW()
    `,
    [token]
  );

  return result.rows[0] || null;
}

async function updateUserPassword(userId, password) {
  await pool.query(
    `
      UPDATE users
      SET
        password_hash = $1,
        failed_login_count = 0,
        blocked_until = NULL
      WHERE id = $2
    `,
    [hashPassword(password), userId]
  );
}

async function consumePasswordResetToken(token) {
  await pool.query(
    `
      UPDATE password_reset_tokens
      SET used_at = NOW()
      WHERE token = $1
    `,
    [token]
  );
}

async function listImages(filters = {}) {
  const search = String(filters.search || "").trim().toLowerCase();
  const category = String(filters.category || "").trim().toLowerCase();

  const result = await pool.query(
    `
      SELECT
        i.id,
        i.title,
        i.category,
        i.description,
        i.image_url AS "imageUrl",
        i.image_gallery AS "imageGallery",
        i.created_by AS "createdBy",
        i.created_at AS "createdAt",
        COUNT(c.id)::int AS "commentCount"
      FROM images i
      LEFT JOIN comments c
        ON c.image_id = i.id
        AND c.status = 'ativo'
      WHERE ($1 = '' OR lower(i.title) LIKE '%' || $1 || '%' OR lower(i.description) LIKE '%' || $1 || '%')
        AND ($2 = '' OR lower(i.category) LIKE '%' || $2 || '%')
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `,
    [search, category]
  );

  return result.rows;
}

async function getImageById(id) {
  const result = await pool.query(
    `
      SELECT
        id,
        title,
        category,
        description,
        image_url AS "imageUrl",
        image_gallery AS "imageGallery",
        created_by AS "createdBy",
        created_at AS "createdAt"
      FROM images
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

function normalizeGallery(imageGallery = [], fallbackImageUrl = "") {
  const gallery = Array.isArray(imageGallery)
    ? imageGallery.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  if (!gallery.length && fallbackImageUrl) {
    gallery.push(String(fallbackImageUrl).trim());
  }

  return gallery;
}

async function createImage({ title, category, description, imageUrl, imageGallery, createdBy }) {
  await createCategories([category], "manual");
  const gallery = normalizeGallery(imageGallery, imageUrl);

  const result = await pool.query(
    `
      INSERT INTO images (title, category, description, image_url, image_gallery, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        title,
        category,
        description,
        image_url AS "imageUrl",
        image_gallery AS "imageGallery",
        created_by AS "createdBy",
        created_at AS "createdAt"
    `,
    [title, category, description, gallery[0], JSON.stringify(gallery), createdBy]
  );

  return result.rows[0];
}

async function updateImage(id, { title, category, description, imageUrl, imageGallery }) {
  await createCategories([category], "manual");
  const gallery = normalizeGallery(imageGallery, imageUrl);

  const result = await pool.query(
    `
      UPDATE images
      SET
        title = $1,
        category = $2,
        description = $3,
        image_url = $4,
        image_gallery = $5
      WHERE id = $6
      RETURNING
        id,
        title,
        category,
        description,
        image_url AS "imageUrl",
        image_gallery AS "imageGallery",
        created_by AS "createdBy",
        created_at AS "createdAt"
    `,
    [title, category, description, gallery[0], JSON.stringify(gallery), id]
  );

  return result.rows[0] || null;
}

async function deleteImage(id) {
  const result = await pool.query(
    `
      DELETE FROM images
      WHERE id = $1
      RETURNING
        id,
        title,
        category,
        description,
        image_url AS "imageUrl",
        image_gallery AS "imageGallery",
        created_by AS "createdBy",
        created_at AS "createdAt"
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function listCategories() {
  const result = await pool.query(
    `
      SELECT id, name, source, created_at AS "createdAt"
      FROM categories
      ORDER BY lower(name)
    `
  );

  return result.rows;
}

async function createCategories(names = [], source = "dataset") {
  const normalized = [...new Set(
    names
      .map((name) => String(name || "").trim())
      .filter(Boolean)
  )];

  if (!normalized.length) {
    return [];
  }

  const inserted = [];
  for (const name of normalized) {
    const result = await pool.query(
      `
        INSERT INTO categories (name, source)
        VALUES ($1, $2)
        ON CONFLICT (name) DO UPDATE
          SET source = categories.source
        RETURNING id, name, source, created_at AS "createdAt"
      `,
      [name, source]
    );

    inserted.push(result.rows[0]);
  }

  return inserted;
}

async function getCategoryById(id) {
  const result = await pool.query(
    `
      SELECT id, name, source, created_at AS "createdAt"
      FROM categories
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function countImagesByCategoryName(name) {
  const result = await pool.query(
    `
      SELECT COUNT(*)::int AS total
      FROM images
      WHERE category = $1
    `,
    [name]
  );

  return result.rows[0].total;
}

async function updateCategory(id, name) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const currentResult = await client.query(
      `
        SELECT id, name, source, created_at AS "createdAt"
        FROM categories
        WHERE id = $1
      `,
      [id]
    );

    const current = currentResult.rows[0];
    if (!current) {
      await client.query("ROLLBACK");
      return null;
    }

    const trimmedName = String(name || "").trim();
    const updatedResult = await client.query(
      `
        UPDATE categories
        SET name = $1
        WHERE id = $2
        RETURNING id, name, source, created_at AS "createdAt"
      `,
      [trimmedName, id]
    );

    if (current.name !== trimmedName) {
      await client.query(
        `
          UPDATE images
          SET category = $1
          WHERE category = $2
        `,
        [trimmedName, current.name]
      );
    }

    await client.query("COMMIT");
    return updatedResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function deleteCategory(id) {
  const result = await pool.query(
    `
      DELETE FROM categories
      WHERE id = $1
      RETURNING id, name, source, created_at AS "createdAt"
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function listCommentsByImageId(imageId) {
  const result = await pool.query(
    `
      SELECT
        c.id,
        c.image_id AS "imageId",
        c.user_id AS "userId",
        c.text,
        c.status,
        c.created_at AS "createdAt",
        u.id AS "authorId",
        u.name AS "authorName",
        u.email AS "authorEmail",
        u.university AS "authorUniversity",
        u.role AS "authorRole"
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.image_id = $1
        AND c.status = 'ativo'
      ORDER BY c.created_at DESC
    `,
    [imageId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    imageId: row.imageId,
    userId: row.userId,
    text: row.text,
    status: row.status,
    createdAt: row.createdAt,
    user: {
      id: row.authorId,
      name: row.authorName,
      email: row.authorEmail,
      university: row.authorUniversity,
      role: row.authorRole
    }
  }));
}

async function createComment({ imageId, userId, text }) {
  const result = await pool.query(
    `
      INSERT INTO comments (image_id, user_id, text, status)
      VALUES ($1, $2, $3, 'ativo')
      RETURNING id, image_id AS "imageId", user_id AS "userId", text, status, created_at AS "createdAt"
    `,
    [imageId, userId, text]
  );

  return result.rows[0];
}

async function getCommentById(id) {
  const result = await pool.query(
    `
      SELECT id, image_id AS "imageId", user_id AS "userId", text, status, created_at AS "createdAt"
      FROM comments
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function updateCommentStatus(id, status) {
  const result = await pool.query(
    `
      UPDATE comments
      SET status = $1
      WHERE id = $2
      RETURNING id, image_id AS "imageId", user_id AS "userId", text, status, created_at AS "createdAt"
    `,
    [status, id]
  );

  return result.rows[0] || null;
}

module.exports = {
  connectionString,
  pool,
  hashPassword,
  sanitizeUser,
  initDb,
  getUserByEmail,
  getUserById,
  getUserByToken,
  listAdmins,
  countAdmins,
  createUser,
  updateAdmin,
  deleteAdmin,
  updateUserLoginState,
  createSession,
  removeSession,
  createPasswordResetToken,
  getValidPasswordResetToken,
  updateUserPassword,
  consumePasswordResetToken,
  listImages,
  getImageById,
  createImage,
  updateImage,
  deleteImage,
  listCategories,
  createCategories,
  getCategoryById,
  countImagesByCategoryName,
  updateCategory,
  deleteCategory,
  listCommentsByImageId,
  createComment,
  getCommentById,
  updateCommentStatus
};
