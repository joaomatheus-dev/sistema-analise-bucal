import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { emptyFilters } from "../constants/forms";
import { buildWhatsAppShareUrl } from "../utils/share";

function GalleryPage({ api, categories }) {
  const [filters, setFilters] = useState(emptyFilters);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadImages(activeFilters = filters) {
    setLoading(true);

    try {
      const query = new URLSearchParams(activeFilters).toString();
      const data = await api(`/api/images${query ? `?${query}` : ""}`);
      setImages(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadImages(emptyFilters);
  }, []);

  return (
    <section className="stack">
      <div className="hero-panel">
        <div>
          <h2>Biblioteca de posts odontológicos</h2>
        </div>

        <form
          className="filter-grid"
          onSubmit={(event) => {
            event.preventDefault();
            loadImages(filters);
          }}
        >
          <input
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Pesquisar título ou descrição"
          />
          <select
            value={filters.category}
            onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          <button type="submit">Buscar</button>
        </form>
      </div>

      {loading ? <p>Carregando posts...</p> : null}
      {!loading && images.length === 0 ? <p>Nenhum post encontrado.</p> : null}

      <div className="gallery-grid">
        {images.map((image) => (
          <article className="post-card" key={image.id}>
            <Link className="post-card-link" to={`/post/${image.id}`}>
              <img className="case-media" src={image.imageUrl} alt={image.title} />
            </Link>
            <div className="stack">
              <div className="case-header">
                <div className="stack compact">
                  <Link className="post-title-link" to={`/post/${image.id}`}>
                    <h3>{image.title}</h3>
                  </Link>
                  <p className="muted-text">{image.category}</p>
                </div>
                <span className="badge">
                  {(image.imageGallery?.length || 1)} imagens | {image.commentCount} comentários
                </span>
              </div>

              <p>{image.description}</p>
              <div className="post-actions">
                <Link className="text-link" to={`/post/${image.id}`}>
                  Abrir post e visualizar galeria
                </Link>
                <a
                  className="share-link"
                  href={buildWhatsAppShareUrl({
                    title: image.title,
                    category: image.category,
                    path: `/post/${image.id}`
                  })}
                  target="_blank"
                  rel="noreferrer"
                >
                  Compartilhar no WhatsApp
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default GalleryPage;
