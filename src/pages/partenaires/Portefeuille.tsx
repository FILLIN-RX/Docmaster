import { useCallback, useEffect, useState } from "react";
import { Card, Col, Row, Space, Spin, Statistic, Table, Tag, Typography } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined, WalletOutlined } from "@ant-design/icons";
import { partenairesService, type PartenaireWalletTransaction } from "../../services/partenairesService";
import { useI18n } from "../../context/I18nContext";
import { partenairePalette } from "../../theme/partenaires";

const REASON_LABEL_KEYS: Record<string, string> = {
  ADMIN_ADJUSTMENT: "partenaire_portefeuille_reason_admin",
  DECLARATION_REWARD: "partenaire_portefeuille_reason_reward",
  CLAIM_FEE: "partenaire_portefeuille_reason_claim",
  OTHER: "partenaire_portefeuille_reason_other",
};

export default function Portefeuille() {
  const { t, lang } = useI18n();
  const localeTag = lang === "ar" ? "ar" : lang === "en" ? "en" : "fr-FR";
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<PartenaireWalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (v?: string | null) => {
    if (!v) return "—";
    try {
      return new Date(v).toLocaleDateString(localeTag, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return v;
    }
  };

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      const res = await partenairesService.getWallet({ limit: 100 });
      setBalance(res.data.data.balance);
      setHistory(res.data.data.history);
    } catch {
      setBalance(0);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const columns = [
    {
      title: t("partenaire_portefeuille_col_date"),
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: formatDate,
    },
    {
      title: t("partenaire_portefeuille_col_type"),
      dataIndex: "type",
      key: "type",
      width: 110,
      render: (typeVal: string) =>
        typeVal === "CREDIT" ? (
          <Tag icon={<ArrowUpOutlined />} color="green">
            {t("partenaire_portefeuille_credit")}
          </Tag>
        ) : (
          <Tag icon={<ArrowDownOutlined />} color="red">
            {t("partenaire_portefeuille_debit")}
          </Tag>
        ),
    },
    {
      title: t("partenaire_portefeuille_col_amount"),
      dataIndex: "amount",
      key: "amount",
      width: 140,
      render: (v: string, row: PartenaireWalletTransaction) => (
        <Typography.Text
          strong
          style={{ color: row.type === "CREDIT" ? partenairePalette.success : partenairePalette.danger }}
        >
          {row.type === "CREDIT" ? "+" : "−"} {Number(v).toLocaleString(localeTag)} FCFA
        </Typography.Text>
      ),
    },
    {
      title: t("partenaire_portefeuille_col_reason"),
      key: "reason",
      render: (_: any, row: PartenaireWalletTransaction) => {
        const motif = (row.metadata as any)?.motif;
        const reasonKey = REASON_LABEL_KEYS[row.reason];
        return <Typography.Text>{motif || (reasonKey ? t(reasonKey) : row.reason)}</Typography.Text>;
      },
    },
    {
      title: t("partenaire_portefeuille_col_balance"),
      dataIndex: "balance_after",
      key: "balance_after",
      width: 140,
      render: (v: string) => `${Number(v).toLocaleString(localeTag)} FCFA`,
    },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Card
        style={{ marginBottom: 20, borderRadius: 10, border: `1px solid ${partenairePalette.border}`, background: `linear-gradient(135deg, ${partenairePalette.greenDark} 0%, ${partenairePalette.greenMid} 100%)` }}
        styles={{ body: { padding: "24px 28px" } }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={14}>
            <Space size={14} align="center">
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <WalletOutlined style={{ fontSize: 24, color: "#FFFFFF" }} />
              </div>
              <div>
                <Typography.Text style={{ color: "rgba(255,255,255,0.75)", display: "block", fontSize: 12 }}>
                  {t("partenaire_portefeuille_balance_label")}
                </Typography.Text>
                <Typography.Title level={2} style={{ margin: 0, color: "#FFFFFF", fontWeight: 700 }}>
                  {balance.toLocaleString(localeTag)} FCFA
                </Typography.Title>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={10}>
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.75)" }}>{t("partenaire_portefeuille_operations")}</span>}
              value={history.length}
              valueStyle={{ color: "#FFFFFF" }}
            />
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Typography.Text strong style={{ color: partenairePalette.greenDark }}>
            {t("partenaire_portefeuille_history_title")}
          </Typography.Text>
        }
        style={{ borderRadius: 10, border: `1px solid ${partenairePalette.border}` }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          rowKey="id"
          dataSource={history}
          columns={columns}
          scroll={{ x: 760 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (tt) => `${tt === 1 ? t("partenaire_portefeuille_total", { count: tt }) : t("partenaire_portefeuille_total_other", { count: tt })}`,
          }}
          locale={{ emptyText: t("partenaire_portefeuille_empty") }}
        />
      </Card>
    </div>
  );
}
