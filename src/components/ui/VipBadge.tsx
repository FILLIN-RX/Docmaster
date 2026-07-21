import type { ReactNode } from "react";

interface VipAvatarProps {
  children: ReactNode;
  isVip?: boolean;
}

export function isVipUser(user: any): boolean {
  if (!user?.subscription) return false;
  const planId = user.subscription.plan_id || "";
  const planName = (user.subscription.plan_name || "").toLowerCase();
  return (
    planId === "vip" ||
    planId === "vip_promo_2m" ||
    planName.includes("vip")
  );
}

export default function VipAvatar({ children, isVip = false }: VipAvatarProps) {
  if (!isVip) return <>{children}</>;

  return (
    <div className="vip-border inline-flex">
      {children}
    </div>
  );
}
