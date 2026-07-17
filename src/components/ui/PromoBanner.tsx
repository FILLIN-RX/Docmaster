import { useState } from "react";
import PaymentModal from "../modals/PaymentModal";

interface PromoBannerProps {
  plan: {
    id: string;
    name: string;
    price: number;
    original_price?: number | null;
    duration_months: number;
    features: Record<string, unknown>;
  };
  onSubscribe: (method: "orange" | "mtn" | "points", phone: string) => Promise<void>;
  onDismiss?: () => void;
  processing?: boolean;
  pollingStatus?: string | null;
}

export default function PromoBanner({ plan, onSubscribe, onDismiss, processing, pollingStatus }: PromoBannerProps) {
  const [showPayment, setShowPayment] = useState(false);
  const [payError, setPayError] = useState("");

  const originalPrice = plan.original_price ?? 0;
  const discountPct = originalPrice > 0 ? Math.round((1 - plan.price / originalPrice) * 100) : 0;

  const handlePay = async (method: "orange" | "mtn" | "points", phone: string) => {
    setPayError("");
    try {
      await onSubscribe(method, phone);
      setShowPayment(false);
    } catch (err: any) {
      setPayError(err.message || "Erreur de paiement");
    }
  };

  return (
    <>
      <div className="relative bg-sky-600 rounded-[20px] p-4 sm:p-5 shadow-2xl shadow-sky-700/30">
        <div className="absolute top-2 right-2 w-20 sm:w-24 h-20 sm:h-24 bg-white/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-16 sm:w-20 h-16 sm:h-20 bg-blue-200/20 rounded-full blur-2xl pointer-events-none" />

        <img
          src="/src/assets/images/promo.png"
          alt=""
          className="absolute bottom-0 right-0 h-[90%] sm:h-full w-auto object-contain pointer-events-none select-none"
        />

        {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/20 text-white/70 hover:bg-black/40 hover:text-white transition-all z-20"
          aria-label="Fermer"
        >
          <i className="fa-solid fa-xmark text-sm" />
        </button>
        )}

        <div className="relative z-10 max-w-[60%] sm:max-w-[65%]">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              -{discountPct}%
            </span>
            <span className="text-white/70 text-[11px] font-medium uppercase tracking-wider">
              Offre limitée
            </span>
          </div>
          <h3 className="font-bricolage text-lg sm:text-xl font-extrabold text-white mb-1">
            VIP {plan.duration_months} mois
          </h3>
          <p className="text-white/60 text-[11px] sm:text-[12px] mb-3">
            Accès à toutes les fonctionnalités VIP
          </p>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-white/40 text-[14px] sm:text-[16px] line-through font-bold">
              {originalPrice.toLocaleString("fr-FR")} XAF
            </span>
            <span className="text-white text-xl sm:text-2xl font-extrabold">
              {plan.price.toLocaleString("fr-FR")} <span className="text-sm sm:text-base font-bold text-white/70">XAF</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-4">
            {[
              { icon: "fa-file-circle-check", label: "5 types doc" },
              { icon: "fa-box-open", label: "7 objets" },
              { icon: "fa-bell", label: "Alertes SMS" },
              { icon: "fa-location-dot", label: "Géo-tracking" },
              { icon: "fa-circle-check", label: "Badge vérifié" },
            ].map((f) => (
              <span key={f.label} className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[9px] sm:text-[10px] font-medium">
                <i className={`fa-solid ${f.icon} text-[7px] sm:text-[8px]`} /> {f.label}
              </span>
            ))}
          </div>
          <button
            onClick={() => setShowPayment(true)}
            disabled={processing}
            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-white hover:bg-blue-50 text-sky-700 font-extrabold text-[13px] sm:text-[14px] rounded-xl transition-all active:scale-[0.97] shadow-lg shadow-white/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processing ? (
              <><i className="fa-solid fa-spinner fa-spin" /> Activation...</>
            ) : (
              <><i className="fa-solid fa-crown" /> Activer mon VIP</>
            )}
          </button>
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          isOpen={showPayment && !pollingStatus}
          onClose={() => setShowPayment(false)}
          onPay={handlePay}
          amount={plan.price}
          title="Activer l'offre VIP"
          description={`VIP ${plan.duration_months} mois — ${plan.price.toLocaleString("fr-FR")} XAF`}
          processing={processing || !!pollingStatus}
          error={payError}
          submitLabel="Activer"
        />
      )}
    </>
  );
}
