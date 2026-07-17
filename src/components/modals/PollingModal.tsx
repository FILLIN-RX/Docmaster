import { createPortal } from "react-dom";

interface PollingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pollingStatus: string;
  pollingElapsed: number;
  nokashTransactionId: string | null;
  onManualCheck: () => void;
  isManualChecking?: boolean;
}

export default function PollingModal({
  isOpen,
  onClose,
  pollingStatus,
  pollingElapsed,
  nokashTransactionId,
  onManualCheck,
  isManualChecking,
}: PollingModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-green-dark/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] p-0 shadow-2xl overflow-hidden border border-white/20 animate-fade-in pb-[70px] md:pb-0">
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bricolage text-2xl font-black text-slate-900 tracking-tight">Paiement en cours</h2>
            <p className="text-[13px] text-slate-500 font-medium">Étape sécurisée par DocMaster Pay</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="px-8 pb-8">
          <div className="text-center py-10 space-y-6 animate-fade-in">
            {pollingElapsed >= 120 ? (
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
                <i className="fa-solid fa-clock text-amber-500 text-2xl" />
              </div>
            ) : (
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            )}
            <div>
              <p className="font-bricolage text-lg font-black text-slate-800">
                {pollingElapsed >= 120 ? "Traitement en cours" : "Validation en cours..."}
              </p>
              <p className="text-sm text-slate-500 mt-2">{pollingStatus}</p>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                {Math.floor(pollingElapsed / 60)}:{(pollingElapsed % 60).toString().padStart(2, "0")}
              </p>
            </div>
            {nokashTransactionId && (
              <div className="pt-2">
                <button
                  onClick={onManualCheck}
                  disabled={isManualChecking}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary-dark transition-all disabled:opacity-40 flex items-center gap-2 mx-auto"
                >
                  {isManualChecking ? (
                    <><i className="fa-solid fa-spinner fa-spin" /> Vérification...</>
                  ) : (
                    <><i className="fa-solid fa-rotate" /> Vérifier manuellement</>
                  )}
                </button>
                <p className="text-[11px] text-slate-400 mt-2">
                  Si la confirmation tarde, cliquez sur "Vérifier manuellement"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
