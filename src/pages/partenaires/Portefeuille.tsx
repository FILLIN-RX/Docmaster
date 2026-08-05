import { useCallback, useEffect, useState } from "react";
import { Card, Col, Row, Space, Spin, Statistic, Table, Tag, Typography } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined, WalletOutlined } from "@ant-design/icons";
import { partenairesService, type PartenaireWalletTransaction } from "../../services/partenairesService";
import { partenairePalette } from "../../theme/partenaires";

const formatDate = (v?: string | null) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return v;
  }
};

const REASON_LABELS: Record<string, string> = {
  ADMIN_ADJUSTMENT: "Ajustement administrateur",
  DECLARATION_REWARD: "Récompense de trouvaille",
  CLAIM_FEE: "Frais de réclamation",
  OTHER: "Autre",
};

export default function Portefeuille() {
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<PartenaireWalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

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
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: formatDate,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 110,
      render: (t: string) =>
        t === "CREDIT" ? (
          <Tag icon={<ArrowUpOutlined />} color="green">
            Crédit
          </Tag>
        ) : (
          <Tag icon={<ArrowDownOutlined />} color="red">
            Débit
          </Tag>
        ),
    },
    {
      title: "Montant",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      render: (v: string, row: PartenaireWalletTransaction) => (
        <Typography.Text
          strong
          style={{ color: row.type === "CREDIT" ? partenairePalette.success : partenairePalette.danger }}
        >
          {row.type === "CREDIT" ? "+" : "−"} {Number(v).toLocaleString("fr-FR")} FCFA
        </Typography.Text>
      ),
    },
    {
      title: "Motif",
      key: "reason",
      render: (_: any, row: PartenaireWalletTransaction) => {
        const motif = (row.metadata as any)?.motif;
        return <Typography.Text>{motif || REASON_LABELS[row.reason] || row.reason}</Typography.Text>;
      },
    },
    {
      title: "Solde après",
      dataIndex: "balance_after",
      key: "balance_after",
      width: 140,
      render: (v: string) => `${Number(v).toLocaleString("fr-FR")} FCFA`,
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
                  Solde actuel du portefeuille
                </Typography.Text>
                <Typography.Title level={2} style={{ margin: 0, color: "#FFFFFF", fontWeight: 700 }}>
                  {balance.toLocaleString("fr-FR")} FCFA
                </Typography.Title>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={10}>
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.75)" }}>Opérations</span>}
              value={history.length}
              valueStyle={{ color: "#FFFFFF" }}
            />
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Typography.Text strong style={{ color: partenairePalette.greenDark }}>
            Historique des opérations
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
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50], showTotal: (t) => `${t} opération(s)` }}
          locale={{ emptyText: "Aucune opération pour le moment" }}
        />
      </Card>
    </div>
  );
}