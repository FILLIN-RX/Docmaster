import { useEffect, useState } from "react";
import { adminService } from "../../services/admin";

interface User {
  id: string;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  is_active?: boolean;
  is_verified?: boolean;
  created_at?: string;
  role?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminService
      .getAdminUsers()
      .then((res) => setUsers(res.users || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.nom?.toLowerCase().includes(search.toLowerCase()) ||
      u.prenom?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-11 h-11 rounded-full border-[3px] border-gray-200 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bricolage text-2xl font-black text-gray-900">Utilisateurs</h1>
          <p className="text-gray-400 text-[13px] font-medium mt-1">{users.length} inscrit{users.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-primary transition-colors placeholder:text-gray-300"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Nom</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Téléphone</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Inscrit le</th>
                <th className="text-right px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-300">
                    <i className="fa-solid fa-users text-3xl mb-3" />
                    <p className="text-[13px] font-medium text-gray-400">Aucun utilisateur trouvé</p>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-[13px] font-bold">
                          {(u.prenom?.[0] || u.nom?.[0] || "?").toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900">{u.prenom || ""} {u.nom || ""}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">{u.email || "—"}</td>
                    <td className="px-4 py-3.5 text-gray-500">{u.telephone || "—"}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        u.is_active
                          ? "bg-emerald-50 text-emerald-600"
                          : u.is_verified
                          ? "bg-blue-50 text-blue-600"
                          : "bg-gray-100 text-gray-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          u.is_active ? "bg-emerald-500" : u.is_verified ? "bg-blue-500" : "bg-gray-400"
                        }`} />
                        {u.is_active ? "Actif" : u.is_verified ? "Vérifié" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-[12px]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button className="text-gray-300 hover:text-primary p-2 rounded-xl hover:bg-primary/5 transition-all">
                        <i className="fa-solid fa-ellipsis-vertical text-sm" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
