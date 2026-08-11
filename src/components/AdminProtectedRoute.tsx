import { Navigate } from "react-router-dom";
import { checkAdminAuth } from "../utils/adminAuth";

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!checkAdminAuth()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
