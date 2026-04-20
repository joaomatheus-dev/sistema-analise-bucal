export function navClassName({ isActive }) {
  return `nav-link${isActive ? " active" : ""}`;
}

export function routeLabel(pathname) {
  if (pathname.startsWith("/login")) return "Autenticacao";
  if (pathname.startsWith("/cadastro")) return "Novo usuario";
  if (pathname.startsWith("/recuperar-senha")) return "Recuperacao de senha";
  if (pathname.startsWith("/redefinir-senha")) return "Redefinicao de senha";
  if (pathname.startsWith("/post/")) return "Visualizacao do post";
  if (pathname.startsWith("/admin/imagens")) return "Area administrativa";
  if (pathname.startsWith("/admin/categorias")) return "Gestao de categorias";
  if (pathname.startsWith("/admin/administradores")) return "Gestao de administradores";
  return "Biblioteca clinica";
}
