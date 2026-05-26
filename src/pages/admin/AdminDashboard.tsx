import { useEffect, useState } from "react";
import { adminService } from "../../services/admin";

interface Stats {
  total_users?: number;
  total_declarations?: number;
  total_subscriptions?: number;
  total_revenue?: number;
  active_users?: number;
}

const cards = [
  { label: "Utilisateurs", key: "total_users" as const, icon: "fa-users", gradient: "from-blue-500 to-blue-600", bg: "bg-blue-50", text: "text-blue-600" },
  { label: "Actifs", key: "active_users" as const, icon: "fa-user-check", gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50", text: "text-emerald-600" },
  { label: "Déclarations", key: "total_declarations" as const, icon: "fa-file-lines", gradient: "from-amber-500 to-amber-600", bg: "bg-amber-50", text: "text-amber-600" },
  { label: "Abonnements", key: "total_subscriptions" as const, icon: "fa-crown", gradient: "from-purple-500 to-purple-600", bg: "bg-purple-50", text: "text-purple-600" },
  { label: "Revenus", key: "total_revenue" as const, icon: "fa-money-bill", gradient: "from-green-500 to-green-600", bg: "bg-green-50", text: "text-green-600", isCurrency: true },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getDashboardStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-11 h-11 rounded-full border-[3px] border-gray-200 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-bricolage text-2xl font-black text-gray-900">Tableau de bord</h1>
        <p className="text-gray-400 text-[13px] font-medium mt-1">Aperçu général de la plateforme</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => {
          const val = stats?.[card.key] ?? 0;
          const display = card.isCurrency
            ? `${(val as number).toLocaleString("fr-FR")} XAF`
            : (val as number).toLocaleString("fr-FR");
          return (
            <div
              key={card.key}
              className="group relative bg-white rounded-2xl p-5 border border-gray-200/60 hover:border-gray-300 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform duration-300`}>
                <i className={`fa-solid ${card.icon} ${card.text} text-base`} />
              </div>
              <p className="font-bricolage text-[26px] font-extrabold text-gray-900 leading-none tracking-tight">{display}</p>
              <p className="text-[12px] text-gray-400 font-medium mt-1.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="mt-6 bg-white rounded-2xl p-6 border border-gray-200/60">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <i className="fa-solid fa-clock-rotate-left text-primary text-sm" />
          </div>
          <div>
            <h2 className="font-bricolage text-lg font-bold text-gray-900">Activité récente</h2>
            <p className="text-[12px] text-gray-400">Suivi en temps réel</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-gray-300">
          <i className="fa-solid fa-chart-line text-3xl mb-3" />
          <p className="text-[13px] font-medium text-gray-400">
            Le tableau de bord détaillé sera disponible après intégration des données en temps réel.
          </p>
        </div>
      </div>
    </div>
  );
}
