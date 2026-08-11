import { useEffect, useState } from "react";
import { Trans } from "react-i18next";
import { Avatar, Card, Col, Row, Spin, Statistic, Typography, Tag, Space, Empty } from "antd";
import {
  FileProtectOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  UserOutlined,
  EnvironmentOutlined,
  RiseOutlined,
  SafetyCertificateFilled,
  IdcardOutlined,
  ArrowRightOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { BorderBeam } from "antd";
import { autoritesService, type AutoriteStats, type AutoriteDeclaration } from "../../services/autoritesService";
import { useAutorite } from "../../context/AutoriteContext";
import { useI18n } from "../../context/I18nContext";
import { autoritePalette } from "../../theme/autorites";

const DOC_TYPE_KEYS: Record<string, string> = {
  "carte-nationale-identite": "mesdocuments_category_cni",
  "carte nationale d'identité": "mesdocuments_category_cni",
  cni: "mesdocuments_category_cni",
  passeport: "mesdocuments_category_passeport",
  permis_conduire: "mesdocuments_category_permis",
  "permis-conduire": "mesdocuments_category_permis",
  "permis de conduire": "mesdocuments_category_permis",
  carte_grise: "autorite_doc_carte_grise",
  "carte-grise": "autorite_doc_carte_grise",
  "carte grise": "autorite_doc_carte_grise",
  "titre-foncier": "autorite_doc_titre_foncier",
  "titre foncier": "autorite_doc_titre_foncier",
  diplome: "mesdocuments_category_diplome",
  diplôme: "mesdocuments_category_diplome",
  diploma: "mesdocuments_category_diplome",
};
const docTypeKey = (raw?: string | null): string => {
  if (!raw) return "autorite_dashboard_doc_default";
  const n = String(raw).toLowerCase();
  return DOC_TYPE_KEYS[n] || DOC_TYPE_KEYS[String(raw)] || "autorite_dashboard_doc_default";
};

export default function Dashboard() {
  const { autorite } = useAutorite();
  const { t, lang } = useI18n();
  const [stats, setStats] = useState<AutoriteStats | null>(null);
  const [recent, setRecent] = useState<AutoriteDeclaration[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatDate = (v?: string | null) => {
    if (!v) return "—";
    try {
      return new Date(v).toLocaleDateString(lang === "ar" ? "ar" : lang === "en" ? "en" : "fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return v;
    }
  };

  useEffect(() => {
    let cancelled = false;
    autoritesService
      .getStats()
      .then((res) => {
        if (!cancelled) setStats(res.data.data);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.response?.data?.message || t("autorite_dashboard_stats_error"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRecentLoading(true);
    autoritesService
      .getDeclarations({ limit: 6 })
      .then((res) => {
        if (!cancelled) setRecent(res.data.data);
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
        <Empty description={error} />
      </Card>
    );
  }

  const cards = [
    { title: t("autorite_dashboard_cards_total"), value: stats?.total ?? 0, icon: <FileProtectOutlined />, color: autoritePalette.primary },
    { title: t("autorite_dashboard_cards_certified"), value: stats?.certified ?? 0, icon: <SafetyCertificateOutlined />, color: autoritePalette.success },
    { title: t("autorite_dashboard_cards_lost"), value: stats?.lost ?? 0, icon: <SearchOutlined />, color: autoritePalette.primaryDark },
    { title: t("autorite_dashboard_cards_by_me"), value: stats?.by_me ?? 0, icon: <RiseOutlined />, color: autoritePalette.greenDark },
  ];

  const certifiedRate = stats && stats.total > 0 ? Math.round((stats.certified / stats.total) * 100) : 0;

  return (
    <div>
      <Card
        style={{ marginBottom: 20, borderRadius: 10, border: `1px solid ${autoritePalette.border}` }}
        styles={{ body: { padding: "20px 24px" } }}
      >
        <Space align="center" size={14} wrap>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: autoritePalette.greenLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserOutlined style={{ fontSize: 22, color: autoritePalette.greenDark }} />
          </div>
          <div>
            <Typography.Title level={4} style={{ margin: 0, color: autoritePalette.greenDark }}>
              {autorite?.prenom} {autorite?.nom}
            </Typography.Title>
            <Space size={8} wrap style={{ marginTop: 4 }}>
              <Tag color={autorite?.niveau === "HAUTE" ? "warning" : "green"} style={{ fontWeight: 500 }}>
                {autorite?.niveau === "HAUTE" ? t("autorite_dashboard_badge_haute") : t("autorite_dashboard_badge_normal")}
              </Tag>
              <Tag icon={<EnvironmentOutlined />} style={{ color: autoritePalette.textMuted }}>
                {autorite?.ville}
                {autorite?.region ? `, ${autorite.region}` : ""}
              </Tag>
            </Space>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {t("autorite_dashboard_rate_label")}
            </Typography.Text>
            <Typography.Title level={3} style={{ margin: 0, color: autoritePalette.primary }}>
              {certifiedRate}%
            </Typography.Title>
          </div>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {cards.map((c) => (
          <Col xs={24} sm={12} md={8} lg={4} key={c.title} style={{ flex: 1 }}>
            <Card
              style={{ borderRadius: 10, border: `1px solid ${autoritePalette.border}` }}
              styles={{ body: { padding: 18 } }}
            >
              <Statistic
                title={
                  <Typography.Text style={{ fontSize: 12, color: autoritePalette.textMuted }}>{c.title}</Typography.Text>
                }
                value={c.value}
                prefix={<span style={{ color: c.color, marginRight: 6 }}>{c.icon}</span>}
                valueStyle={{ color: autoritePalette.greenDark, fontWeight: 600 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Déclarations récentes ── */}
      <div style={{ marginTop: 24 }}>
        <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }} align="center">
          <Space align="center" size={10}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: autoritePalette.primaryLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileProtectOutlined style={{ color: autoritePalette.primaryDark, fontSize: 16 }} />
            </div>
            <div>
              <Typography.Title level={5} style={{ margin: 0, color: autoritePalette.greenDark }}>
                {t("autorite_dashboard_recent_title")}
              </Typography.Title>
              <Typography.Text style={{ fontSize: 12, color: autoritePalette.textMuted }}>
                {t("autorite_dashboard_recent_subtitle")}
              </Typography.Text>
            </div>
            <a
              href="/autorite/declarations"
              style={{ marginLeft: 16, fontSize: 13, fontWeight: 500, color: autoritePalette.primaryDark }}
            >
              {t("autorite_dashboard_recent_view_all")} <ArrowRightOutlined style={{ fontSize: 11 }} />
            </a>
          </Space>
        </Space>

        <Row gutter={[16, 16]}>
          {recentLoading ? (
            <Col span={24}>
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <Spin />
              </div>
            </Col>
          ) : recent.length === 0 ? (
            <Col span={24}>
              <Card style={{ borderRadius: 10, border: `1px solid ${autoritePalette.border}` }}>
                <div style={{ textAlign: "center", padding: "28px 0" }}>
                  <EnvironmentOutlined style={{ fontSize: 34, color: autoritePalette.textMuted }} />
                  <Typography.Text style={{ display: "block", marginTop: 10, color: autoritePalette.textMuted }}>
                    {t("autorite_dashboard_recent_empty")}
                  </Typography.Text>
                </div>
              </Card>
            </Col>
          ) : (
            recent.map((decl) => {
              const isLost = decl.declaration_type === "LOST" || decl.declaration_type === "PERDU";
              const isCertified = !!decl.is_certified;
              return (
                <Col xs={24} sm={12} lg={8} key={decl.id}>
                  <BorderBeam
                    color={isCertified ? "#10B981" : isLost ? "#EF4444" : "#3B82F6"}
                    duration={isCertified ? 5 : 8}
                    lineWidth={1.5}
                    size={200}
                  >
                    <Card
                      style={{ borderRadius: 12, border: 0, height: "100%" }}
                      styles={{ body: { padding: 18 } }}
                    >
                      <Space style={{ width: "100%", gap: 8, marginBottom: 14 }} align="center">
                        <Avatar
                          size={42}
                          shape="square"
                          style={{
                            background: isCertified ? "#ECFDF5" : isLost ? "#FEF2F2" : "#EFF6FF",
                            color: isCertified ? "#10B981" : isLost ? "#EF4444" : "#3B82F6",
                            borderRadius: 10,
                            fontSize: 20,
                            flexShrink: 0,
                          }}
                          icon={<IdcardOutlined />}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                            {isCertified ? (
                              <Tag
                                icon={<SafetyCertificateFilled />}
                                style={{
                                  marginInlineEnd: 0,
                                  background: "#ECFDF5",
                                  borderColor: "#A7F3D0",
                                  color: "#059669",
                                  fontWeight: 600,
                                }}
                              >
                                {t("autorite_status_certified")}
                              </Tag>
                            ) : (
                              <Tag
                                style={{
                                  marginInlineEnd: 0,
                                  background: "#F8F7F4",
                                  borderColor: autoritePalette.border,
                                  color: autoritePalette.textMuted,
                                  fontWeight: 500,
                                }}
                              >
                                {t("autorite_status_not_certified")}
                              </Tag>
                            )}
                            <Tag
                              style={{
                                marginInlineEnd: 0,
                                background: isLost ? "#FEF2F2" : "#EFF6FF",
                                borderColor: isLost ? "#FECACA" : "#BFDBFE",
                                color: isLost ? "#DC2626" : "#2563EB",
                                fontWeight: 600,
                              }}
                            >
                              {isLost ? t("autorite_status_lost") : t("autorite_status_found")}
                            </Tag>
                          </div>
                          <Typography.Text strong style={{ fontSize: 14, color: autoritePalette.textMain, display: "block", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t(docTypeKey(decl.doc_type_nom || decl.doc_type))}
                          </Typography.Text>
                        </div>
                      </Space>

                      <div style={{ marginBottom: 8 }}>
                        <Typography.Text style={{ fontSize: 14, fontWeight: 600, color: autoritePalette.greenDark, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {decl.owner_name || t("autorite_dashboard_declarant_unknown")}
                        </Typography.Text>
                        <Typography.Text style={{ fontSize: 12, color: autoritePalette.textMuted }}>
                          {decl.document_number || "—"}
                        </Typography.Text>
                      </div>

                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                        <Space size={5} align="center">
                          <HomeOutlined style={{ fontSize: 12, color: autoritePalette.textMuted }} />
                          <Typography.Text style={{ fontSize: 12, color: autoritePalette.textMuted }}>
                            {[decl.ville, decl.region].filter(Boolean).join(", ") || t("autorite_dashboard_location_unknown")}
                          </Typography.Text>
                        </Space>
                        <Space size={5} align="center">
                          <SafetyCertificateFilled style={{ fontSize: 12, color: autoritePalette.textMuted }} />
                          <Typography.Text style={{ fontSize: 12, color: autoritePalette.textMuted }}>
                            {formatDate(decl.created_at)}
                          </Typography.Text>
                        </Space>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderTop: `1px solid ${autoritePalette.border}`,
                          paddingTop: 12,
                        }}
                      >
                        <Typography.Text style={{ fontSize: 11, color: isLost && decl.finder_name ? "#3B82F6" : autoritePalette.textMuted }}>
                          {isLost && decl.finder_name
                            ? t("autorite_dashboard_found_by", { name: decl.finder_name })
                            : decl.reporter_nom
                              ? t("autorite_dashboard_reported_by", { name: `${decl.reporter_prenom || ""} ${decl.reporter_nom}`.trim() })
                              : isLost
                                ? t("autorite_dashboard_reported_lost")
                                : t("autorite_dashboard_reported_found")}
                        </Typography.Text>
                        <Typography.Text style={{ fontSize: 11, fontWeight: 600, color: autoritePalette.primaryDark }}>
                          {decl.identifiant_doc_dm || decl.id.slice(0, 8)}
                        </Typography.Text>
                      </div>
                    </Card>
                  </BorderBeam>
                </Col>
              );
            })
          )}
        </Row>
      </div>

      <Card
        style={{ marginTop: 20, borderRadius: 10, border: `1px solid ${autoritePalette.border}` }}
        title={
          <Typography.Text strong style={{ color: autoritePalette.greenDark }}>
            {t("autorite_dashboard_jurisdiction_title")}
          </Typography.Text>
        }
      >
        <Space direction="vertical" size={6}>
          <Typography.Text
            style={{ color: autoritePalette.textMain }}
          >
            <Trans
              i18nKey="autorite_dashboard_jurisdiction_desc"
              values={{
                niveau: autorite?.niveau === "HAUTE" ? t("autorite_dashboard_jurisdiction_niveau_haute") : t("autorite_dashboard_jurisdiction_niveau_normal"),
                ville: autorite?.ville || "",
              }}
            />
          </Typography.Text>
          <Typography.Text type="secondary">
            {autorite?.niveau === "HAUTE"
              ? t("autorite_dashboard_jurisdiction_access_haute")
              : t("autorite_dashboard_jurisdiction_access_normal")}
          </Typography.Text>
        </Space>
      </Card>
    </div>
  );
}
