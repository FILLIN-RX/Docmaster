import { Navigate, useLocation } from "react-router-dom";
import { usePartenaire } from "../../context/PartenaireContext";
import { Spin } from "antd";
import { partenairePalette } from "../../theme/partenaires";

export default function PartenaireProtectedRoute({ children }: { children: React.ReactNode }) {
  const { partenaire, loading } = usePartenaire();
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
          background: partenairePalette.bgMain,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!partenaire) {
    return <Navigate to="/partenaire/connexion" state={{ from: location }} replace />;
  }

  if (partenaire.must_change_password && !location.pathname.includes("/changement-mot-de-passe")) {
    return <Navigate to="/partenaire/changement-mot-de-passe" replace />;
  }

  return <>{children}</>;
}