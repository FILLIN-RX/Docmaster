import { useEffect } from "react";

export function usePageReady() {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("page:ready"));
  }, []);
}
