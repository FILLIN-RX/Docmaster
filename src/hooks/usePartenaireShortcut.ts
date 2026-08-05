import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Raccourci clavier global: Ctrl+Shift+P (ou Cmd+Shift+P) ouvre l'espace partenaire.
 */
export function usePartenaireShortcut() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        if (e.ctrlKey && e.shiftKey && (e.key === "P" || e.key === "p")) {
          e.preventDefault();
          navigate("/partenaire/connexion");
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "P" || e.key === "p")) {
        e.preventDefault();
        navigate("/partenaire/connexion");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
}