import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useToast, type Toast, type ToastType } from "../context/ToastContext";

// ─── Config par type ────────────────────────────────────────────────────────
const CONFIG: Record<
  ToastType,
  { icon: string; bar: string; bg: string; border: string; title: string; text: string }
> = {
  success: {
    icon: "fa-solid fa-circle-check",
    bar: "bg-green-500",
    bg: "bg-white",
    border: "border-green-200",
    title: "text-green-800",
    text: "text-green-700",
  },
  error: {
    icon: "fa-solid fa-circle-xmark",
    bar: "bg-red-500",
    bg: "bg-white",
    border: "border-red-200",
    title: "text-red-800",
    text: "text-red-700",
  },
  info: {
    icon: "fa-solid fa-circle-info",
    bar: "bg-blue-500",
    bg: "bg-white",
    border: "border-blue-200",
    title: "text-blue-800",
    text: "text-blue-700",
  },
  warning: {
    icon: "fa-solid fa-triangle-exclamation",
    bar: "bg-amber-400",
    bg: "bg-white",
    border: "border-amber-200",
    title: "text-amber-800",
    text: "text-amber-700",
  },
};

const ICON_COLOR: Record<ToastType, string> = {
  success: "text-green-500",
  error: "text-red-500",
  info: "text-blue-500",
  warning: "text-amber-400",
};

// ─── Item individuel ─────────────────────────────────────────────────────────
function ToastItem({ toast }: { toast: Toast }) {
  const { dismiss } = useToast();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const cfg = CONFIG[toast.type];

  // Entrée
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Sortie avant dismiss
  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(() => dismiss(toast.id), 300);
  };

  // Auto-dismiss : déclencher l'animation de sortie 300ms avant la fin
  useEffect(() => {
    const duration = toast.duration ?? 4000;
    const t = setTimeout(() => {
      setLeaving(true);
    }, duration - 300);
    return () => clearTimeout(t);
  }, [toast.duration, toast.id]);

  return (
    <div
      role="alert"
      style={{
        transition: "opacity 300ms ease, transform 300ms ease",
        opacity: visible && !leaving ? 1 : 0,
        transform: visible && !leaving ? "translateX(0)" : "translateX(100%)",
      }}
      className={`
        relative w-[340px] max-w-[calc(100vw-32px)] flex items-start gap-3
        ${cfg.bg} border ${cfg.border} rounded-[16px]
        shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden
        px-4 py-3.5 pointer-events-auto
      `}
    >
      {/* Barre colorée gauche */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-[16px] ${cfg.bar}`} />

      {/* Icône */}
      <div className="flex-shrink-0 mt-0.5 ml-1">
        <i className={`${cfg.icon} text-[22px] ${ICON_COLOR[toast.type]}`} />
      </div>

      {/* Texte */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={`font-bricolage font-bold text-[14px] ${cfg.title} leading-tight mb-0.5`}>
            {toast.title}
          </p>
        )}
        <p className={`font-poppins text-[13px] ${cfg.text} leading-snug`}>{toast.message}</p>
      </div>

      {/* Bouton fermer */}
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Fermer"
      >
        <i className="fa-solid fa-xmark text-[14px]" />
      </button>

      {/* Barre de progression */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar} opacity-30`}
        style={{
          animation: `toast-progress ${toast.duration ?? 4000}ms linear forwards`,
        }}
      />
    </div>
  );
}

// ─── Conteneur global ────────────────────────────────────────────────────────
export default function ToastContainer() {
  const { toasts } = useToast();

  return createPortal(
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed top-5 right-4 z-[99999] flex flex-col gap-3 pointer-events-none"
      style={{ maxHeight: "100vh" }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>,
    document.body
  );
}
