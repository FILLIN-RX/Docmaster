import { useEffect } from "react";
import { Notifications } from "@mantine/notifications";
import { notifications } from "@mantine/notifications";
import type { ToastType } from "../../context/ToastContext";

type ToastEmitterPayload = {
  type: ToastType;
  message: string;
  title?: string;
};

export default function ToastContainer() {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ToastEmitterPayload>).detail;
      if (!detail) return;
      const colors: Record<ToastType, string> = {
        success: "green",
        error: "red",
        info: "blue",
        warning: "orange",
      };
      notifications.show({
        title: detail.title,
        message: detail.message,
        color: colors[detail.type],
        autoClose: 4000,
      });
    };
    window.addEventListener("docmaster:toast", handler);
    return () => window.removeEventListener("docmaster:toast", handler);
  }, []);

  return <Notifications position="top-right" zIndex={99999} />;
}
