import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { buildWhatsAppShareUrl } from "../utils/share";

function PostDetailPage({ api, canComment, isAdmin, onMessage }) {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [activeTab, setActiveTab] = useState("description");

  async function loadPost() {
    setLoading(true);

    try {
      const [postData, commentData] = await Promise.all([
        api(`/api/images/${postId}`),
        api(`/api/images/${postId}/comments`)
      ]);
      setPost(postData);
      setComments(commentData);
      setSelectedImage(postData.imageGallery?.[0] || postData.imageUrl);
      setActiveTab("description");
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPost();
  }, [postId]);

  async function handleCommentSubmit(event) {
    event.preventDefault();

    try {
      await api(`/api/images/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: comment })
      });
      setComment("");
      await loadPost();
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    }
  }

  async function moderateComment(commentId, status) {
    try {
      await api(`/api/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await loadPost();
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    }
  }

  function handleZoomMove(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    setZoomOrigin({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y))
    });
  }

  if (loading) {
    return <p>Carregando post...</p>;
  }

  if (!post) {
    return <p>Post não encontrado.</p>;
  }

  const gallery = post.imageGallery?.length ? post.imageGallery : [post.imageUrl];
  const shareUrl = buildWhatsAppShareUrl({
    title: post.title,
    category: post.category,
    path: `/post/${postId}`
  });

  return (
    <section className="stack post-screen">
      <section className="hero-banner compact-hero">
        <div className="hero-banner-copy">
          <p className="hero-kicker">Resultado do caso</p>
          <h2>{post.title}</h2>
          <p>{post.category}</p>
        </div>
        <div className="hero-actions">
          <Link className="ghost-button link-button" to="/">
            Voltar
          </Link>
          <a className="primary-button link-button" href={shareUrl} target="_blank" rel="noreferrer">
            Compartilhar
          </a>
        </div>
      </section>

      <div className="stack">
        <div className="stack">
          <button
            className={`zoom-stage figma-zoom-stage${zoomed ? " zoomed" : ""}`}
            type="button"
            onClick={() => setZoomed((current) => !current)}
            onMouseMove={handleZoomMove}
            onMouseEnter={handleZoomMove}
          >
            <img
              src={selectedImage}
              alt={post.title}
              className="zoom-image"
              style={{ transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%` }}
            />
          </button>

          <div className="thumb-strip">
            {gallery.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={`thumb-button${selectedImage === image ? " active" : ""}`}
                onClick={() => {
                  setSelectedImage(image);
                  setZoomed(false);
                }}
              >
                <img src={image} alt={`${post.title} ${index + 1}`} className="thumb-image" />
              </button>
            ))}
          </div>
        </div>

        <article className="result-card emphasis-card">
          <div className="result-card-top">
            <div className="stack compact">
              <h3>{post.category}</h3>
              <p className="muted-text">{post.title}</p>
            </div>
            <span className="outline-chip">Caso clínico</span>
          </div>

          <div className="result-actions">
            <span className="outline-chip">{gallery.length} imagens</span>
            <span className="outline-chip">{comments.length} comentários</span>
          </div>
        </article>

        <article className="disclaimer-card">
          <p className="disclaimer-title">Disclaimer clínico</p>
          <p>
            O conteúdo deste post deve ser utilizado como apoio visual e acadêmico, sempre com
            interpretação clínica profissional.
          </p>
        </article>

        <article className="form-card wide stack">
          <div className="tab-bar" role="tablist" aria-label="Detalhes do post">
            <button
              type="button"
              className={`tab-button${activeTab === "description" ? " active" : ""}`}
              onClick={() => setActiveTab("description")}
            >
              Descrição
            </button>
            <button
              type="button"
              className={`tab-button${activeTab === "comments" ? " active" : ""}`}
              onClick={() => setActiveTab("comments")}
            >
              Comentários
            </button>
          </div>

          {activeTab === "description" ? (
            <div className="tab-panel stack compact">
              <h3>Descrição do post</h3>
              <div
                className="rich-content"
                dangerouslySetInnerHTML={{ __html: post.description }}
              />
            </div>
          ) : (
            <>
              <h3>Comentários</h3>
              {canComment ? (
                <form className="stack" onSubmit={handleCommentSubmit}>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Adicionar comentário técnico"
                  />
                  <button className="primary-button" type="submit">
                    Enviar comentário
                  </button>
                </form>
              ) : (
                <p className="muted-text">Faça login para comentar este post.</p>
              )}

              <div className="stack compact">
                {comments.map((item) => (
                  <div className="comment-card" key={item.id}>
                    <div className="comment-meta">
                      {item.user.name} | {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </div>
                    <p>{item.text}</p>
                    {isAdmin ? (
                      <div className="inline-actions">
                        <button
                          className="secondary"
                          type="button"
                          onClick={() => moderateComment(item.id, "oculto")}
                        >
                          Ocultar
                        </button>
                        <button
                          className="secondary"
                          type="button"
                          onClick={() => moderateComment(item.id, "excluido")}
                        >
                          Excluir
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </article>
      </div>
    </section>
  );
}

export default PostDetailPage;
