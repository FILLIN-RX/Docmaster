import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { readdirSync } from "fs";

// Fonction pour récupérer dynamiquement tous les fichiers HTML dans src/
const getHtmlEntries = () => {
  const pagesDir = resolve(__dirname, "src");
  const entries = {};

  readdirSync(pagesDir).forEach((file) => {
    if (file.endsWith(".html")) {
      const name = file.replace(".html", "");
      entries[name] = resolve(pagesDir, file);
    }
  });

  return entries;
};

export default defineConfig({
  root: "src", // Définit le dossier source comme racine
  envDir: "../", // Cherche le .env à la racine du projet
  plugins: [tailwindcss()],
  build: {
    outDir: "../dist", // Le build ira dans /dist à la racine du projet
    emptyOutDir: true,
    rollupOptions: {
      input: getHtmlEntries(),
    },
  },
  server: {
    port: 5173,
    open: "/index.html",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
});
