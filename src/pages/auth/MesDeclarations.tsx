import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { declarationsService, documentTypesService } from "../../services/declarationsService";
import { useAuth } from "../../context/AuthContext";
import Topbar from "../../layout/Topbar";
import type { Declaration } from "../../types/api";

interface DeclarationExtended extends Declaration {
  declaration_type?: string;
  identifiant_doc_dm?: string;
  docTypeInfo?: { nom: string };
  doc_type?: string;
  owner_name?: string;
  ville?: string;
  region?: string;
  pays?: string;
  photo_recto?: string;
  photo_verso?: string;
  etat_physique?: string;
  date_expiration?: string;
  document_number?: string;
}

type Filter = "all" | "perdu" | "trouve";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  MATCHED:    { label: "Match trouvé !",     cls: "bg-green-100 text-green-700 border-green-200 animate-pulse" },
  RETURNED:   { label: "Clôturé / Remis",    cls: "bg-gray-100 text-gray-700 border-gray-200" },
  RESOLVED:   { label: "Résolu",             cls: "bg-green-50 text-green-700 border-green-100" },
  NEW:        { label: "Nouveau",            cls: "bg-blue-50 text-blue-700 border-blue-100" },
  EN_COURS:   { label: "En cours",           cls: "bg-amber-50 text-amber-700 border-amber-100" },
};

function getStatusMeta(status?: string) {
  return STATUS_META[status || ""] || { label: "En cours", cls: "bg-amber-50 text-amber-700 border-amber-100" };
}

function fmtDate(v?: string | null) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function MesDeclarations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [allDeclarations, setAllDeclarations] = useState<DeclarationExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [docTypeMap, setDocTypeMap] = useState<Record<string, string>>({});

  const getDocTypeName = useCallback((decl: DeclarationExtended): string => {
    if (decl.docTypeInfo?.nom) return decl.docTypeInfo.nom;
    const id = decl.doc_type;
    if (id && docTypeMap[id]) return docTypeMap[id];
    return decl.document_type || "Document";
  }, [docTypeMap]);

  // Initial filter from URL ?type=perdu|trouve
  useEffect(() => {
    const t = searchParams.get("type");
    if (t === "perdu" || t === "trouve") setFilter(t);
  }, []);

  // Load document type names to resolve UUIDs
  useEffect(() => {
    documentTypesService.getActive().then((res) => {
      console.log("[MesDeclarations] getActive doc types response:", res);
      if (res.success && Array.isArray(res.data)) {
        const map: Record<string, string> = {};
        for (const d of res.data) {
          map[d.id] = d.nom;
        }
        setDocTypeMap(map);
      }
    });
  }, []);

  const fetchDeclarations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await declarationsService.getMyDeclarations();
      console.log("[MesDeclarations] getMyDeclarations response:", res);
      setAllDeclarations((res.data || []) as DeclarationExtended[]);
    } catch {
      setAllDeclarations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeclarations();
  }, [fetchDeclarations]);

  const filtered = allDeclarations.filter((item) => {
    if (filter === "all") return true;
    const t = (item.declaration_type || item.type || "").toUpperCase();
    return filter === "perdu" ? t === "LOST" : t === "FOUND" || t === "TROUVE";
  });

  const detailItem = detailId ? allDeclarations.find((d) => d.id === detailId) : null;

  const openDetail = (id: string) => setDetailId(id);
  const closeDetail = () => setDetailId(null);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="Mes déclarations" breadcrumbs={[{ label: "Accueil", href: "/dashboard" }, { label: "Mes déclarations" }]} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-11 h-11 rounded-full border-4 border-borda border-t-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar
        title="Mes déclarations"
        breadcrumbs={[
          { label: "Accueil", href: "/dashboard" },
          { label: "Mes déclarations" },
        ]}
      />

      <div className="custom-scroll p-4 sm:p-6 flex flex-col gap-4 pb-24 md:pb-8" style={{ height: "calc(100vh - 64px)", overflowY: "auto" }}>

        {/* Header card */}
        <section className="bg-white border border-borda rounded-[18px] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-bricolage text-xl sm:text-2xl font-extrabold text-gray-800">Historique de vos déclarations</h1>
              <p className="text-[12.5px] text-textMuted/70 mt-1">Suivez l'état de vos pertes et de vos documents trouvés.</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {([
              { key: "all", label: "Toutes" },
              { key: "perdu", label: "Pertes" },
              { key: "trouve", label: "Trouvés" },
            ] as { key: Filter; label: string }[]).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full border text-[12px] font-semibold transition-all ${
                  filter === f.key
                    ? "bg-primary text-white border-primary"
                    : "bg-bgMain text-textMuted border-borda hover:border-primary hover:text-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        {/* Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const isPerdu = (item.declaration_type || item.type || "").toUpperCase() === "LOST";
            const typeBadge = isPerdu
              ? "bg-red-50 text-red-700 border-red-100"
              : "bg-green-50 text-green-700 border-green-100";
            const typeIcon = isPerdu ? "fa-triangle-exclamation" : "fa-file-circle-check";
            const typeLabel = isPerdu ? "Perte" : "Trouvé";
            const statusMeta = getStatusMeta(item.status);

            return (
              <article
                key={item.id}
                onClick={() => openDetail(item.id)}
                className="bg-white border border-borda rounded-[18px] p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-textMuted/60 uppercase tracking-wide">
                      {item.identifiant_doc_dm || "DOC-DM"}
                    </p>
                    <h3 className="font-bricolage text-[18px] font-bold text-gray-800 leading-tight mt-0.5">
                      {getDocTypeName(item)}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap ${typeBadge}`}>
                    <i className={`fa-solid ${typeIcon} mr-1`} />{typeLabel}
                  </span>
                </div>

                <div className="space-y-1.5 text-[12.5px] text-textMuted">
                  <p><i className="fa-regular fa-user mr-1.5 w-4" /> {item.owner_name || item.nom_complet || "Inconnu"}</p>
                  <p><i className="fa-regular fa-calendar mr-1.5 w-4" /> {fmtDate(item.created_at)}</p>
                  <p><i className="fa-solid fa-location-dot mr-1.5 w-4" /> {item.ville || item.lieu_perte || item.lieu_trouvee || "—"}</p>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold ${statusMeta.cls}`}>
                    {statusMeta.label}
                  </span>
                  <button className="px-3 py-1.5 rounded-[9px] bg-surface2 border border-borda text-[12px] font-semibold text-textMuted/70 hover:border-primary hover:text-primary transition-colors">
                    Voir détails
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        {/* Empty state */}
        {filtered.length === 0 && (
          <section className="bg-white border border-borda rounded-[22px] p-10 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-bgMain border border-borda flex items-center justify-center mb-4">
              <i className="fa-solid fa-folder-open text-textMuted text-2xl" />
            </div>
            <p className="text-[17px] font-bold text-textMain font-bricolage">Aucune déclaration trouvée</p>
            <p className="text-[13px] text-textMuted/70 mt-2 mb-6 max-w-[280px] mx-auto leading-relaxed">
              Vous n'avez pas encore publié de déclaration. Commencez dès maintenant pour retrouver vos objets.
            </p>
            <button
              onClick={() => navigate("/declarer")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <i className="fa-solid fa-plus" /> Créer une déclaration
            </button>
          </section>
        )}

        {/* Premium CTA banner mobile */}
        <section className="mt-4 xl:hidden bg-green-dark rounded-[22px] p-6 relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[10px] font-black uppercase tracking-wider">Premium</span>
            </div>
            <h3 className="font-bricolage text-lg font-bold mb-1">Boostez vos chances de succès</h3>
            <p className="text-white/60 text-[12.5px] leading-relaxed mb-4">
              Passez au plan Pro pour bénéficier d'alertes instantanées et d'une mise en avant prioritaire de vos documents.
            </p>
            <button
              onClick={() => navigate("/abonnement")}
              className="inline-flex items-center gap-2 text-primary font-bold text-[13px] hover:gap-3 transition-all"
            >
              Découvrir les plans <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
          <div className="absolute bottom-4 right-6 opacity-20 transform rotate-12 pointer-events-none">
            <i className="fa-solid fa-rocket text-6xl" />
          </div>
        </section>
      </div>

      {/* ────── Detail slide-in panel ────── */}
      <div
        className={`fixed inset-0 bg-green-dark/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          detailId ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeDetail}
      >
        <div
          className={`absolute right-0 top-0 bottom-0 w-full max-w-[450px] bg-white shadow-2xl transition-transform duration-300 overflow-y-auto custom-scroll pb-20 md:pb-0 ${
            detailId ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {detailItem && (
            <>
              {/* Panel Header */}
              <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-borda p-5 flex items-center justify-between z-10">
                <h2 className="font-bricolage text-xl font-bold text-textMain">Détails de la déclaration</h2>
                <button
                  onClick={closeDetail}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-bgMain text-textMuted hover:text-red-500 transition-colors"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              {/* Panel Content */}
              <div className="p-6 space-y-6">
                {/* Badge Type */}
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-bgMain border border-borda text-[11px] font-bold text-textMuted uppercase tracking-wider">
                    {detailItem.identifiant_doc_dm || "DOC-DM"}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full border text-[11px] font-bold ${
                      (detailItem.declaration_type || detailItem.type || "").toUpperCase() === "LOST"
                        ? "bg-red-50 text-red-700 border-red-100"
                        : "bg-green-50 text-green-700 border-green-100"
                    }`}
                  >
                    {(detailItem.declaration_type || detailItem.type || "").toUpperCase() === "LOST"
                      ? "Déclaration de Perte"
                      : "Document Trouvé"}
                  </span>
                </div>

                {/* Main Info */}
                <div>
                  <h3 className="font-bricolage text-2xl font-extrabold text-gray-800">
                    {getDocTypeName(detailItem)}
                  </h3>
                  <p className="text-textMuted/70 text-sm mt-1">Publié le {fmtDate(detailItem.created_at)}</p>
                </div>

                {/* Status Card */}
                <div className={`p-4 rounded-2xl border ${getStatusMeta(detailItem.status).cls} flex items-center justify-between`}>
                  <span className="text-sm font-bold text-textMuted/80">Statut actuel</span>
                  <span className="px-3 py-1 rounded-full bg-white/50 border border-current text-xs font-bold uppercase">
                    {getStatusMeta(detailItem.status).label}
                  </span>
                </div>

                {/* Images */}
                <div className="grid grid-cols-2 gap-3">
                  <ImageBox
                    src={detailItem.photo_recto}
                    label="Recto"
                  />
                  <ImageBox
                    src={detailItem.photo_verso}
                    label="Verso"
                  />
                </div>

                {/* Details List */}
                <div className="space-y-4 pt-4 border-t border-borda">
                  <DetailRow icon="fa-regular fa-user" label="Propriétaire déclaré" value={detailItem.owner_name || detailItem.nom_complet || "Non spécifié"} />
                  <DetailRow icon="fa-solid fa-hashtag" label="Numéro du document" value={detailItem.document_number || detailItem.numero_document || "Non spécifié"} />
                  <DetailRow
                    icon="fa-solid fa-location-dot"
                    label="Localisation"
                    value={`${detailItem.ville || detailItem.lieu_perte || detailItem.lieu_trouvee || "—"}, ${detailItem.region || "—"} (${detailItem.pays || "Cameroun"})`}
                  />
                  <DetailRow
                    icon="fa-solid fa-stethoscope"
                    label="État Physique"
                    value={
                      detailItem.etat_physique
                        ? detailItem.etat_physique === "bon"
                          ? "Bon état"
                          : detailItem.etat_physique === "use"
                          ? "Usagé"
                          : "Endommagé"
                        : "Non précisé"
                    }
                  />
                  {detailItem.date_expiration && (
                    <DetailRow icon="fa-solid fa-calendar-xmark" label="Date d'expiration" value={fmtDate(detailItem.date_expiration)} />
                  )}
                </div>

                {/* Description */}
                <div className="pt-4 border-t border-borda">
                  <p className="text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Description &amp; Notes</p>
                  <div className="p-4 bg-bgMain rounded-2xl text-sm text-textMain leading-relaxed italic whitespace-pre-wrap">
                    "{detailItem.description || "Aucune description fournie."}"
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 flex flex-col gap-3">
                  {detailItem.status === "MATCHED" && (
                    <button
                      onClick={() =>
                        navigate(
                          `/${(detailItem.declaration_type || detailItem.type || "").toUpperCase() === "LOST" ? "recuperer" : "rendre"}?id=${detailItem.id}`
                        )
                      }
                      className={`w-full py-4 text-white rounded-xl font-black text-base shadow-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 ${
                        (detailItem.declaration_type || detailItem.type || "").toUpperCase() === "LOST"
                          ? "bg-green-600"
                          : "bg-blue-600"
                      }`}
                    >
                      <i className={`fa-solid ${(detailItem.declaration_type || detailItem.type || "").toUpperCase() === "LOST" ? "fa-handshake" : "fa-hand-holding-heart"}`} />
                      {(detailItem.declaration_type || detailItem.type || "").toUpperCase() === "LOST"
                        ? "Récupérer mon document"
                        : "Rendre le document"}
                    </button>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/partage?id=${detailItem.id}`)}
                      className="flex-1 py-3 bg-green-dark text-white rounded-xl font-bold text-sm hover:bg-green-mid transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-dark/10"
                    >
                      <i className="fa-solid fa-share-nodes" /> Partager
                    </button>
                    <button className="flex-1 py-3 border border-borda text-textMuted rounded-xl font-bold text-sm hover:bg-bgMain transition-colors">
                      <i className="fa-solid fa-flag mr-1" /> Signaler
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───── Sub-components ───── */

function ImageBox({ src, label }: { src?: string | null; label: string }) {
  const url = src
    ? src.startsWith("http") || src.startsWith("data:")
      ? src
      : "/" + src.replace(/^\//, "")
    : null;

  return (
    <div className="aspect-[4/3] bg-bgMain rounded-2xl border border-borda overflow-hidden group relative">
      {url ? (
        <img
          src={url}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => window.open(url)}
          title="Cliquer pour agrandir"
          alt={label}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-textMuted opacity-50">
          <i className="fa-solid fa-image text-2xl mb-1" />
          <span className="text-[10px]">{label} absent</span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-[9px] font-bold rounded uppercase pointer-events-none">
        {label}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-bgMain border border-borda flex items-center justify-center text-textMuted shrink-0">
        <i className={icon} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-textMuted uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-textMain">{value}</p>
      </div>
    </div>
  );
}
