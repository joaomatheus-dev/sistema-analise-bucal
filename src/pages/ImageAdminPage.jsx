import { useEffect, useState } from "react";
import { emptyImage } from "../constants/forms";
import { fileToDataUrl, mergeGallerySources } from "../utils/images";

function ImageAdminPage({ api, categories, onSubmit, onUpdate, onDelete, onMessage }) {
  const [form, setForm] = useState(emptyImage);
  const [submitting, setSubmitting] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postFilterCategory, setPostFilterCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState(emptyImage);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function loadPosts() {
    setLoadingPosts(true);

    try {
      const data = await api("/api/images");
      setPosts(data);
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    } finally {
      setLoadingPosts(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit({
        ...form,
        imageUrl: form.imageUrl
      });
      setForm(emptyImage);
      await loadPosts();
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    setSavingEdit(true);

    try {
      await onUpdate(editingId, editingForm);
      setEditingId(null);
      setEditingForm(emptyImage);
      await loadPosts();
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeletePost(post) {
    const confirmed = window.confirm(`Deseja realmente excluir o post "${post.title}"?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(post.id);

    try {
      await onDelete(post.id);
      await loadPosts();
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreateLocalImageChange(event) {
    const files = [...(event.target.files || [])];
    if (!files.length) {
      return;
    }

    try {
      const dataUrls = await Promise.all(files.map((file) => fileToDataUrl(file)));
      setForm((current) => ({
        ...current,
        imageUrl: current.imageUrl || dataUrls[0],
        imageGallery: [...current.imageGallery, ...dataUrls],
        imageFileName: files.map((file) => file.name).join(", ")
      }));
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    }
  }

  async function handleEditLocalImageChange(event) {
    const files = [...(event.target.files || [])];
    if (!files.length) {
      return;
    }

    try {
      const dataUrls = await Promise.all(files.map((file) => fileToDataUrl(file)));
      setEditingForm((current) => ({
        ...current,
        imageUrl: current.imageUrl || dataUrls[0],
        imageGallery: [...current.imageGallery, ...dataUrls],
        imageFileName: files.map((file) => file.name).join(", ")
      }));
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    }
  }

  const filteredPosts = posts.filter(
    (post) => !postFilterCategory || post.category === postFilterCategory
  );

  return (
    <section className="admin-layout">
      <article className="spotlight-card">
        <p className="eyebrow">Área administrativa</p>
        <h2>Cadastro de imagens</h2>
        <p>
          Publique novos casos e escolha categorias ja existentes ou crie uma nova categoria
          diretamente no cadastro.
        </p>
      </article>

      <article className="form-card wide">
        <form className="stack" onSubmit={handleSubmit}>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Título do caso"
            required
          />

          <select
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
            required={!form.customCategory.trim()}
          >
            <option value="">Selecionar categoria existente</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            value={form.customCategory}
            onChange={(event) => setForm((current) => ({ ...current, customCategory: event.target.value }))}
            placeholder="Ou criar nova categoria"
          />

          <input type="file" accept="image/*" multiple onChange={handleCreateLocalImageChange} />
          {form.imageFileName ? (
            <p className="muted-text">Imagem local selecionada: {form.imageFileName}</p>
          ) : null}
          {mergeGallerySources(form).length ? (
            <div className="thumb-strip">
              {mergeGallerySources(form).map((image, index) => (
                <img
                  key={`${image}-${index}`}
                  className="thumb-image"
                  src={image}
                  alt={`Preview ${index + 1}`}
                />
              ))}
            </div>
          ) : null}

          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Descrição clínica"
            required
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Publicando..." : "Publicar imagem"}
          </button>
        </form>

        <div className="stack compact section-divider">
          <div className="posts-toolbar">
            <h3>Posts cadastrados</h3>
            <select
              value={postFilterCategory}
              onChange={(event) => setPostFilterCategory(event.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {loadingPosts ? <p>Carregando posts...</p> : null}
          {!loadingPosts && filteredPosts.length === 0 ? <p>Nenhum post encontrado.</p> : null}

          <div className="category-list">
            {filteredPosts.map((post) => (
              <div key={post.id} className="post-admin-card">
                {editingId === post.id ? (
                  <form className="stack" onSubmit={handleEditSubmit}>
                    <input
                      value={editingForm.title}
                      onChange={(event) =>
                        setEditingForm((current) => ({ ...current, title: event.target.value }))
                      }
                      placeholder="Título do caso"
                      required
                    />
                    <select
                      value={editingForm.category}
                      onChange={(event) =>
                        setEditingForm((current) => ({ ...current, category: event.target.value }))
                      }
                      required={!editingForm.customCategory.trim()}
                    >
                      <option value="">Selecionar categoria existente</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={editingForm.customCategory}
                      onChange={(event) =>
                        setEditingForm((current) => ({ ...current, customCategory: event.target.value }))
                      }
                      placeholder="Ou criar nova categoria"
                    />
                    <input type="file" accept="image/*" multiple onChange={handleEditLocalImageChange} />
                    {editingForm.imageFileName ? (
                      <p className="muted-text">
                        Imagem local selecionada: {editingForm.imageFileName}
                      </p>
                    ) : null}
                    {mergeGallerySources(editingForm).length ? (
                      <div className="thumb-strip">
                        {mergeGallerySources(editingForm).map((image, index) => (
                          <img
                            key={`${image}-${index}`}
                            className="thumb-image"
                            src={image}
                            alt={`Preview ${index + 1}`}
                          />
                        ))}
                      </div>
                    ) : null}
                    <textarea
                      value={editingForm.description}
                      onChange={(event) =>
                        setEditingForm((current) => ({ ...current, description: event.target.value }))
                      }
                      placeholder="Descrição clínica"
                      required
                    />
                    <div className="inline-actions">
                      <button type="submit" disabled={savingEdit}>
                        {savingEdit ? "Salvando..." : "Salvar"}
                      </button>
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditingForm(emptyImage);
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="stack compact">
                      <strong>{post.title}</strong>
                      <span className="muted-text">{post.category}</span>
                      <span className="muted-text">
                        {(post.imageGallery?.length || 1)} imagens | {post.commentCount} comentários
                      </span>
                      <img className="admin-thumb" src={post.imageUrl} alt={post.title} />
                      <p>{post.description}</p>
                    </div>
                    <div className="inline-actions">
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => {
                          setEditingId(post.id);
                          setEditingForm({
                            title: post.title,
                            category: post.category,
                            customCategory: "",
                            imageUrl: post.imageUrl,
                            description: post.description,
                            imageFileName: "",
                            imageGallery: post.imageGallery || []
                          });
                        }}
                      >
                        Editar post
                      </button>
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => handleDeletePost(post)}
                        disabled={deletingId === post.id}
                      >
                        {deletingId === post.id ? "Excluindo..." : "Excluir post"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </article>
    </section>
  );
}

export default ImageAdminPage;
