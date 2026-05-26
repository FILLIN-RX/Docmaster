import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MobileNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [declModalOpen, setDeclModalOpen] = useState(false);

  if (!user) return null;

  const current = location.pathname;

  const items = [
    { to: "/dashboard", icon: "fa-solid fa-house", label: "Accueil" },
    { to: "#decl", icon: "fa-solid fa-circle-plus", label: "Déclaration", isPlus: true },
    { to: "/mes-documents", icon: "fa-solid fa-folder-open", label: "Documents" },
    { to: "/mes-appareils", icon: "fa-solid fa-mobile-screen-button", label: "Objets" },
  ];

  const isActive = (to) => current === to;

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-borda px-1 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around">
          {items.map((item) =>
            item.isPlus ? (
              <button
                key={item.to}
                onClick={() => setDeclModalOpen(true)}
                className="flex flex-col items-center gap-1.5 py-1 transition-all text-textMuted hover:text-primary active:scale-90 flex-1"
              >
                <i className={`${item.icon} text-2xl`} />
                <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
              </button>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-1.5 py-1 transition-all flex-1 ${
                  isActive(item.to)
                    ? "text-primary"
                    : "text-textMuted hover:text-primary active:scale-90"
                }`}
              >
                <i
                  className={`${item.icon} text-xl ${
                    isActive(item.to)
                      ? "text-primary"
                      : ""
                  }`}
                  style={isActive(item.to) ? { filter: "drop-shadow(0 0 8px rgba(245,166,75,0.6))", transform: "scale(1.1)" } : undefined}
                />
                <span className={`text-[10px] font-bold uppercase tracking-tight ${isActive(item.to) ? "text-primary" : ""}`}>
                  {item.label}
                </span>
              </Link>
            )
          )}
        </div>
      </nav>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          declModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDeclModalOpen(false)}
      />

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[110] bg-white rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] transition-transform duration-300 ease-out md:hidden ${
          declModalOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
        <h3 className="font-bricolage text-xl font-extrabold text-textMain text-center mb-6">
          Faire une déclaration
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => { setDeclModalOpen(false); navigate("/declarer"); }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-red-50 border border-red-100 active:scale-[0.98] transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center text-white text-xl">
              <i className="fa-solid fa-triangle-exclamation" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-textMain text-[15px]">Déclarer une perte</p>
              <p className="text-[11px] text-red-600/70 font-medium">J'ai perdu un document</p>
            </div>
            <i className="fa-solid fa-chevron-right text-red-300" />
          </button>
          <button
            onClick={() => { setDeclModalOpen(false); navigate("/trouver"); }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 active:scale-[0.98] transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl">
              <i className="fa-solid fa-file-circle-check" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-textMain text-[15px]">Déclarer un objet trouvé</p>
              <p className="text-[11px] text-blue-600/70 font-medium">J'ai retrouvé quelque chose</p>
            </div>
            <i className="fa-solid fa-chevron-right text-blue-300" />
          </button>
          <button
            onClick={() => { setDeclModalOpen(false); navigate("/mes-documents"); }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50 border border-orange-100 active:scale-[0.98] transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white text-xl">
              <i className="fa-solid fa-file" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-textMain text-[15px]">Mes déclarations</p>
              <p className="text-[11px] text-red-600/70 font-medium">Voir mes déclarations</p>
            </div>
            <i className="fa-solid fa-chevron-right text-red-300" />
          </button>
          <button
            onClick={() => { setDeclModalOpen(false); navigate("/rechercher"); }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50 border border-orange-100 active:scale-[0.98] transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white text-xl">
              <i className="fa-solid fa-magnifying-glass" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-textMain text-[15px]">Recherche</p>
              <p className="text-[11px] text-red-600/70 font-medium">Rechercher un document</p>
            </div>
            <i className="fa-solid fa-chevron-right text-red-300" />
          </button>
        </div>
        <button
          onClick={() => setDeclModalOpen(false)}
          className="w-full mt-6 py-4 text-sm font-bold text-textMuted uppercase tracking-widest"
        >
          Annuler
        </button>
      </div>
    </>
  );
}
