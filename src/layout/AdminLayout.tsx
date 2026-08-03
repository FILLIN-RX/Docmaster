import { useState, useEffect, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminTopbar from "../components/admin/AdminTopbar";
import NotificationPanel from "../components/admin/NotificationPanel";
import { notificationsService } from "../services/notificationsService";
import type { Notification } from "../types/api";

export default function AdminLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);

  // Auto-open on desktop resize, auto-close on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const unreadCount = notifications.filter((n) => !n.lue && !n.is_read).length;

  const adminInitial = (() => {
    try {
      const stored = localStorage.getItem("docmaster_admin_login");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.nom || parsed?.email?.[0] || "A";
      }
    } catch {}
    return "A";
  })();

  const loadNotifications = useCallback(() => {
    setLoadingNotifs(true);
    notificationsService
      .getAll()
      .then((res) => setNotifications(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingNotifs(false));
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const handler = () => loadNotifications();
    window.addEventListener("docmaster:notification", handler);
    return () => window.removeEventListener("docmaster:notification", handler);
  }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, lue: true, is_read: true })));
    } catch {}
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lue: true, is_read: true } : n)));
    } catch {}
  };

  return (
    <div className="h-screen bg-[#F5F6F7] flex overflow-hidden">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-200 ${sidebarOpen ? "ml-[260px]" : "ml-0"}`}>
        <AdminTopbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          unreadCount={unreadCount}
          onNotifToggle={() => setNotifOpen(!notifOpen)}
          adminInitial={adminInitial}
        />

        <NotificationPanel
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
          notifications={notifications}
          loading={loadingNotifs}
          unreadCount={unreadCount}
          onMarkAllRead={handleMarkAllRead}
          onMarkRead={handleMarkRead}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 admin-scroll">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
