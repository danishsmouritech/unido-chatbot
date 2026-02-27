import { Navigate } from "react-router-dom";

function isTokenExpired(token) {   
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload?.exp) return false;
    console.log("Token expiration time (min):",(payload.exp * 1000- Date.now()) /(1000*60).toFixed(1), "minutes");
    return payload.exp * 1000 <= Date.now();
  } catch (error) {
    console.error("Error parsing token:", error);
    return true;
  }
}

export default function PrivateRoute({ children }) {
  const token = localStorage.getItem("adminToken");

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem("adminToken");
    return <Navigate to="/login" replace />;
  }

  return children;
}
