import { useEffect, useState } from "react";
import { declarationsService } from "../../services/declarationsService";
import type { Declaration } from "../../types/api";

const typeLabels: Record<string, string> = {
  LOST: "Perdu",
  FOUND: "Trouvé",
};

const statusColors: Record<string, string> = {
  SEARCHING: "bg-blue-50 text-blue-600 border-blue-200/50",
  MATCHED: "bg-emerald-50 text-emerald-600 border-emerald-200/50",
  RETURNED: "bg-gray-100 text-gray-500 border-gray-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200/50",
  PENDING: "bg-amber-50 text-amber-600 border-amber-200/50",
};

const statusLabels: Record<string, string> = {
  SEARCHING: "Recherche",
  MATCHED: "Correspondance",
  RETURNED: "Restitué",
  CANCELLED: "Annulé",
  PENDING: "En attente",
};

export default function AdminDeclarations() {
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    declarationsService
      .getAll()
      .then((res) => setDeclarations(res.data || []))
      .catch(() => setDeclarations([]))
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
        <h1 className="font-bricolage text-2xl font-black text-gray-900">Déclarations</h1>
        <p className="text-gray-400 text-[13px] font-medium mt-1">Toutes les déclarations de documents</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Propriétaire</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Document</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="text-left px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="text-right px-4 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {declarations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-300">
                    <i className="fa-solid fa-file-lines text-3xl mb-3" />
                    <p className="text-[13px] font-medium text-gray-400">Aucune déclaration</p>
                  </td>
                </tr>
              ) : (
                declarations.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-gray-900">
                        {d.user_name || d.user_email || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        d.declaration_type === "LOST"
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}>
                        <i className={`fa-solid text-[10px] ${
                          d.declaration_type === "LOST" ? "fa-circle-exclamation" : "fa-circle-check"
                        }`} />
                        {typeLabels[d.declaration_type] || d.declaration_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-700">
                      {d.document_type_name || d.docTypeInfo?.nom || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColors[d.status] || "bg-gray-100 text-gray-400 border-gray-200"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          d.status === "SEARCHING" ? "bg-blue-500" :
                          d.status === "MATCHED" ? "bg-emerald-500" :
                          d.status === "RETURNED" ? "bg-gray-400" :
                          d.status === "CANCELLED" ? "bg-red-500" : "bg-amber-500"
                        }`} />
                        {statusLabels[d.status] || d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-[12px]">
                      {d.created_at ? new Date(d.created_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button className="text-gray-300 hover:text-primary p-2 rounded-xl hover:bg-primary/5 transition-all">
                        <i className="fa-solid fa-eye text-sm" />
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
