import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            prompt_parent_id?: string;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; getNotDisplayedReason: () => string; getSkippedReason: () => string }) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function loadGsiScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) {
      console.log("[One Tap] GSI déjà chargé (window.google.accounts.id présent)");
      resolve();
      return;
    }
    if (document.getElementById("gsi-client-script")) {
      const existing = document.getElementById("gsi-client-script") as HTMLScriptElement;
      existing.addEventListener("load", () => {
        console.log("[One Tap] Script GSI existant rechargé");
        resolve();
      });
      existing.addEventListener("error", () => {
        console.error("[One Tap] Échec du chargement du script GSI (existant)");
        resolve();
      });
      return;
    }
    const script = document.createElement("script");
    script.id = "gsi-client-script";
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      console.log("[One Tap] Script GSI chargé avec succès");
      resolve();
    };
    script.onerror = () => {
      console.error("[One Tap] Échec du chargement du script GSI");
      resolve();
    };
    document.head.appendChild(script);
    console.log("[One Tap] Injection du script GSI dans le DOM");
  });
}

export function useGoogleOneTap() {
  const { user, loginWithGoogleCredential } = useAuth();
  const initiatedRef = useRef(false);
  const loginRef = useRef(loginWithGoogleCredential);

  useEffect(() => {
    loginRef.current = loginWithGoogleCredential;
  });

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    console.log("[One Tap] useEffect — clientId:", clientId ? "présent" : "MANQUANT", "| user:", user ? "connecté" : "anonyme", "| déjà init:", initiatedRef.current);

    if (!clientId || user) {
      if (!clientId) console.warn("[One Tap] VITE_GOOGLE_CLIENT_ID non défini dans .env — One Tap désactivé");
      return;
    }

    let cancelled = false;

    const run = async () => {
      await loadGsiScript();
      if (cancelled || !window.google?.accounts?.id) {
        if (!cancelled) console.error("[One Tap] Script chargé mais window.google.accounts.id indisponible");
        return;
      }

      if (!initiatedRef.current) {
        const handleCredentialResponse = async (response: { credential: string }) => {
          console.log("[One Tap] Callback reçu — credential présent:", !!response?.credential, "| user:", !!user);
          if (user || !response?.credential) return;
          try {
            console.log("[One Tap] Échange du credential Firebase en cours...");
            const result = await loginRef.current(response.credential);
            console.log("[One Tap] Résultat échange:", JSON.stringify(result));
            if (result.success && window.location.pathname === "/") {
              window.location.href = "/dashboard";
            }
          } catch (err) {
            console.error("[One Tap] credential exchange error:", err);
          }
        };

        console.log("[One Tap] Initialisation GSI avec client_id:", clientId.slice(0, 20) + "...");
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
        });
        initiatedRef.current = true;
      }

      console.log("[One Tap] Appel de google.accounts.id.prompt()...");
      window.google.accounts.id.prompt((notification) => {
        const reason = notification.isNotDisplayed() ? notification.getNotDisplayedReason() : notification.getSkippedReason();
        console.log("[One Tap] Notification prompt:", reason || "affiché");
      });
    };

    run().catch((err) => {
      console.error("[One Tap] Erreur lors du chargement GSI:", err);
    });

    return () => {
      cancelled = true;
      console.log("[One Tap] Cleanup — cancel du prompt");
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [user]);
}
