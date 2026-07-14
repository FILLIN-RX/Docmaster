type ToastPayload = {
  type: "error" | "warning" | "success" | "info";
  message: string;
  title?: string;
};

export function emitToast(payload: ToastPayload) {
  window.dispatchEvent(new CustomEvent("docmaster:toast", { detail: payload }));
}
