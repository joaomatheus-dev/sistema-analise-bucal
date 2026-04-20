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
      onMessage({ text: "Comentário enviado com sucesso.", type: "success" });
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
      onMessage({ text: `Comentário ${status} com sucesso.`, type: "success" });
      await loadPost();
    } catch (error) {
      onMessage({ text: error.message, type: "error" });
    }
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
    <section className="stack">
      <div className="hero-panel">
        <div className="stack compact">
          <p className="muted-text">{post.category}</p>
          <h2>{post.title}</h2>
        </div>
        <div className="post-actions">
          <Link className="text-link" to="/">
            Voltar para a biblioteca
          </Link>
          <a className="share-link" href={shareUrl} target="_blank" rel="noreferrer">
            Compartilhar no WhatsApp
          </a>
        </div>
      </div>

      <div className="post-detail-layout">
        <div className="stack">
          <button
            className={`zoom-stage${zoomed ? " zoomed" : ""}`}
            type="button"
            onClick={() => setZoomed((current) => !current)}
          >
            <img src={selectedImage} alt={post.title} className="zoom-image" />
          </button>
          <p className="muted-text">Clique na imagem para alternar o zoom.</p>
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

        <div className="form-card wide stack">
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
              <p>{post.description}</p>
            </div>
          ) : null}

          {activeTab === "comments" ? (
            <>
              <h3>Comentários</h3>
              {canComment ? (
                <form className="stack" onSubmit={handleCommentSubmit}>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Adicionar comentário técnico"
                  />
                  <button type="submit">Enviar comentário</button>
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
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default PostDetailPage;
