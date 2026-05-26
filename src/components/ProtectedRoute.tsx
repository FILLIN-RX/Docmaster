import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/92 z-[99999]">
        <div>
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-white to-gray-50 flex items-center justify-center shadow-lg">
            <div className="w-11 h-11 rounded-full border-4 border-black/10 border-t-primary animate-spin" />
          </div>
          <p className="mt-3 text-[13px] text-textMuted font-semibold text-center">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
