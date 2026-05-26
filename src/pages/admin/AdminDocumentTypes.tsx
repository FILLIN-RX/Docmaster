import { useEffect, useState } from "react";
import { adminService } from "../../services/admin";

interface DocumentType {
  id: string;
  label: string;
  nom?: string;
  icon?: string;
  is_active?: boolean;
}

export default function AdminDocumentTypes() {
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("fa-file-lines");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const fetchTypes = () => {
    adminService
      .getDocumentTypes()
      .then((data) => setTypes(Array.isArray(data) ? data : []))
      .catch(() => setTypes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    try {
      await adminService.createDocumentType({ label: newLabel.trim(), icon: newIcon });
      setNewLabel("");
      setNewIcon("fa-file-lines");
      fetchTypes();
    } catch {} finally {
      setAdding(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await adminService.toggleDocumentType(id);
      setTypes((prev) => prev.map((t) => (t.id === id ? { ...t, is_active: !t.is_active } : t)));
    } catch {}
  };

  const handleUpdateLabel = async (id: string) => {
    if (!editLabel.trim()) return;
    try {
      await adminService.updateDocumentType(id, { label: editLabel.trim() });
      setTypes((prev) => prev.map((t) => (t.id === id ? { ...t, label: editLabel.trim(), nom: editLabel.trim() } : t)));
      setEditingId(null);
    } catch {}
  };

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
        <h1 className="font-bricolage text-2xl font-black text-gray-900">Types de documents</h1>
        <p className="text-gray-400 text-[13px] font-medium mt-1">Gestion des types de documents disponibles</p>
      </div>

      {/* Add new type */}
      <div className="bg-white rounded-2xl border border-gray-200/60 p-5 shadow-sm mb-5">
        <h2 className="font-bricolage text-base font-bold text-gray-900 mb-4">Ajouter un type</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Nom du type (ex: CNI, Passeport...)"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>
          <div className="w-full sm:w-40">
            <select
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            >
              <option value="fa-id-card">Carte</option>
              <option value="fa-passport">Passeport</option>
              <option value="fa-car">Permis</option>
              <option value="fa-graduation-cap">Diplôme</option>
              <option value="fa-file-invoice">Acte</option>
              <option value="fa-file-lines">Document</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !newLabel.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-bold text-[13px] hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-60 flex items-center gap-2 whitespace-nowrap"
          >
            {adding ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-plus" />}
            Ajouter
          </button>
        </div>
      </div>

      {/* Types list */}
      <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Icône</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Nom</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="text-right px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {types.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-gray-300">
                    <i className="fa-solid fa-tags text-3xl mb-3" />
                    <p className="text-[13px] font-medium text-gray-400">Aucun type de document</p>
                  </td>
                </tr>
              ) : (
                types.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <i className={`fa-solid ${t.icon || "fa-file-lines"} text-sm`} />
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {editingId === t.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-primary w-48"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateLabel(t.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                          />
                          <button
                            onClick={() => handleUpdateLabel(t.id)}
                            className="text-emerald-600 hover:text-emerald-700 p-1"
                          >
                            <i className="fa-solid fa-check" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            <i className="fa-solid fa-xmark" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-semibold text-gray-900">{t.label || t.nom || "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        t.is_active !== false
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200/50"
                          : "bg-gray-100 text-gray-400 border-gray-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.is_active !== false ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {t.is_active !== false ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingId(t.id);
                            setEditLabel(t.label || t.nom || "");
                          }}
                          className="text-[11px] px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold transition-all"
                        >
                          <i className="fa-solid fa-pen text-[10px] mr-1" />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleToggle(t.id)}
                          className={`text-[11px] px-3 py-1.5 rounded-xl font-bold transition-all ${
                            t.is_active !== false
                              ? "bg-red-50 text-red-500 hover:bg-red-100"
                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        >
                          <i className={`fa-solid text-[10px] mr-1 ${t.is_active !== false ? "fa-ban" : "fa-check"}`} />
                          {t.is_active !== false ? "Désactiver" : "Activer"}
                        </button>
                      </div>
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
