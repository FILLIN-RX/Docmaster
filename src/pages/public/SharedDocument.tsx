import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDocumentShare } from "../../hooks/useDocuments";

function getFullImageUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/";
  const backendRoot = API_BASE_URL.includes("http")
    ? API_BASE_URL.replace(/\/api\/?$/, "")
    : window.location.origin;
  return backendRoot + "/" + url.replace(/^\//, "");
}

export default function SharedDocument() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const { document: doc, loading, error } = useDocumentShare(token);
  const [showingVerso, setShowingVerso] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-bgMain flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6">
          <img src="/assets/images/logo.png" alt="DocMaster" className="w-10 h-10 animate-pulse" />
        </div>
        <div className="bg-white rounded-[32px] border border-borderMain shadow-2xl p-12 text-center max-w-md w-full">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-primary mb-4" />
          <p className="font-bold text-textMain">Chargement du document...</p>
          <p className="text-textMuted text-xs mt-2 leading-relaxed">
            Nous récupérons les informations de partage de manière sécurisée.
          </p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="min-h-screen bg-bgMain flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6">
          <img src="/assets/images/logo.png" alt="DocMaster" className="w-10 h-10" />
        </div>
        <div className="bg-white rounded-[32px] border border-borderMain shadow-2xl p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            <i className="fa-solid fa-triangle-exclamation" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-textMain">Lien invalide ou expiré</h2>
          <p className="text-textMuted text-sm mb-8 leading-relaxed">
            {error || "Ce lien de partage est invalide, a expiré ou a été révoqué par son propriétaire."}
          </p>
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1E3A2F] text-white rounded-2xl font-bold text-sm hover:bg-[#2D5A42] transition-all"
          >
            <i className="fa-solid fa-house text-xs" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  // Choose the picture to show
  const photoRecto = doc.photo_recto || doc.photo || doc.image_url || "";
  const photoVerso = doc.photo_verso || "";
  const activePhoto = showingVerso && photoVerso ? photoVerso : photoRecto;
  const hasVerso = !!photoVerso;

  return (
    <div className="bg-bgMain min-h-screen font-poppins text-textMain py-8 md:py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-4 hover:scale-105 transition-transform">
            <img src="/assets/images/logo.png" alt="DocMaster" className="w-10 h-10" />
          </div>
          <h1 className="font-bricolage text-3xl font-extrabold mb-2 tracking-tight">Document Partagé</h1>
          <p className="text-textMuted text-sm leading-relaxed max-w-md">
            Ce document vous a été partagé de manière sécurisée via DocMaster.
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-[32px] border border-borderMain shadow-2xl shadow-black/5 overflow-hidden transition-all duration-300 hover:shadow-black/10">
          {/* Document Preview Area */}
          <div className="relative h-64 sm:h-80 bg-slate-100 border-b border-borderMain flex items-center justify-center overflow-hidden">
            {activePhoto ? (
              <img
                src={getFullImageUrl(activePhoto)}
                className="w-full h-full object-contain p-2"
                alt="Document"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl">
                <i className="fa-solid fa-file-lines" />
              </div>
            )}

            {/* Flip button */}
            {hasVerso && (
              <button
                onClick={() => setShowingVerso(!showingVerso)}
                className="absolute bottom-4 right-4 px-4 py-2.5 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-[11px] flex items-center gap-2 hover:bg-primary hover:scale-105 transition-all shadow-lg active:scale-95"
              >
                <i className="fa-solid fa-arrows-rotate animate-spin-slow" />
                {showingVerso ? "VOIR RECTO" : "VOIR VERSO"}
              </button>
            )}
          </div>

          {/* Details Area */}
          <div className="p-8 md:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                  {doc.type_doc ? "Document Officiel" : "Document Enregistré"}
                </span>
                <h2 className="font-bricolage text-2xl font-black text-textMain mt-1 capitalize">
                  {doc.type_doc || "Autre Document"}
                </h2>
                <p className="text-textMuted text-sm mt-1">
                  Propriétaire :{" "}
                  <span className="text-textMain font-bold">
                    {doc.owner_name || doc.nom_sur_doc || "Utilisateur"}
                  </span>
                </p>
              </div>
              <div className="px-4 py-1.5 bg-green-light text-green-mid border border-[#D5EADF] rounded-full text-[12px] font-bold flex items-center gap-2 self-start sm:self-center">
                <i className="fa-solid fa-shield-check" />
                VÉRIFIÉ
              </div>
            </div>

            {/* Info Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-surface2 rounded-2xl border border-borderMain hover:border-primary/20 transition-all">
                <p className="text-[9.5px] font-bold text-textMuted uppercase tracking-widest mb-1">
                  Numéro du document
                </p>
                <p className="text-[15px] font-extrabold text-textMain font-mono">
                  {doc.numero_doc || "N° non disponible"}
                </p>
              </div>
              <div className="p-4 bg-surface2 rounded-2xl border border-borderMain hover:border-primary/20 transition-all">
                <p className="text-[9.5px] font-bold text-textMuted uppercase tracking-widest mb-1">
                  Nom sur document
                </p>
                <p className="text-[15px] font-extrabold text-textMain">
                  {doc.nom_sur_doc || "Non spécifié"}
                </p>
              </div>
            </div>

            {/* Extra Metadata (if available) */}
            {(doc.date_delivrance || doc.date_expiration || doc.nom_autorite) && (
              <div className="border-t border-borderMain/60 pt-6 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {doc.date_delivrance && (
                  <div className="text-[13px]">
                    <span className="text-textMuted block">Délivré le :</span>
                    <strong className="text-textMain">
                      {new Date(doc.date_delivrance).toLocaleDateString("fr-FR")}
                    </strong>
                  </div>
                )}
                {doc.date_expiration && (
                  <div className="text-[13px]">
                    <span className="text-textMuted block">Expire le :</span>
                    <strong className="text-textMain">
                      {new Date(doc.date_expiration).toLocaleDateString("fr-FR")}
                    </strong>
                  </div>
                )}
              </div>
            )}

            {/* Shield Notice */}
            <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-borderMain flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white border border-borderMain flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                <i className="fa-solid fa-lock text-base" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-textMain mb-1">
                  Authenticité Garantie
                </p>
                <p className="text-[11.5px] text-textMuted leading-relaxed">
                  Ce document est certifié authentique par DocMaster. Il a été chiffré et stocké
                  en toute sécurité par son propriétaire légitime.
                </p>
              </div>
            </div>
          </div>

          {/* Call To Action Footer */}
          <div className="p-8 border-t border-borderMain bg-[#FAF7F2] text-center">
            <p className="text-[13px] text-textMuted mb-4 leading-relaxed">
              Vous aussi, protégez et archivez vos documents en toute sécurité.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-bold text-[13.5px] shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all transform active:scale-95"
            >
              Créer mon compte gratuit
            </Link>
          </div>
        </div>

        <p className="text-center text-[12px] text-textMuted mt-8">
          &copy; 2026 DocMaster. Protection et Sécurisation de Documents au Cameroun.
        </p>
      </div>
    </div>
  );
}
