import { createContext, useContext } from "react";
import { notifications } from "@mantine/notifications";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastContextValue {
  show: (toast: { type: ToastType; message: string; title?: string; duration?: number }) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const COLORS: Record<ToastType, string> = {
  success: "green",
  error: "red",
  info: "blue",
  warning: "orange",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const show = ({ type, message, title, duration }: { type: ToastType; message: string; title?: string; duration?: number }) => {
    notifications.show({
      title,
      message,
      color: COLORS[type],
      autoClose: duration ?? 4000,
    });
  };

  const success = (message: string, title?: string, duration?: number) =>
    show({ type: "success", message, title, duration });
  const error = (message: string, title?: string, duration?: number) =>
    show({ type: "error", message, title, duration });
  const info = (message: string, title?: string, duration?: number) =>
    show({ type: "info", message, title, duration });
  const warning = (message: string, title?: string, duration?: number) =>
    show({ type: "warning", message, title, duration });

  return (
    <ToastContext.Provider value={{ show, success, error, info, warning }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
