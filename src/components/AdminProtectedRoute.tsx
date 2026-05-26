import { Navigate } from "react-router-dom";

function checkAdminAuth(): boolean {
  const admin = localStorage.getItem("docmaster_admin_login");
  if (!admin) return false;
  try {
    const parsed = JSON.parse(admin);
    return parsed?.role === "admin" && parsed?.token;
  } catch {
    return false;
  }
}

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!checkAdminAuth()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
