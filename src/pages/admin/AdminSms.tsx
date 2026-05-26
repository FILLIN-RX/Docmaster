import { useState } from "react";
import apiClient from "../../services/api";

export default function AdminSms() {
  const [form, setForm] = useState({ recipients: "", message: "", type: "all" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await apiClient.post("sms/send", form);
      setSent(true);
      setForm({ recipients: "", message: "", type: "all" });
      setTimeout(() => setSent(false), 3000);
    } catch {
      // error
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-bricolage text-2xl font-black text-gray-900">Gestion SMS</h1>
        <p className="text-gray-400 text-[13px] font-medium mt-1">Envoyez des SMS aux utilisateurs</p>
      </div>

      {sent && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-[12px] font-semibold flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
            <i className="fa-solid fa-check-circle text-emerald-600 text-sm" />
          </div>
          SMS envoyé avec succès
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
        <form onSubmit={handleSend} className="space-y-5">
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Type de destinataires</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            >
              <option value="all">Tous les utilisateurs</option>
              <option value="active">Utilisateurs actifs</option>
              <option value="subscribed">Abonnés</option>
              <option value="custom">Liste personnalisée</option>
            </select>
          </div>

          {form.type === "custom" && (
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Numéros (séparés par des virgules)</label>
              <textarea
                value={form.recipients}
                onChange={(e) => setForm({ ...form, recipients: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                placeholder="+237612345678, +237698765432"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={5}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
              placeholder="Votre message SMS..."
              required
              maxLength={160}
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[11px] text-gray-400">
                {form.message.length}/160 caractères
              </p>
              <p className={`text-[11px] font-semibold ${
                form.message.length > 140 ? "text-amber-500" : "text-gray-400"
              }`}>
                {Math.ceil(form.message.length / 160)} SMS
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={sending || !form.message}
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-bold text-[13px] hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-60 flex items-center gap-2"
          >
            {sending ? (
              <i className="fa-solid fa-spinner fa-spin" />
            ) : (
              <i className="fa-solid fa-paper-plane" />
            )}
            {sending ? "Envoi en cours..." : "Envoyer le SMS"}
          </button>
        </form>
      </div>
    </div>
  );
}
