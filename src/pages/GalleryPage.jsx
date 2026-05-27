import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { emptyFilters } from "../constants/forms";
import { summarizeHtml } from "../utils/html";
import { buildWhatsAppShareUrl } from "../utils/share";

function GalleryPage({ api, categories, user }) {
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

  const featuredPost = images[0];
  const categoryCount = categories.length;
  const postCount = images.length;
  const commentTotal = useMemo(
    () => images.reduce((total, item) => total + (item.commentCount || 0), 0),
    [images]
  );

  return (
    <section className="stack home-stack">
      <section className="hero-banner">
        <div className="hero-banner-copy">
          <p className="hero-kicker">Bem-vindo ao</p>
          <h2>
            Img<span>Odonto</span>
          </h2>
        </div>
      </section>

      <section className="stack compact">
        <h3 className="section-heading">O que está procurando?</h3>
        <form
          className="search-strip"
          onSubmit={(event) => {
            event.preventDefault();
            loadImages(filters);
          }}
        >
          <div className="search-field">
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="Digite aqui"
            />
            <button className="icon-button search-submit" type="submit" aria-label="Buscar">
              ⌕
            </button>
          </div>

          <select
            className="filter-select"
            value={filters.category}
            onChange={(event) =>
              setFilters((current) => ({ ...current, category: event.target.value }))
            }
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </form>
      </section>

      {user?.role === "admin" ? (
        <section className="feature-grid">
          <article className="upload-showcase">
            <div className="upload-icon-box">↑</div>
            <h3>Gerencie imagens clínicas</h3>
            <p>Cadastre posts com múltiplas imagens, categorias e descrição técnica.</p>
            <Link className="primary-button link-button" to="/admin/imagens">
              Cadastrar imagem
            </Link>
          </article>

          <article className={`status-card${loading ? " disabled" : ""}`}>
            {featuredPost ? (
              <>
                <div className="status-card-copy">
                  <strong>Análise pronta</strong>
                  <span>Arquivo: {featuredPost.title}</span>
                </div>
                <Link className="status-action" to={`/post/${featuredPost.id}`}>
                  Analisar imagem
                </Link>
              </>
            ) : (
              <>
                <div className="status-card-copy">
                  <strong>Nenhum resultado encontrado</strong>
                  <span>Ajuste os filtros para localizar um caso.</span>
                </div>
                <button className="status-action" type="button" onClick={() => loadImages(emptyFilters)}>
                  Recarregar
                </button>
              </>
            )}
          </article>
        </section>
      ) : null}

      <article className="disclaimer-card">
        <p className="disclaimer-title">Clinical Disclaimer</p>
        <p>
          ImgOdonto é uma ferramenta de apoio ao estudo e à organização de conteúdos odontológicos.
          Todo material deve ser interpretado com acompanhamento profissional.
        </p>
        <p>
          O sistema não substitui julgamento clínico, diagnóstico definitivo ou tratamento
          médico-odontológico.
        </p>
      </article>

      {featuredPost ? (
        <section className="result-highlight">
          <div className="result-heading">
            <h3>Resultados encontrados</h3>
            <span>{featuredPost.category}</span>
          </div>
          <article className="result-card">
            <div className="result-card-top">
              <div>
                <h4>{featuredPost.title}</h4>
                <p>{summarizeHtml(featuredPost.description, 220)}</p>
              </div>
              <span className="outline-chip">{featuredPost.category}</span>
            </div>
            <img className="result-preview" src={featuredPost.imageUrl} alt={featuredPost.title} />
            <div className="result-actions">
              <Link className="ghost-button link-button" to={`/post/${featuredPost.id}`}>
                Abrir caso
              </Link>
              <a
                className="primary-button link-button"
                href={buildWhatsAppShareUrl({
                  title: featuredPost.title,
                  category: featuredPost.category,
                  path: `/post/${featuredPost.id}`
                })}
                target="_blank"
                rel="noreferrer"
              >
                Compartilhar no WhatsApp
              </a>
            </div>
          </article>
        </section>
      ) : null}

      <section className="cases-section stack">
        <div className="section-title-row">
          <div className="stack compact">
            <h3 className="section-heading">Casos de diagnóstico sugeridos</h3>
            <p className="section-copy">
              Casos clínicos selecionados para análise comparativa e treinamento.
            </p>
          </div>
          <div className="metrics-pill">
            <span>{postCount} casos</span>
            <span>{categoryCount} categorias</span>
            <span>{commentTotal} comentários</span>
          </div>
        </div>

        {loading ? <p>Carregando posts...</p> : null}
        {!loading && images.length === 0 ? <p>Nenhum post encontrado.</p> : null}

        <div className="gallery-feed">
          {images.map((image, index) => (
            <article className="feed-card" key={image.id}>
              <div className="feed-image-wrap">
                <Link className="post-card-link" to={`/post/${image.id}`}>
                  <img className="feed-image" src={image.imageUrl} alt={image.title} />
                </Link>
                <span className="feed-id">ID: DX-{4090 + index}</span>
              </div>
              <div className="stack compact">
                <span className="feed-kicker">Upload recente</span>
                <Link className="post-title-link" to={`/post/${image.id}`}>
                  <h3>{image.title}</h3>
                </Link>
                <p className="muted-text">{image.category}</p>
                <p>{summarizeHtml(image.description, 140)}</p>
                <div className="post-actions">
                  <Link className="text-link" to={`/post/${image.id}`}>
                    Abrir post
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
                    WhatsApp
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default GalleryPage;
