import { useState } from "react";
import type { Document } from "../../types/api";

interface ShareModalProps {
  doc: Document;
  onClose: () => void;
}

export default function ShareModal({ doc, onClose }: ShareModalProps) {
  const [duration, setDuration] = useState("7");
  const [generating, setGenerating] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const generateLink = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 800));
    setShareLink(`${window.location.origin}/recuperer?id=${doc.id}&d=${duration}`);
    setGenerating(false);
  };

  const copyLink = () => {
    if (shareLink) navigator.clipboard.writeText(shareLink);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()} style={{ zIndex: 150 }}>
      <div className="modal-box max-w-lg w-[90%] overflow-hidden border border-slate-200 shadow-2xl bg-white">
        <div className="p-8 md:p-10">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm">
                <i className="fa-solid fa-paper-plane" />
              </div>
              <div>
                <h3 className="font-bricolage text-2xl font-extrabold text-slate-900 leading-tight">Partage Sécurisé</h3>
                <p className="text-[12px] text-slate-500 font-medium">Contrôlez l'accès au document</p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-8 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-slate-200">
              <i className="fa-solid fa-file-shield text-slate-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Fichier sélectionné</p>
              <p className="text-[14px] font-extrabold text-slate-900">{doc.nom_sur_doc || "Document"}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest ml-1">Durée de validité</label>
              <div className="relative">
                <select value={duration} onChange={(e) => { setDuration(e.target.value); setShareLink(""); }}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl font-poppins text-[14px] text-slate-700 outline-none focus:border-primary transition-all appearance-none cursor-pointer">
                  <option value="1">Expire après 24 heures</option>
                  <option value="7">Expire après 7 jours</option>
                  <option value="30">Expire après 30 jours</option>
                  <option value="0">Accès permanent</option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
              </div>
            </div>

            {shareLink ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <i className="fa-solid fa-check-circle text-green-600" />
                  <span className="text-[13px] text-green-800 font-medium flex-1 truncate">{shareLink}</span>
                  <button onClick={copyLink}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-[11px] font-bold hover:bg-green-700 transition-all">
                    Copier
                  </button>
                </div>
                <button onClick={() => setShareLink("")}
                  className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 transition-all">
                  Générer un nouveau lien
                </button>
              </div>
            ) : (
              <button onClick={generateLink} disabled={generating}
                className="w-full h-14 bg-green-dark text-white rounded-[18px] font-bold text-[14px] uppercase tracking-wider hover:bg-green-mid transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50">
                {generating ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-link" />}
                {generating ? "Génération..." : "Générer un lien"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
