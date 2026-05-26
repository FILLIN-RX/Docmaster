import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { to: "/admin", icon: "fa-solid fa-gauge-high", label: "Dashboard" },
  { to: "/admin/users", icon: "fa-solid fa-users", label: "Utilisateurs" },
  { to: "/admin/subscriptions", icon: "fa-solid fa-crown", label: "Abonnements" },
  { to: "/admin/declarations", icon: "fa-solid fa-file-lines", label: "Déclarations" },
  { to: "/admin/transactions", icon: "fa-solid fa-credit-card", label: "Transactions" },
  { to: "/admin/withdrawals", icon: "fa-solid fa-money-bill-transfer", label: "Retraits" },
  { to: "/admin/referrals", icon: "fa-solid fa-gift", label: "Parrainages" },
  { to: "/admin/document-types", icon: "fa-solid fa-tags", label: "Types doc." },
  { to: "/admin/sms", icon: "fa-solid fa-message", label: "SMS" },
  { to: "/admin/settings", icon: "fa-solid fa-gear", label: "Paramètres" },
];

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/users": "Utilisateurs",
  "/admin/subscriptions": "Abonnements",
  "/admin/declarations": "Déclarations",
  "/admin/transactions": "Transactions",
  "/admin/withdrawals": "Retraits",
  "/admin/referrals": "Parrainages",
  "/admin/document-types": "Types de documents",
  "/admin/sms": "SMS",
  "/admin/settings": "Paramètres",
};

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const currentTitle = pageTitles[location.pathname] || "Administration";

  const handleLogout = () => {
    localStorage.removeItem("docmaster_admin_login");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 w-[260px] bg-[#1a2332] z-50 flex flex-col transition-all duration-300 ease-out ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-green-dark/10" />
          <div className="relative p-5 border-b border-white/5">
            <Link to="/admin" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-base font-black shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all">
                <i className="fa-solid fa-shield-halved" />
              </div>
              <div>
                <span className="font-bricolage text-white font-black text-lg tracking-tight">DocMaster</span>
                <span className="block text-[10px] text-white/30 font-semibold uppercase tracking-widest">Administration</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 custom-scroll">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                isActive(item.to)
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-white/40 hover:bg-white/5 hover:text-white/70"
              }`}
            >
              {isActive(item.to) && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary" />
              )}
              <i className={`${item.icon} w-5 text-center text-[13px] transition-transform duration-200 ${isActive(item.to) ? "" : "group-hover:scale-110"}`} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-white/30 hover:bg-white/5 hover:text-red-400 text-xs font-bold transition-all group"
          >
            <i className="fa-solid fa-right-from-bracket text-[11px] group-hover:-translate-x-0.5 transition-transform" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200/60 flex items-center px-4 lg:px-6 h-16 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 border border-gray-200 text-gray-500 hover:bg-gray-200 transition-all lg:hidden"
          >
            <i className="fa-solid fa-bars text-sm" />
          </button>

          <div className="flex items-center gap-2.5 text-sm">
            <Link to="/" className="text-gray-300 hover:text-primary font-medium transition-colors">
              <i className="fa-solid fa-globe text-[11px] mr-1" />
              Site
            </Link>
            <span className="text-gray-300 text-[10px]">/</span>
            <span className="text-gray-700 font-semibold">{currentTitle}</span>
          </div>

          <div className="flex-1" />

          <Link
            to="/"
            className="hidden sm:flex items-center gap-1.5 text-[11.5px] text-gray-400 hover:text-primary font-semibold transition-colors bg-gray-50 hover:bg-primary/5 px-3 py-1.5 rounded-xl border border-gray-200/60"
          >
            <i className="fa-solid fa-arrow-left text-[10px]" />
            Retour au site
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scroll">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
