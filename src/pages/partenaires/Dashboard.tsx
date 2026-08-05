import { useEffect, useState } from "react";
import { Button, Card, Col, Empty, Progress, Row, Space, Spin, Tag, Typography } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  FileProtectOutlined,
  PlusCircleOutlined,
  RiseOutlined,
  ShopOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { partenairesService, type PartenaireStats, type PartenaireDeclaration } from "../../services/partenairesService";
import { statsService } from "../../services/statsService";
import { useStatsByType } from "../../hooks/useStats";
import { usePartenaire } from "../../context/PartenaireContext";
import { partenairePalette } from "../../theme/partenaires";

const today = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

function greeting() {
  const h = new Date().getHours();
  if (h >= 18) return "Bonsoir";
  if (h < 5) return "Bonsoir";
  return "Bonjour";
}

const formatDate = (v?: string | null) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return v;
  }
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: "Disponible", color: "blue" },
  MATCHED: { label: "Correspondance", color: "gold" },
  RETURNED: { label: "Rendu", color: "green" },
};

const statusTag = (s?: string | null) => {
  const st = STATUS_LABELS[s || ""];
  if (!st) return <Tag>{s || "—"}</Tag>;
  return <Tag color={st.color}>{st.label}</Tag>;
};

function getIconForType(type?: string) {
  const t = (type || "").toLowerCase();
  if (t.includes("cni")) return "fa-id-card";
  if (t.includes("pass")) return "fa-passport";
  if (t.includes("permis")) return "fa-car";
  if (t.includes("diplome")) return "fa-graduation-cap";
  if (t.includes("acte")) return "fa-file-invoice";
  if (t.includes("carte")) return "fa-credit-card";
  return "fa-file-lines";
}

export default function Dashboard() {
  const { partenaire } = usePartenaire();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PartenaireStats | null>(null);
  const [recent, setRecent] = useState<PartenaireDeclaration[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [globalStats, setGlobalStats] = useState<{ total_lost: number; total_recovered: number } | null>(null);
  const [perfPeriod, setPerfPeriod] = useState("month");
  const { stats: perfStats, loading: perfLoading } = useStatsByType(perfPeriod);

  useEffect(() => {
    let cancelled = false;
    partenairesService
      .getStats()
      .then((res) => {
        if (!cancelled) setStats(res.data.data);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.response?.data?.message || "Impossible de charger les statistiques.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    statsService
      .getGlobal()
      .then((res) => {
        if (!cancelled) setGlobalStats(res.data || null);
      })
      .catch(() => {
        if (!cancelled) setGlobalStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRecentLoading(true);
    partenairesService
      .getDeclarations({ limit: 6 })
      .then((res) => {
        if (!cancelled) setRecent(res.data.rows);
      })
      .catch(() => {
        if (!cancelled) setRecent([]);
      })
      .finally(() => {
        if (!cancelled) setRecentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <Typography.Text style={{ color: partenairePalette.textMuted }}>{error}</Typography.Text>
        </div>
      </Card>
    );
  }

  const cards = [
    {
      title: "Trouvailles déclarées",
      value: stats?.total_declarations ?? 0,
      icon: <FileProtectOutlined style={{ color: "#f59e0b" }} />,
      iconBg: "rgba(245,158,11,0.12)",
      hint: "Déclarations de votre organisation",
    },
    {
      title: "Disponibles",
      value: stats?.available ?? 0,
      icon: <ClockCircleOutlined style={{ color: "#3b82f6" }} />,
      iconBg: "rgba(59,130,246,0.12)",
      hint: "En attente de correspondance",
    },
    {
      title: "Correspondances",
      value: stats?.matched ?? 0,
      icon: <RiseOutlined style={{ color: "#8b5cf6" }} />,
      iconBg: "rgba(139,92,246,0.12)",
      hint: "Propriétaires identifiés",
    },
    {
      title: "Documents rendus",
      value: stats?.returned ?? 0,
      icon: <CheckCircleOutlined style={{ color: "#10b981" }} />,
      iconBg: "rgba(16,185,129,0.12)",
      hint: "Restitution réussie",
    },
  ];

  const donutTotal = (stats?.total_declarations ?? 0) || 1;

  const perfData = Array.isArray(perfStats) ? perfStats : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Greeting */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Typography.Title level={2} style={{ margin: 0, color: partenairePalette.greenDark, fontSize: 22 }}>
            {greeting()}, <span>{partenaire?.nom_organisation || "Partenaire"}</span>
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontStyle: "italic", fontSize: 13 }}>
            Voici un aperçu des activités de votre organisation.
          </Typography.Text>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: partenairePalette.surface,
            border: `1px solid ${partenairePalette.border}`,
            borderRadius: 10,
            padding: "8px 12px",
            whiteSpace: "nowrap",
          }}
        >
          <i className="fa-regular fa-calendar" style={{ color: partenairePalette.primary, fontSize: 14 }} />
          <Typography.Text type="secondary" style={{ fontSize: 13, textTransform: "capitalize" }}>
            {today}
          </Typography.Text>
        </div>
      </div>

      {/* Stat cards */}
      <Row gutter={[16, 16]}>
        {cards.map((c) => (
          <Col xs={12} md={6} key={c.title}>
            <Card style={{ borderRadius: 10, border: `1px solid ${partenairePalette.border}`, height: "100%" }} styles={{ body: { padding: 18 } }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <Typography.Text style={{ fontSize: 11.5, color: partenairePalette.textMuted, fontWeight: 500 }}>
                  {c.title}
                </Typography.Text>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: c.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginLeft: 8,
                  }}
                >
                  {c.icon}
                </div>
              </div>
              <Typography.Text style={{ fontSize: 26, fontWeight: 800, color: partenairePalette.greenDark, display: "block", lineHeight: 1.2 }}>
                {c.value}
              </Typography.Text>
              <Typography.Text style={{ fontSize: 11, color: partenairePalette.textMuted }}>{c.hint}</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Statistiques DocMaster (globales) */}
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}>
          <Card style={{ borderRadius: 10, border: `1px solid ${partenairePalette.border}`, height: "100%" }} styles={{ body: { padding: 18 } }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <Typography.Text style={{ fontSize: 11.5, color: partenairePalette.textMuted, fontWeight: 500 }}>
                Docs perdus (DocMaster)
              </Typography.Text>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: "rgba(239,68,68,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginLeft: 8,
                }}
              >
                <i className="fa-solid fa-triangle-exclamation" style={{ color: "#ef4444", fontSize: 16 }} />
              </div>
            </div>
            <Typography.Text style={{ fontSize: 26, fontWeight: 800, color: partenairePalette.greenDark, display: "block", lineHeight: 1.2 }}>
              {globalStats?.total_lost ?? "—"}
            </Typography.Text>
            <Typography.Text style={{ fontSize: 11, color: partenairePalette.textMuted }}>
              Documents perdus sur la plateforme
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderRadius: 10, border: `1px solid ${partenairePalette.border}`, height: "100%" }} styles={{ body: { padding: 18 } }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <Typography.Text style={{ fontSize: 11.5, color: partenairePalette.textMuted, fontWeight: 500 }}>
                Docs retrouvés (DocMaster)
              </Typography.Text>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: "rgba(139,92,246,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginLeft: 8,
                }}
              >
                <i className="fa-solid fa-hand-holding-heart" style={{ color: "#8b5cf6", fontSize: 16 }} />
              </div>
            </div>
            <Typography.Text style={{ fontSize: 26, fontWeight: 800, color: partenairePalette.greenDark, display: "block", lineHeight: 1.2 }}>
              {globalStats?.total_recovered ?? "—"}
            </Typography.Text>
            <Typography.Text style={{ fontSize: 11, color: partenairePalette.textMuted }}>
              Documents restitués sur la plateforme
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      {/* Activities + CTA */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          {/* Quick actions / empty state */}
          {recent.length === 0 && !recentLoading ? (
            <Card
              style={{
                borderRadius: 10,
                border: `1px dashed ${partenairePalette.border}`,
                textAlign: "center",
                background: partenairePalette.surface,
              }}
              styles={{ body: { padding: 36 } }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: partenairePalette.greenLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <i className="fa-solid fa-folder-open" style={{ color: partenairePalette.textMuted, fontSize: 24 }} />
              </div>
              <Typography.Title level={4} style={{ marginBottom: 4, color: partenairePalette.greenDark }}>
                Aucune activité pour le moment
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 18 }}>
                Lancez-vous en déclarant une trouvaille : le document pourra retrouver son propriétaire et votre
                organisation sera récompensée.
              </Typography.Text>
              <Space wrap>
                <Button
                  type="primary"
                  icon={<PlusCircleOutlined />}
                  onClick={() => navigate("/partenaire/declarer")}
                  style={{ height: 38 }}
                >
                  Déclarer une trouvaille
                </Button>
                <Button icon={<FileProtectOutlined />} onClick={() => navigate("/partenaire/declarations")} style={{ height: 38 }}>
                  Voir mes déclarations
                </Button>
              </Space>
            </Card>
          ) : (
            <Card
              style={{ borderRadius: 10, border: `1px solid ${partenairePalette.border}` }}
              title={
                <Space size={8}>
                  <i className="fa-solid fa-clock-rotate-left" style={{ color: partenairePalette.primary, fontSize: 14 }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: partenairePalette.greenDark }}>
                    Activités récentes
                  </span>
                </Space>
              }
              extra={
                <Typography.Text
                  style={{ fontSize: 12, fontWeight: 600, color: partenairePalette.primaryDark, cursor: "pointer" }}
                  onClick={() => navigate("/partenaire/declarations")}
                >
                  Tout voir <i className="fa-solid fa-arrow-right" style={{ fontSize: 9 }} />
                </Typography.Text>
              }
              styles={{ body: { padding: 0 } }}
            >
              {recentLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
                  <Spin />
                </div>
              ) : recent.length === 0 ? (
                <Empty description="Aucune activité" style={{ padding: 24 }} />
              ) : (
                recent.slice(0, 6).map((decl, i) => (
                  <div
                    key={decl.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      borderBottom: i < Math.min(recent.slice(0, 6).length, 6) - 1 ? `1px solid ${partenairePalette.border}` : "none",
                      cursor: "pointer",
                    }}
                    onClick={() => navigate("/partenaire/declarations")}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: partenairePalette.primaryLight,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <i className={`fa-solid ${getIconForType(decl.doc_type)}`} style={{ color: partenairePalette.primaryDark, fontSize: 14 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Typography.Text strong style={{ fontSize: 13, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {decl.doc_type_name || decl.doc_type || "Document"} trouvé
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 11.5, fontStyle: "italic", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <EnvironmentOutlined style={{ fontSize: 9 }} /> {decl.ville || "Localisation non précisée"} ·{" "}
                        <i className="fa-regular fa-clock" style={{ fontSize: 9 }} /> {formatDate(decl.created_at)}
                      </Typography.Text>
                    </div>
                    {statusTag(decl.status)}
                  </div>
                ))
              )}
            </Card>
          )}

          {/* CTA rapide */}
          <Card style={{ borderRadius: 10, border: `1px solid ${partenairePalette.border}` }} styles={{ body: { padding: 20 } }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  background: partenairePalette.greenLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ShopOutlined style={{ fontSize: 20, color: partenairePalette.greenDark }} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <Typography.Text strong style={{ display: "block", color: partenairePalette.greenDark }}>
                  {partenaire?.nom_organisation}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  <Tag color="cyan" style={{ marginRight: 6 }}>
                    Partenaire
                  </Tag>
                  <EnvironmentOutlined style={{ marginRight: 4, fontSize: 11 }} />
                  {partenaire?.ville || "—"}
                  {partenaire?.region ? `, ${partenaire.region}` : ""}
                </Typography.Text>
              </div>
              <Button type="primary" icon={<PlusCircleOutlined />} onClick={() => navigate("/partenaire/declarer")}>
                Déclarer une trouvaille
              </Button>
            </div>
          </Card>
        </div>

      {/* Portefeuille + Donut sur la même ligne */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card style={{ borderRadius: 10, border: `1px solid ${partenairePalette.border}`, height: "100%" }} styles={{ body: { padding: 20 } }}>
            <Space size={8} style={{ marginBottom: 14 }}>
              <i className="fa-solid fa-wallet" style={{ color: partenairePalette.primary, fontSize: 14 }} />
              <Typography.Text strong style={{ color: partenairePalette.greenDark, fontSize: 15 }}>
                Portefeuille
              </Typography.Text>
            </Space>
            <Typography.Text type="secondary" style={{ fontSize: 11.5, display: "block", marginBottom: 4 }}>
              Solde disponible
            </Typography.Text>
            <Typography.Title level={3} style={{ margin: 0, color: partenairePalette.success, fontWeight: 800 }}>
              {Number(partenaire?.wallet_balance ?? 0).toLocaleString("fr-FR")} FCFA
            </Typography.Title>
            <Button
              block
              style={{ marginTop: 14, height: 36 }}
              onClick={() => navigate("/partenaire/portefeuille")}
              icon={<i className="fa-solid fa-arrow-right" style={{ fontSize: 11 }} />}
            >
              Voir l'historique
            </Button>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card style={{ borderRadius: 10, border: `1px solid ${partenairePalette.border}`, height: "100%" }} styles={{ body: { padding: 20 } }}>
            <Space size={8} style={{ marginBottom: 16 }}>
              <i className="fa-solid fa-chart-pie" style={{ color: partenairePalette.primary, fontSize: 14 }} />
              <Typography.Text strong style={{ color: partenairePalette.greenDark, fontSize: 15 }}>
                Répartition des trouvailles
              </Typography.Text>
            </Space>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <Progress
                  type="dashboard"
                  percent={Math.round(((stats?.total_declarations ?? 0) / donutTotal) * 100)}
                  size={120}
                  strokeColor={{ "0%": partenairePalette.primary, "100%": partenairePalette.success }}
                  format={() => (
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: partenairePalette.greenDark, lineHeight: 1 }}>
                        {stats?.total_declarations ?? 0}
                      </div>
                      <div style={{ fontSize: 10, color: partenairePalette.textMuted }}>trouvailles</div>
                    </div>
                  )}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 160 }}>
                <DonutRow color="#3b82f6" label="Disponibles" value={stats?.available ?? 0} />
                <DonutRow color="#8b5cf6" label="Correspondances" value={stats?.matched ?? 0} />
                <DonutRow color="#10b981" label="Rendus" value={stats?.returned ?? 0} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Performances DocMaster */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card style={{ borderRadius: 10, border: `1px solid ${partenairePalette.border}` }} styles={{ body: { padding: 20 } }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div>
                <Typography.Text strong style={{ color: partenairePalette.greenDark, fontSize: 15 }}>
                  Performances DocMaster
                </Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12, fontStyle: "italic" }}>
                  Évolution des documents perdus et trouvés par type sur la plateforme.
                </Typography.Text>
              </div>
              <Space wrap size={4}>
                {PERIODS.map((p) => (
                  <Button
                    key={p.key}
                    size="small"
                    type={perfPeriod === p.key ? "primary" : "default"}
                    onClick={() => setPerfPeriod(p.key)}
                    style={{ fontSize: 12 }}
                  >
                    {p.label}
                  </Button>
                ))}
              </Space>
            </div>
            <Row gutter={[12, 12]}>
              {perfLoading ? (
                <Col span={24} style={{ textAlign: "center", padding: 24 }}>
                  <Spin />
                </Col>
              ) : perfData.length > 0 ? (
                perfData.slice(0, 8).map((doc: any, idx: number) => (
                  <Col xs={12} sm={8} lg={6} key={doc.code || idx}>
                    <PerfCard doc={doc} period={perfPeriod} />
                  </Col>
                ))
              ) : (
                <Col span={24}>
                  <Empty description="Aucune donnée de performance pour la période sélectionnée" />
                </Col>
              )}
            </Row>
          </Card>
        </Col>
      </Row>

    </div>
  );
}

function DonutRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <Space size={8} style={{ fontSize: 13 }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
      <Space size={24} style={{ width: "100%", justifyContent: "space-between" }}>
        <Typography.Text style={{ fontWeight: 500 }}>{label}</Typography.Text>
        <Typography.Text strong>{value}</Typography.Text>
      </Space>
    </Space>
  );
}

const PERIODS = [
  { key: "day", label: "Jour" },
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
  { key: "year", label: "Année" },
];

const PERIOD_LABELS: Record<string, string> = {
  day: "ce jour",
  week: "cette semaine",
  month: "ce mois",
  year: "cette année",
};

function periodLabel(p?: string) {
  return PERIOD_LABELS[p || "month"] || "ce mois";
}

const PERF_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  CNI: { icon: "fa-id-card", color: "#3b82f6" },
  PASSPORT: { icon: "fa-passport", color: "#8b5cf6" },
  PERMIS: { icon: "fa-car", color: "#10b981" },
  DIPLOME: { icon: "fa-graduation-cap", color: "#f59e0b" },
  CARTE_BLUE: { icon: "fa-credit-card", color: "#6366f1" },
  CARTE_GRISE: { icon: "fa-file-invoice", color: "#ef4444" },
  ACTE_NAISSANCE: { icon: "fa-file-circle-plus", color: "#14b8a6" },
  DEFAULT: { icon: "fa-file-lines", color: "#6b7280" },
};

function timeAgo(dateString?: string) {
  if (!dateString) return "—";
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  return "récemment";
}

function PerfCard({ doc, period }: { doc: any; period?: string }) {
  const code = doc.code || "DEFAULT";
  const cfg = PERF_TYPE_ICONS[code] || PERF_TYPE_ICONS.DEFAULT;
  const trend = parseFloat(doc.trend) || 0;
  const isUp = trend >= 0;
  const total = parseInt(doc.total) || 0;
  const lost = parseInt(doc.lost) || 0;
  const found = parseInt(doc.found) || 0;
  const latest = doc.recent_items?.[0];
  const activityText = latest
    ? `${latest.type === "LOST" ? "perdu" : "trouvé"} ${timeAgo(latest.date)}${latest.ville ? ` à ${latest.ville}` : ""}`
    : "aucune activité récente";

  return (
    <Card style={{ borderRadius: 10, border: `1px solid ${partenairePalette.border}`, height: "100%" }} styles={{ body: { padding: 14 } }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: `${cfg.color}1A`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <i className={`fa-solid ${cfg.icon}`} style={{ color: cfg.color, fontSize: 12 }} />
        </div>
        <Typography.Text
          strong
          style={{ fontSize: 12.5, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {doc.name || "Document"}
        </Typography.Text>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: isUp ? "#16a34a" : "#ef4444",
            background: isUp ? "#dcfce7" : "#fee2e2",
            padding: "2px 6px",
            borderRadius: 6,
            whiteSpace: "nowrap",
          }}
        >
          <i className={`fa-solid ${isUp ? "fa-arrow-up" : "fa-arrow-down"}`} style={{ fontSize: 7, marginRight: 2 }} />{" "}
          {Math.abs(trend)}%
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <Typography.Text style={{ fontSize: 18, fontWeight: 800, color: partenairePalette.primaryDark }}>
          {total.toLocaleString("fr-FR")}
        </Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 10.5, fontStyle: "italic" }}>
          {periodLabel(period)}
        </Typography.Text>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <div style={{ fontSize: 9.5, color: "#d97706", background: "#fef3c7", padding: "2px 6px", borderRadius: 6 }}>
          <i className="fa-solid fa-arrow-down" style={{ fontSize: 7, marginRight: 3 }} /> {lost} perdus
        </div>
        <div style={{ fontSize: 9.5, color: "#16a34a", background: "#dcfce7", padding: "2px 6px", borderRadius: 6 }}>
          <i className="fa-solid fa-arrow-up" style={{ fontSize: 7, marginRight: 3 }} /> {found} trouvés
        </div>
      </div>
      <div
        style={{
          fontSize: 9.5,
          color: partenairePalette.textMuted,
          background: partenairePalette.bgMain,
          padding: "3px 6px",
          borderRadius: 6,
          marginTop: 6,
          width: "fit-content",
          maxWidth: "100%",
        }}
      >
        <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: 7, marginRight: 4 }} /> {activityText}
      </div>
    </Card>
  );
}