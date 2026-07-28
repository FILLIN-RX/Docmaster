import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Group, Text, Badge } from "@mantine/core";
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
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 99998 }}
      className="bg-sky-600 cursor-pointer group"
      onClick={() => navigate("/abonnement")}
    >
      <Group justify="space-between" gap={3} px="md" h={36} maw="80rem" mx="auto">
        <Group gap={8} style={{ minWidth: 0, flex: 1 }}>
          <Badge
            color="red"
            variant="filled"
            size="sm"
            radius="xl"
            p={0}
            className="flex-shrink-0 uppercase"
            styles={{ label: { fontSize: 10, fontWeight: 800, letterSpacing: "0.05em" } }}
          >
            <Group gap={4}>
              <i className="fa-solid fa-tag text-[8px]" />
              -{discountPct}%
            </Group>
          </Badge>
          <Text c="white" fw={700} size="xs" truncate style={{ fontSize: 11 }}>
            {t("promo_bar_limited")} · VIP {promo.duration_months} {t("promo_bar_months")} · {promo.price.toLocaleString("fr-FR")} XAF
          </Text>
          <Text c="white.6" fw={600} visibleFrom="sm" size="xs" className="group-hover:!text-white transition-colors flex-shrink-0" style={{ fontSize: 11 }}>
            {t("promo_bar_cta")} <i className="fa-solid fa-arrow-right text-[9px]" />
          </Text>
        </Group>
      </Group>
    </div>
  );
}
