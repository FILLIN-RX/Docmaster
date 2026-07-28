import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import Footer from "./Footer";
import NotificationModal from "../components/ui/NotificationModal";
import PlayStoreBanner from "../components/ui/PlayStoreBanner";
import PromoBar from "../components/ui/PromoBar";
import TopProgressBar from "../components/ui/TopProgressBar";

const authPages = ["/dashboard", "/mes-documents", "/mes-appareils", "/mes-declarations", "/abonnement", "/parrainage", "/mes-gains", "/acheter-points", "/infos-profil", "/declarer", "/trouver", "/rechercher", "/recuperer", "/rendre"];
const publicPages = ["/", "/login", "/inscription", "/forgot-password", "/reset-password", "/recherche-publique", "/conditions", "/confidentialite", "/partage", "/partage.html"];

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [promoBarVisible, setPromoBarVisible] = useState(false);
  const keyBuffer = useRef("");

  useEffect(() => {
    (window as any).__openNotifModal = () => setNotifModalOpen(true);
    return () => { delete (window as any).__openNotifModal; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Enter") {
        if (keyBuffer.current.toLowerCase() === "admin") {
          keyBuffer.current = "";
          navigate("/admin/login");
        }
        return;
      }

      if (e.key.length === 1) {
        keyBuffer.current += e.key;
        setTimeout(() => { keyBuffer.current = ""; }, 2000);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  const isAuthPage = authPages.some((p) => path.startsWith(p));
  const isPublicHome = path === "/";
  const showFooter = isPublicHome || path === "/rechercher" || path === "/conditions" || path === "/confidentialite";

  return (
    <div className="min-h-screen bg-bgMain">
      <TopProgressBar />
      {isAuthPage && user ? (
        <Sidebar />
      ) : (path !== "/login" && path !== "/inscription" && path !== "/forgot-password" && path !== "/reset-password" && !path.startsWith("/partage")) ? (
        <>
          <PromoBar onVisibilityChange={setPromoBarVisible} />
          <Navbar promoBarVisible={promoBarVisible} />
        </>
      ) : null}

      <main className={(isAuthPage && user ? " ml-[var(--sidebar)] max-md:ml-0 pb-[70px] md:pb-0 transition-all duration-300" : "")}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
      </main>

      {isAuthPage && <MobileNav />}

      {showFooter && !isAuthPage && <Footer />}

      {notifModalOpen && <NotificationModal onClose={() => setNotifModalOpen(false)} />}
      <PlayStoreBanner />
    </div>
  );
}
