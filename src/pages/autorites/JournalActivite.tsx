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
import { useI18n } from "../../context/I18nContext";
import { autoritePalette } from "../../theme/autorites";
import { useAutorite } from "../../context/AutoriteContext";

const { Title, Text } = Typography;

const ACTION_META: Record<string, { labelKey: string; color: string; icon: React.ReactNode }> = {
  CERTIFY_DECLARATION: {
    labelKey: "autorite_journal_action_certify",
    color: "green",
    icon: <SafetyCertificateOutlined />,
  },
  UNCERTIFY_DECLARATION: {
    labelKey: "autorite_journal_action_uncertify",
    color: "red",
    icon: <StopOutlined />,
  },
  CREATE_AUTORITE: {
    labelKey: "autorite_journal_action_create",
    color: "orange",
    icon: <UserAddOutlined />,
  },
  DELETE_AUTORITE: {
    labelKey: "autorite_journal_action_delete",
    color: "volcano",
    icon: <DeleteOutlined />,
  },
  AUTHORITY_LOGIN: {
    labelKey: "autorite_journal_action_login",
    color: "blue",
    icon: <LoginOutlined />,
  },
};

export default function JournalActivite() {
  const { autorite } = useAutorite();
  const { t, lang } = useI18n();
  const [logs, setLogs] = useState<AutoriteActivityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [actionFilter, setActionFilter] = useState<string>("");

  const isHaute = autorite?.niveau === "HAUTE";
  const localeTag = lang === "ar" ? "ar" : lang === "en" ? "en" : "fr-FR";

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
        message.error(err?.response?.data?.message || t("autorite_journal_load_error"));
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const zoneLabel = isHaute
    ? autorite?.region
      ? t("autorite_journal_zone_region", { region: autorite.region })
      : autorite?.ville
        ? t("autorite_journal_zone_ville", { ville: autorite.ville })
        : t("autorite_journal_zone_national")
    : t("autorite_journal_zone_ville", { ville: autorite?.ville || "—" });

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
      title: t("autorite_journal_col_date"),
      dataIndex: "created_at",
      width: 150,
      render: (v: string) => (
        <div>
          <Text style={{ fontSize: 12, color: autoritePalette.textMain, display: "block" }}>
            {new Date(v).toLocaleDateString(localeTag)}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {new Date(v).toLocaleTimeString(localeTag, { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </div>
      ),
    },
    {
      title: t("autorite_journal_col_autorite"),
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
      title: t("autorite_journal_col_action"),
      key: "action",
      render: (_: unknown, log: AutoriteActivityLog) => {
        const meta = ACTION_META[log.action_type];
        return meta ? (
          <Space>
            <Tag icon={meta.icon} color={meta.color} style={{ fontWeight: 600 }}>
              {t(meta.labelKey)}
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
            {t("autorite_journal_title")}
          </Title>
          <Space size={8} style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t("autorite_journal_subtitle")}
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
            placeholder={t("autorite_journal_all_actions")}
            style={{ width: 200 }}
            options={Object.entries(ACTION_META).map(([value, meta]) => ({
              value,
              label: t(meta.labelKey),
            }))}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchLogs}>
            {t("autorite_journal_refresh")}
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
            showTotal: (tCount) => t("autorite_journal_total", { count: tCount }),
          }}
          locale={{
            emptyText: (
              <Empty
                description={t("autorite_journal_empty")}
                style={{ fontSize: 13 }}
              />
            ),
          }}
        />
      </Card>
    </div>
  );
}
