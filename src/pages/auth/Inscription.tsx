import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ImmersiveRegister from "../../components/auth/ImmersiveRegister";

export default function Inscription() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  if (user) return null;

  return <ImmersiveRegister />;
}
