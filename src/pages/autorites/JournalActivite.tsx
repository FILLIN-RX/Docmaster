import { useCallback, useEffect, useState } from "react";
import {
  Card,
  Typography,
  Table,
  Tag,
  Badge,
  Empty,
  Space,
  Avatar,
  Select,
  Button,
  message,
} from "antd";
import {
  SafetyCertificateOutlined,
  StopOutlined,
  UserAddOutlined,
  DeleteOutlined,
  LoginOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  autoritesService,
  AutoriteActivityLog,
} from "../../services/autoritesService";
import { autoritePalette } from "../../theme/autorites";
import { useAutorite } from "../../context/AutoriteContext";

const { Title, Text } = Typography;

const ACTION_META: Record<string, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  CERTIFY_DECLARATION: {
    label: "Certification",
    color: "green",
    icon: <SafetyCertificateOutlined />,
    desc: "a certifié une déclaration",
  },
  UNCERTIFY_DECLARATION: {
    label: "Décertification",
    color: "red",
    icon: <StopOutlined />,
    desc: "a retiré une certification",
  },
  CREATE_AUTORITE: {
    label: "Création autorité",
    color: "orange",
    icon: <UserAddOutlined />,
    desc: "a créé une autorité",
  },
  DELETE_AUTORITE: {
    label: "Suppression autorité",
    color: "volcano",
    icon: <DeleteOutlined />,
    desc: "a supprimé une autorité",
  },
  AUTHORITY_LOGIN: {
    label: "Connexion",
    color: "blue",
    icon: <LoginOutlined />,
    desc: "s'est connecté",
  },
};

export default function JournalActivite() {
  const { autorite } = useAutorite();
  const [logs, setLogs] = useState<AutoriteActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [actionFilter, setActionFilter] = useState<string>("");

  const isHaute = autorite?.niveau === "HAUTE";

  const fetchLogs = useCallback(() => {
    setLoading(true);
    autoritesService
      .getActivityLogs({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        action_type: actionFilter || undefined,
      })
      .then((res) => {
        setLogs(res.data.data || []);
        setTotal(res.data.total || 0);
      })
      .catch((err) => {
        message.error(err?.response?.data?.message || "Impossible de charger le journal");
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const zoneLabel = isHaute
    ? autorite?.region
      ? `Région : ${autorite.region}`
      : autorite?.ville
        ? `Ville : ${autorite.ville}`
        : "Territoire national"
    : `Ville : ${autorite?.ville || "—"}`;

  const levelBadge = (n: string | null) =>
    n === "HAUTE" ? (
      <Tag color="orange" style={{ fontSize: 10, fontWeight: 600, margin: 0 }}>
        HAUTE
      </Tag>
    ) : n === "NORMAL" ? (
      <Tag color="green" style={{ fontSize: 10, fontWeight: 600, margin: 0 }}>
        NIVEAU
      </Tag>
    ) : null;

  const columns = [
    {
      title: "Date",
      dataIndex: "created_at",
      width: 150,
      render: (v: string) => (
        <div>
          <Text style={{ fontSize: 12, color: autoritePalette.textMain, display: "block" }}>
            {new Date(v).toLocaleDateString("fr-FR")}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {new Date(v).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </div>
      ),
    },
    {
      title: "Autorité",
      key: "autorite",
      width: 220,
      render: (_: unknown, log: AutoriteActivityLog) => (
        <Space>
          <Avatar
            size={30}
            style={{ background: autoritePalette.greenDark, fontWeight: 600, fontSize: 11, flexShrink: 0 }}
          >
            {`${(log.autorite_prenom || "").charAt(0)}${(log.autorite_nom || "").charAt(0)}`.toUpperCase()}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: 12.5, color: autoritePalette.textMain, display: "block" }}>
              {log.autorite_prenom} {log.autorite_nom}
            </Text>
            <Space size={6} wrap>
              {levelBadge(log.autorite_niveau)}
              {log.autorite_ville && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {log.autorite_ville}
                </Text>
              )}
            </Space>
          </div>
        </Space>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: unknown, log: AutoriteActivityLog) => {
        const meta = ACTION_META[log.action_type];
        return meta ? (
          <Space>
            <Tag icon={meta.icon} color={meta.color} style={{ fontWeight: 600 }}>
              {meta.label}
            </Tag>
            <Text style={{ fontSize: 12, color: autoritePalette.textMuted }}>{log.description}</Text>
          </Space>
        ) : (
          <Text style={{ fontSize: 12 }}>{log.description || log.action_type}</Text>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
        <div>
          <Title level={4} style={{ margin: 0, color: autoritePalette.greenDark }}>
            Journal d'activité
          </Title>
          <Space size={8} style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Activité des autorités de votre secteur.
            </Text>
            <Badge
              status={isHaute ? "warning" : "success"}
              text={<Text style={{ fontSize: 12, color: autoritePalette.textMuted }}>{zoneLabel}</Text>}
            />
          </Space>
        </div>
        <Space>
          <Select
            value={actionFilter || undefined}
            onChange={setActionFilter}
            allowClear
            placeholder="Toutes les actions"
            style={{ width: 200 }}
            options={Object.entries(ACTION_META).map(([value, meta]) => ({
              value,
              label: meta.label,
            }))}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchLogs}>
            Actualiser
          </Button>
        </Space>
      </div>

      <Card
        style={{ borderRadius: 10, border: `1px solid ${autoritePalette.border}` }}
        styles={{ body: { padding: 12 } }}
      >
        <Table<AutoriteActivityLog>
          rowKey="id"
          columns={columns}
          dataSource={logs}
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [20, 50, 100],
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showTotal: (t) => `${t} action(s)`,
          }}
          locale={{
            emptyText: (
              <Empty
                description="Aucune activité dans votre secteur pour le moment"
                style={{ fontSize: 13 }}
              />
            ),
          }}
        />
      </Card>
    </div>
  );
}