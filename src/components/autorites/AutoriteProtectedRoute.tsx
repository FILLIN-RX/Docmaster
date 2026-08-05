import { Navigate, useLocation } from "react-router-dom";
import { useAutorite } from "../../context/AutoriteContext";
import { Spin } from "antd";
import { autoritePalette } from "../../theme/autorites";

export default function AutoriteProtectedRoute({ children }: { children: React.ReactNode }) {
  const { autorite, loading } = useAutorite();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: autoritePalette.bgMain,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!autorite) {
    return <Navigate to="/autorite/connexion" state={{ from: location }} replace />;
  }

  if (autorite.must_change_password && !location.pathname.includes("/changement-mot-de-passe")) {
    return <Navigate to="/autorite/changement-mot-de-passe" replace />;
  }

  return <>{children}</>;
}
