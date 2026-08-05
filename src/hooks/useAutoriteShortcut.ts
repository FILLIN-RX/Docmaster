import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Raccourci clavier global: Ctrl+Shift+A (ou Cmd+Shift+A) ouvre l'espace autorité.
 */
export function useAutoriteShortcut() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
          e.preventDefault();
          navigate("/autorite/connexion");
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        navigate("/autorite/connexion");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
}
