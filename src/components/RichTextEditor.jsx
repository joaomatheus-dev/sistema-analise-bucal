import { useEffect, useState } from "react";

function RichTextEditor({ value, onChange, placeholder = "Digite o conteúdo" }) {
  const [EditorComponent, setEditorComponent] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadEditor() {
      try {
        await import("tinymce/tinymce");
        await import("tinymce/icons/default");
        await import("tinymce/themes/silver");
        await import("tinymce/models/dom");
        await import("tinymce/plugins/advlist");
        await import("tinymce/plugins/autolink");
        await import("tinymce/plugins/code");
        await import("tinymce/plugins/link");
        await import("tinymce/plugins/lists");
        await import("tinymce/plugins/preview");
        await import("tinymce/plugins/table");
        await import("tinymce/plugins/wordcount");
        await import("tinymce/skins/ui/oxide/skin.css");
        await import("tinymce/skins/content/default/content.css");

        const tinyReact = await import("@tinymce/tinymce-react");

        if (active) {
          setEditorComponent(() => tinyReact.Editor);
        }
      } catch (error) {
        console.error("Falha ao carregar TinyMCE:", error);
        if (active) {
          setLoadFailed(true);
        }
      }
    }

    loadEditor();

    return () => {
      active = false;
    };
  }, []);

  if (loadFailed) {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    );
  }

  if (!EditorComponent) {
    return (
      <div className="editor-loading">
        <span>Carregando editor...</span>
      </div>
    );
  }

  return (
    <div className="editor-shell">
      <EditorComponent
        licenseKey="gpl"
        value={value}
        onEditorChange={(content) => onChange(content)}
        init={{
          height: 320,
          menubar: false,
          branding: false,
          statusbar: false,
          resize: true,
          placeholder,
          plugins: ["advlist", "autolink", "lists", "link", "table", "preview", "code", "wordcount"],
          toolbar:
            "undo redo | blocks | bold italic underline | bullist numlist | link table | alignleft aligncenter alignright | removeformat code preview",
          block_formats: "Parágrafo=p; Título 2=h2; Título 3=h3; Citação=blockquote",
          content_style: `
            body {
              font-family: Manrope, Arial, sans-serif;
              font-size: 15px;
              line-height: 1.7;
              color: #222830;
              padding: 12px;
            }
            p { margin: 0 0 12px; }
            h2, h3 { font-family: Poppins, Arial, sans-serif; margin: 0 0 12px; }
          `
        }}
      />
    </div>
  );
}

export default RichTextEditor;
