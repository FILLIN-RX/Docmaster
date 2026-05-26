import { Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import AdminLayout from "./layout/AdminLayout";
import Home from "./pages/public/Home";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import RechercherPublic from "./pages/public/Rechercher";
import RechercherAuth from "./pages/auth/Rechercher";
import Declarer from "./pages/auth/Declarer";
import Recuperer from "./pages/auth/Recuperer";
import Rendre from "./pages/auth/Trouver";
import Conditions from "./pages/public/Conditions";
import Confidentialite from "./pages/public/Confidentialite";
import SharedDocument from "./pages/public/SharedDocument";
import Dashboard from "./pages/auth/Dashboard";
import MesDocuments from "./pages/auth/MesDocuments";
import MesAppareils from "./pages/auth/MesAppareils";
import MesDeclarations from "./pages/auth/MesDeclarations";

import Abonnement from "./pages/auth/Abonnement";
import Parrainage from "./pages/auth/Parrainage";
import MesGains from "./pages/auth/MesGains";
import InfosProfil from "./pages/auth/InfosProfil";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminReferrals from "./pages/admin/AdminReferrals";
import AdminSms from "./pages/admin/AdminSms";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminDeclarations from "./pages/admin/AdminDeclarations";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminDocumentTypes from "./pages/admin/AdminDocumentTypes";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/rechercher" element={<ProtectedRoute><RechercherAuth /></ProtectedRoute>} />
        <Route path="/recherche-publique" element={<RechercherPublic />} />
        <Route path="/declarer" element={<ProtectedRoute><Declarer /></ProtectedRoute>} />
        <Route path="/recuperer" element={<ProtectedRoute><Recuperer /></ProtectedRoute>} />
        <Route path="/trouver" element={<Rendre />} />
        <Route path="/conditions" element={<Conditions />} />
        <Route path="/confidentialite" element={<Confidentialite />} />
        <Route path="/partage" element={<SharedDocument />} />
        <Route path="/partage.html" element={<SharedDocument />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/mes-documents" element={<ProtectedRoute><MesDocuments /></ProtectedRoute>} />
        <Route path="/mes-appareils" element={<ProtectedRoute><MesAppareils /></ProtectedRoute>} />
        <Route path="/mes-declarations" element={<ProtectedRoute><MesDeclarations /></ProtectedRoute>} />

        <Route path="/abonnement" element={<ProtectedRoute><Abonnement /></ProtectedRoute>} />
        <Route path="/parrainage" element={<ProtectedRoute><Parrainage /></ProtectedRoute>} />
        <Route path="/mes-gains" element={<ProtectedRoute><MesGains /></ProtectedRoute>} />
        <Route path="/infos-profil" element={<ProtectedRoute><InfosProfil /></ProtectedRoute>} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/referrals" element={<AdminReferrals />} />
        <Route path="/admin/sms" element={<AdminSms />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/declarations" element={<AdminDeclarations />} />
        <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
        <Route path="/admin/document-types" element={<AdminDocumentTypes />} />
      </Route>
    </Routes>
  );
}
