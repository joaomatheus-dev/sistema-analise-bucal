const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const {
  connectionString,
  hashPassword,
  sanitizeUser,
  initDb,
  getUserByEmail,
  getUserById,
  getUserByToken,
  listAdmins,
  listUserUniversitiesDashboard,
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
} = require("./db");

const PORT = process.env.PORT || 3000;
const CLIENT_DIST_DIR = path.join(__dirname, "dist");

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-file-name");
}

function jsonResponse(res, statusCode, payload) {
  setCorsHeaders(res);
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  jsonResponse(res, 404, { error: "Recurso não encontrado." });
}

function normalizeDatasetValue(value) {
  return String(value || "").trim();
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseCsv(content) {
  const lines = String(content || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const columns = parseCsvLine(line);
    return headers.reduce((record, header, index) => {
      record[header] = columns[index] || "";
      return record;
    }, {});
  });
}

function extractCategoriesFromRecords(records) {
  const candidateKeys = ["category", "categoria", "subcategoria", "classificacao", "classe"];
  const categories = new Set();

  for (const record of records) {
    if (typeof record === "string") {
      const value = normalizeDatasetValue(record);
      if (value) {
        categories.add(value);
      }
      continue;
    }

    if (!record || typeof record !== "object") {
      continue;
    }

    const keys = Object.keys(record);
    const matchedKeys = keys.filter((key) => candidateKeys.includes(key.toLowerCase()));
    const keysToUse = matchedKeys.length ? matchedKeys : keys.slice(0, 2);

    for (const key of keysToUse) {
      const rawValue = record[key];

      if (Array.isArray(rawValue)) {
        rawValue.forEach((item) => {
          const value = normalizeDatasetValue(item);
          if (value) {
            categories.add(value);
          }
        });
        continue;
      }

      const value = normalizeDatasetValue(rawValue);
      if (value) {
        categories.add(value);
      }
    }
  }

  return [...categories];
}

function parseDataset({ fileName, content }) {
  const normalizedName = String(fileName || "").toLowerCase();
  const rawContent = String(content || "").trim();

  if (!rawContent) {
    throw new Error("O dataset enviado está vazio.");
  }

  if (normalizedName.endsWith(".json")) {
    const parsed = JSON.parse(rawContent);
    const records = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.categories)
        ? parsed.categories
        : Array.isArray(parsed.data)
          ? parsed.data
          : [parsed];
    return extractCategoriesFromRecords(records);
  }

  if (normalizedName.endsWith(".csv")) {
    return extractCategoriesFromRecords(parseCsv(rawContent));
  }

  throw new Error("Formato de dataset inválido. Use CSV ou JSON.");
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        reject(new Error("Payload muito grande."));
      }
    });

    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(new Error("JSON inválido."));
      }
    });

    req.on("error", reject);
  });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        reject(new Error("Payload muito grande."));
      }
    });

    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function inferDatasetFileName(req) {
  const fileName = req.headers["x-file-name"];
  if (fileName) {
    return String(fileName);
  }

  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  if (contentType.includes("json")) {
    return "dataset.json";
  }

  return "dataset.csv";
}

function formatBlockedUntil(dateString) {
  return new Date(dateString).toLocaleString("pt-BR");
}

async function getSession(req) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer (.+)$/i);
  if (!match) {
    return null;
  }

  const token = match[1];
  return await getUserByToken(token);
}

function sendStaticFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".json": "application/json; charset=utf-8"
  };

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Erro interno ao carregar arquivo.");
      return;
    }

    res.writeHead(200, { "Content-Type": contentTypes[ext] || "text/plain; charset=utf-8" });
    res.end(content);
  });
}

async function requireAuth(req, res) {
  const user = await getSession(req);
  if (!user) {
    jsonResponse(res, 401, { error: "Autenticação obrigatória." });
    return null;
  }

  return user;
}

async function requireAdmin(req, res) {
  const user = await requireAuth(req, res);
  if (!user) {
    return null;
  }

  if (user.role !== "admin") {
    jsonResponse(res, 403, { error: "Acesso restrito ao administrador." });
    return null;
  }

  return user;
}

function serveClientFallback(res) {
  const html = `<!DOCTYPE html>
  <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>API Análise Bucal</title>
      <style>
        body { font-family: Georgia, serif; background: #f5efe6; color: #2d1f16; margin: 0; padding: 40px; }
        main { max-width: 680px; margin: 0 auto; background: #fffaf4; border: 1px solid #d8c3ad; border-radius: 20px; padding: 24px; }
        code { background: #efe4d5; padding: 2px 6px; border-radius: 6px; }
      </style>
    </head>
    <body>
      <main>
        <h1>API do sistema de análise bucal</h1>
        <p>O frontend React ainda não foi gerado em build.</p>
        <p>Use <code>npm run dev</code> para o cliente React e <code>npm run dev:server</code> para a API.</p>
      </main>
    </body>
  </html>`;

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

async function handleApi(req, res, url) {
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/register") {
    const body = await parseBody(req);
    const { name, email, university, password, confirmPassword } = body;

    if (!name || !email || !university || !password || !confirmPassword) {
      return jsonResponse(res, 400, { error: "Preencha todos os campos obrigatórios." });
    }

    if (password !== confirmPassword) {
      return jsonResponse(res, 400, { error: "As senhas não conferem." });
    }

    if (password.length < 8) {
      return jsonResponse(res, 400, { error: "A senha deve ter ao menos 8 caracteres." });
    }

    const emailInUse = await getUserByEmail(email);
    if (emailInUse) {
      return jsonResponse(res, 409, { error: "Este e-mail já está cadastrado." });
    }

    await createUser({ name, email, university, password });
    return jsonResponse(res, 201, { message: "Usuário cadastrado com sucesso." });
  }

  if (req.method === "GET" && url.pathname === "/api/admins") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    return jsonResponse(res, 200, await listAdmins());
  }

  if (req.method === "GET" && url.pathname === "/api/dashboard/universities") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const dashboard = await listUserUniversitiesDashboard();
    return jsonResponse(res, 200, {
      universities: dashboard.universities,
      totalUniversities: dashboard.universities.length,
      totalUsers: dashboard.totalUsers
    });
  }

  if (req.method === "POST" && url.pathname === "/api/admins") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const body = await parseBody(req);
    const { name, email, university, password, confirmPassword } = body;

    if (!name || !email || !university || !password || !confirmPassword) {
      return jsonResponse(res, 400, { error: "Preencha todos os campos obrigatórios." });
    }

    if (password !== confirmPassword) {
      return jsonResponse(res, 400, { error: "As senhas não conferem." });
    }

    if (password.length < 8) {
      return jsonResponse(res, 400, { error: "A senha deve ter ao menos 8 caracteres." });
    }

    const emailInUse = await getUserByEmail(email);
    if (emailInUse) {
      return jsonResponse(res, 409, { error: "Este e-mail já está cadastrado." });
    }

    const createdAdmin = await createUser({
      name,
      email,
      university,
      password,
      role: "admin"
    });

    return jsonResponse(res, 201, {
      message: "Administrador cadastrado com sucesso.",
      admin: createdAdmin
    });
  }

  const adminMatch = url.pathname.match(/^\/api\/admins\/(\d+)$/);
  if (adminMatch && req.method === "PATCH") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const adminId = Number(adminMatch[1]);
    const body = await parseBody(req);
    const { name, email, university, password, confirmPassword } = body;

    if (!name || !email || !university) {
      return jsonResponse(res, 400, { error: "Preencha nome, e-mail e universidade." });
    }

    if ((password || confirmPassword) && password !== confirmPassword) {
      return jsonResponse(res, 400, { error: "As senhas não conferem." });
    }

    if (password && password.length < 8) {
      return jsonResponse(res, 400, { error: "A senha deve ter ao menos 8 caracteres." });
    }

    const existingAdmin = await getUserById(adminId);
    if (!existingAdmin || existingAdmin.role !== "admin") {
      return jsonResponse(res, 404, { error: "Administrador não encontrado." });
    }

    const emailInUse = await getUserByEmail(email);
    if (emailInUse && Number(emailInUse.id) !== adminId) {
      return jsonResponse(res, 409, { error: "Este e-mail já está cadastrado." });
    }

    const updatedAdmin = await updateAdmin(adminId, {
      name,
      email,
      university,
      password: password || ""
    });

    return jsonResponse(res, 200, {
      message: "Administrador atualizado com sucesso.",
      admin: updatedAdmin
    });
  }

  if (adminMatch && req.method === "DELETE") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const adminId = Number(adminMatch[1]);
    const existingAdmin = await getUserById(adminId);
    if (!existingAdmin || existingAdmin.role !== "admin") {
      return jsonResponse(res, 404, { error: "Administrador não encontrado." });
    }

    if (Number(admin.id) === adminId) {
      return jsonResponse(res, 409, { error: "Você não pode excluir o próprio usuário administrador." });
    }

    const totalAdmins = await countAdmins();
    if (totalAdmins <= 1) {
      return jsonResponse(res, 409, { error: "Não é possível excluir o último administrador do sistema." });
    }

    const deletedAdmin = await deleteAdmin(adminId);
    return jsonResponse(res, 200, {
      message: "Administrador excluído com sucesso.",
      admin: deletedAdmin
    });
  }

  if (req.method === "POST" && url.pathname === "/api/login") {
    const body = await parseBody(req);
    const { email, password } = body;
    const user = await getUserByEmail(String(email || ""));

    if (!user) {
      return jsonResponse(res, 401, { error: "Credenciais inválidas." });
    }

    if (user.blocked_until && new Date(user.blocked_until) > new Date()) {
      return jsonResponse(res, 423, {
        error: `Conta temporariamente bloqueada por tentativas falhas até ${formatBlockedUntil(user.blocked_until)}.`
      });
    }

    if (user.password_hash !== hashPassword(password || "")) {
      let failedLoginCount = user.failed_login_count + 1;
      let blockedUntil = user.blocked_until;

      if (failedLoginCount >= 5) {
        blockedUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        failedLoginCount = 0;
        await updateUserLoginState(user.id, failedLoginCount, blockedUntil);
        return jsonResponse(res, 423, {
          error: `Senha incorreta. Conta bloqueada por 10 minutos até ${formatBlockedUntil(blockedUntil)}.`
        });
      }

      await updateUserLoginState(user.id, failedLoginCount, blockedUntil);
      return jsonResponse(res, 401, {
        error: `Senha incorreta. Restam ${5 - failedLoginCount} tentativa(s) antes do bloqueio temporário.`
      });
    }

    await updateUserLoginState(user.id, 0, null);
    const token = await createSession(user.id);

    return jsonResponse(res, 200, {
      token,
      user: sanitizeUser(user)
    });
  }

  if (req.method === "POST" && url.pathname === "/api/password-recovery-request") {
    const body = await parseBody(req);
    const email = String(body.email || "").trim();

    if (!email) {
      return jsonResponse(res, 400, { error: "Informe o e-mail para recuperar a senha." });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return jsonResponse(res, 404, { error: "Nenhum usuário foi encontrado com este e-mail." });
    }

    const recovery = await createPasswordResetToken(user.id);
    return jsonResponse(res, 200, {
      message: "Solicitação de recuperação criada com sucesso.",
      recoveryToken: recovery.token,
      recoveryUrl: `/redefinir-senha?token=${recovery.token}&email=${encodeURIComponent(user.email)}`,
      expiresAt: recovery.expiresAt
    });
  }

  if (req.method === "POST" && url.pathname === "/api/password-reset") {
    const body = await parseBody(req);
    const token = String(body.token || "").trim();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");

    if (!token || !password || !confirmPassword) {
      return jsonResponse(res, 400, { error: "Token e nova senha são obrigatórios." });
    }

    if (password !== confirmPassword) {
      return jsonResponse(res, 400, { error: "As senhas não conferem." });
    }

    if (password.length < 8) {
      return jsonResponse(res, 400, { error: "A senha deve ter ao menos 8 caracteres." });
    }

    const resetToken = await getValidPasswordResetToken(token);
    if (!resetToken) {
      return jsonResponse(res, 400, { error: "Token de recuperação inválido ou expirado." });
    }

    await updateUserPassword(resetToken.userId, password);
    await consumePasswordResetToken(token);

    return jsonResponse(res, 200, {
      message: "Senha redefinida com sucesso."
    });
  }

  if (req.method === "POST" && url.pathname === "/api/logout") {
    const authHeader = req.headers.authorization || "";
    const match = authHeader.match(/^Bearer (.+)$/i);

    if (match) {
      await removeSession(match[1]);
    }

    return jsonResponse(res, 200, { message: "Sessão encerrada com sucesso." });
  }

  if (req.method === "GET" && url.pathname === "/api/images") {
    const search = (url.searchParams.get("search") || "").toLowerCase();
    const category = (url.searchParams.get("category") || "").toLowerCase();
    const filtered = await listImages({ search, category });

    return jsonResponse(res, 200, filtered);
  }

  if (req.method === "GET" && url.pathname === "/api/categories") {
    return jsonResponse(res, 200, await listCategories());
  }

  if (req.method === "POST" && url.pathname === "/api/categories") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const body = await parseBody(req);
    const categoryName = String(body.name || "").trim();

    if (!categoryName) {
      return jsonResponse(res, 400, { error: "Nome da categoria obrigatório." });
    }

    const created = await createCategories([categoryName], "manual");
    return jsonResponse(res, 201, {
      message: "Categoria criada com sucesso.",
      category: created[0]
    });
  }

  const categoryMatch = url.pathname.match(/^\/api\/categories\/(\d+)$/);
  if (categoryMatch && req.method === "PATCH") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const body = await parseBody(req);
    const categoryId = Number(categoryMatch[1]);
    const categoryName = String(body.name || "").trim();

    if (!categoryName) {
      return jsonResponse(res, 400, { error: "Nome da categoria obrigatório." });
    }

    const existing = await getCategoryById(categoryId);
    if (!existing) {
      return jsonResponse(res, 404, { error: "Categoria não encontrada." });
    }

    const updated = await updateCategory(categoryId, categoryName);
    return jsonResponse(res, 200, {
      message: "Categoria atualizada com sucesso.",
      category: updated
    });
  }

  if (categoryMatch && req.method === "DELETE") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const categoryId = Number(categoryMatch[1]);
    const existing = await getCategoryById(categoryId);
    if (!existing) {
      return jsonResponse(res, 404, { error: "Categoria não encontrada." });
    }

    const usageCount = await countImagesByCategoryName(existing.name);
    if (usageCount > 0) {
      return jsonResponse(res, 409, {
        error: "Não é possível excluir uma categoria que já está vinculada a imagens."
      });
    }

    const deleted = await deleteCategory(categoryId);
    return jsonResponse(res, 200, {
      message: "Categoria excluida com sucesso.",
      category: deleted
    });
  }

  if (req.method === "POST" && url.pathname === "/api/images") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const body = await parseBody(req);
    const { title, category, description, imageUrl, imageGallery } = body;

    if (
      !title ||
      !category ||
      !description ||
      (!imageUrl && (!Array.isArray(imageGallery) || imageGallery.length === 0))
    ) {
      return jsonResponse(res, 400, { error: "Título, categoria, descrição e pelo menos uma imagem são obrigatórios." });
    }

    const image = await createImage({
      title,
      category,
      description,
      imageUrl,
      imageGallery,
      createdBy: admin.id
    });
    return jsonResponse(res, 201, image);
  }

  const imageMatch = url.pathname.match(/^\/api\/images\/(\d+)$/);
  if (imageMatch && req.method === "GET") {
    const imageId = Number(imageMatch[1]);
    const image = await getImageById(imageId);
    if (!image) {
      return jsonResponse(res, 404, { error: "Post não encontrado." });
    }

    return jsonResponse(res, 200, image);
  }

  if (imageMatch && req.method === "PATCH") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const imageId = Number(imageMatch[1]);
    const existing = await getImageById(imageId);
    if (!existing) {
      return jsonResponse(res, 404, { error: "Imagem não encontrada." });
    }

    const body = await parseBody(req);
    const { title, category, description, imageUrl, imageGallery } = body;

    if (
      !title ||
      !category ||
      !description ||
      (!imageUrl && (!Array.isArray(imageGallery) || imageGallery.length === 0))
    ) {
      return jsonResponse(res, 400, { error: "Título, categoria, descrição e pelo menos uma imagem são obrigatórios." });
    }

    const updated = await updateImage(imageId, {
      title,
      category,
      description,
      imageUrl,
      imageGallery
    });

    return jsonResponse(res, 200, {
      message: "Post atualizado com sucesso.",
      image: updated
    });
  }

  if (imageMatch && req.method === "DELETE") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const imageId = Number(imageMatch[1]);
    const existing = await getImageById(imageId);
    if (!existing) {
      return jsonResponse(res, 404, { error: "Imagem não encontrada." });
    }

    const deleted = await deleteImage(imageId);
    return jsonResponse(res, 200, {
      message: "Post excluido com sucesso.",
      image: deleted
    });
  }

  if (req.method === "POST" && url.pathname === "/api/datasets/import") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const contentType = String(req.headers["content-type"] || "").toLowerCase();
    const body = contentType.includes("application/json")
      ? await parseBody(req)
      : {
          fileName: inferDatasetFileName(req),
          content: await readRawBody(req)
        };
    const categories = parseDataset(body);

    if (!categories.length) {
      return jsonResponse(res, 400, {
        error: "Não foi possível identificar categorias no dataset enviado."
      });
    }

    const created = await createCategories(categories, "dataset");
    return jsonResponse(res, 201, {
      message: "Dataset importado com sucesso.",
      categories: created
    });
  }

  const commentsMatch = url.pathname.match(/^\/api\/images\/(\d+)\/comments$/);
  if (commentsMatch && req.method === "GET") {
    const imageId = Number(commentsMatch[1]);
    const comments = await listCommentsByImageId(imageId);

    return jsonResponse(res, 200, comments);
  }

  if (commentsMatch && req.method === "POST") {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    const imageId = Number(commentsMatch[1]);
    const image = await getImageById(imageId);
    if (!image) {
      return jsonResponse(res, 404, { error: "Imagem não encontrada." });
    }

    const body = await parseBody(req);
    if (!body.text) {
      return jsonResponse(res, 400, { error: "Comentário obrigatório." });
    }

    const comment = await createComment({
      imageId,
      userId: user.id,
      text: body.text
    });
    return jsonResponse(res, 201, comment);
  }

  const moderateMatch = url.pathname.match(/^\/api\/comments\/(\d+)$/);
  if (moderateMatch && req.method === "PATCH") {
    const admin = await requireAdmin(req, res);
    if (!admin) {
      return;
    }

    const body = await parseBody(req);
    const comment = await getCommentById(Number(moderateMatch[1]));
    if (!comment) {
      return jsonResponse(res, 404, { error: "Comentário não encontrado." });
    }

    if (!["ativo", "oculto", "excluido"].includes(body.status)) {
      return jsonResponse(res, 400, { error: "Status de moderação inválido." });
    }

    return jsonResponse(res, 200, await updateCommentStatus(comment.id, body.status));
  }

  if (req.method === "GET" && url.pathname === "/api/me") {
    const user = await requireAuth(req, res);
    if (!user) {
      return;
    }

    return jsonResponse(res, 200, sanitizeUser(user));
  }

  notFound(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const filePath = path.normalize(path.join(CLIENT_DIST_DIR, requestedPath));

    if (!filePath.startsWith(CLIENT_DIST_DIR)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Acesso negado.");
      return;
    }

    fs.stat(filePath, (error, stats) => {
      if (error || !stats.isFile()) {
        const indexPath = path.join(CLIENT_DIST_DIR, "index.html");

        fs.stat(indexPath, (indexError, indexStats) => {
          if (indexError || !indexStats.isFile()) {
            serveClientFallback(res);
            return;
          }

          sendStaticFile(res, indexPath);
        });

        return;
      }

      sendStaticFile(res, filePath);
    });
  } catch (error) {
    jsonResponse(res, 500, { error: error.message || "Erro interno do servidor." });
  }
});

async function start() {
  await initDb();

  server.listen(PORT, () => {
    console.log(`Servidor iniciado em http://localhost:${PORT}`);
    console.log("Admin padrão: admin@analisebucal.com / Admin@123");
    console.log(`PostgreSQL: ${connectionString}`);
  });
}

start().catch((error) => {
  const details =
    error.message ||
    error.code ||
    (Array.isArray(error.errors) && error.errors.length
      ? error.errors.map((item) => item.message).join(" | ")
      : "Erro desconhecido ao iniciar o servidor.");
  console.error("Falha ao iniciar o servidor:", details);
  process.exit(1);
});
