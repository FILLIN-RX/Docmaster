import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../context/I18nContext";
import { promoService, type PromoPlan } from "../../services/promoService";

interface PromoBarProps {
  onVisibilityChange?: (visible: boolean) => void;
}

export default function PromoBar({ onVisibilityChange }: PromoBarProps) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [promo, setPromo] = useState<PromoPlan | null>(null);

  useEffect(() => {
    promoService.getPublicPromo().then((res) => {
      if (res.success && res.data) {
        setPromo(res.data);
        onVisibilityChange?.(true);
      }
    }).catch(() => {});
  }, []);

  if (!promo) return null;

  const originalPrice = promo.original_price ?? 0;
  const discountPct = originalPrice > 0 ? Math.round((1 - promo.price / originalPrice) * 100) : 0;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] bg-sky-600 cursor-pointer group"
      onClick={() => navigate("/abonnement")}
    >
      <div className="max-w-7xl mx-auto px-4 h-9 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
            <i className="fa-solid fa-tag text-[8px]" />
            -{discountPct}%
          </span>
          <span className="text-white text-[11px] sm:text-xs font-bold truncate">
            {t("promo_bar_limited")} · VIP {promo.duration_months} {t("promo_bar_months")} · {promo.price.toLocaleString("fr-FR")} XAF
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-white/70 text-[11px] font-semibold group-hover:text-white transition-colors flex-shrink-0">
            {t("promo_bar_cta")} <i className="fa-solid fa-arrow-right text-[9px]" />
          </span>
        </div>
      </div>
    </div>
  );
}
