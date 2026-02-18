import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const isAuthenticated = localStorage.getItem("adminToken");

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
