import { useState } from "react";

function CategoryAdminPage({
  categories,
  onImport,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onMessage
}) {
  const [file, setFile] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [lastImport, setLastImport] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      onMessage({ text: "Selecione um arquivo CSV.", type: "error" });
      return;
    }

    setSubmitting(true);

    try {
      const result = await onImport(file);
      setLastImport(result.categories);
      setFile(null);
      event.currentTarget.reset();
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateCategorySubmit(event) {
    event.preventDefault();

    if (!newCategory.trim()) {
      onMessage({ text: "Informe o nome da nova categoria.", type: "error" });
      return;
    }

    setCreatingCategory(true);

    try {
      await onCreateCategory(newCategory);
      setNewCategory("");
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleEditSubmit(event) {
    event.preventDefault();

    if (!editingCategoryId || !editingName.trim()) {
      onMessage({ text: "Informe o novo nome da categoria.", type: "error" });
      return;
    }

    setSavingEdit(true);

    try {
      await onUpdateCategory(editingCategoryId, editingName);
      setEditingCategoryId(null);
      setEditingName("");
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(category) {
    const confirmed = window.confirm(`Deseja realmente excluir a categoria "${category.name}"?`);

    if (!confirmed) {
      return;
    }

    setDeletingId(category.id);

    try {
      await onDeleteCategory(category.id);
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="stack">
      <section className="hero-banner compact-hero">
        <div className="hero-banner-copy">
          <p className="hero-kicker">Área administrativa</p>
          <h2>Categorias clínicas</h2>
          <p>Importe categorias por CSV ou crie manualmente novos grupos de organização.</p>
        </div>
        <div className="metrics-pill">
          <span>{categories.length} categorias</span>
          <span>{lastImport?.length || 0} no último envio</span>
        </div>
      </section>

      <section className="admin-layout">
        <article className="spotlight-card admin-side-card">
          <p className="eyebrow">Controle do acervo</p>
          <h2>Organização por categoria</h2>
          <p>
            Mantenha o vocabulário do sistema padronizado para melhorar filtros, buscas e
            cadastro de casos.
          </p>
          <div className="admin-bullet-list">
            <span>Importação CSV</span>
            <span>Criação manual</span>
            <span>Edição e exclusão</span>
          </div>
        </article>

        <article className="form-card wide admin-main-card stack">
          <form className="stack" onSubmit={handleSubmit}>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              required
            />
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Importando..." : "Importar dataset"}
            </button>
          </form>

          <form className="stack" onSubmit={handleCreateCategorySubmit}>
            <input
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
              placeholder="Criar nova categoria manualmente"
            />
            <button className="secondary" type="submit" disabled={creatingCategory}>
              {creatingCategory ? "Criando..." : "Criar categoria"}
            </button>
          </form>

          {lastImport?.length ? (
            <div className="stack compact">
              <h3>Categorias detectadas no último envio</h3>
              <div className="tag-cloud">
                {lastImport.map((category) => (
                  <span key={category.id || category.name} className="tag-chip">
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="stack compact">
            <h3>Categorias atuais</h3>
            <div className="category-list">
              {categories.map((category) => (
                <div key={category.id} className="category-row">
                  {editingCategoryId === category.id ? (
                    <form className="category-edit-form" onSubmit={handleEditSubmit}>
                      <input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        placeholder="Novo nome da categoria"
                      />
                      <button className="primary-button" type="submit" disabled={savingEdit}>
                        {savingEdit ? "Salvando..." : "Salvar"}
                      </button>
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => {
                          setEditingCategoryId(null);
                          setEditingName("");
                        }}
                      >
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="tag-chip muted">{category.name}</span>
                      <div className="inline-actions">
                        <button
                          className="secondary"
                          type="button"
                          onClick={() => {
                            setEditingCategoryId(category.id);
                            setEditingName(category.name);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="secondary"
                          type="button"
                          onClick={() => handleDelete(category)}
                          disabled={deletingId === category.id}
                        >
                          {deletingId === category.id ? "Excluindo..." : "Excluir"}
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
    </section>
  );
}

export default CategoryAdminPage;
