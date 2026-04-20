import { Navigate } from "react-router-dom";

function AdminGuard({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default AdminGuard;
