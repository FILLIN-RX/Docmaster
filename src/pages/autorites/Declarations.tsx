import { useCallback, useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Card,
  Typography,
  Popconfirm,
  message,
  Tooltip,
  Badge,
  Empty,
  Drawer,
  Descriptions,
  Divider,
} from "antd";
import {
  SafetyCertificateOutlined,
  StopOutlined,
  SearchOutlined,
  ReloadOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  FileOutlined,
  UserOutlined,
  PushpinOutlined,
  EditOutlined,
  WalletOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { autoritesService, type AutoriteDeclaration } from "../../services/autoritesService";
import { useAutorite } from "../../context/AutoriteContext";
import { autoritePalette } from "../../theme/autorites";

const TYPE_LABELS: Record<string, string> = { LOST: "Perdu", FOUND: "Trouvé", PERDU: "Perdu", TROUVE: "Trouvé" };
const TYPE_COLORS: Record<string, string> = { LOST: "red", FOUND: "blue", PERDU: "red", TROUVE: "blue" };
const isFoundDecl = (t?: string | null) => t === "FOUND" || t === "TROUVE";

const parseFoundLocation = (raw?: any): string => {
  if (!raw) return "";
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "string" ? parsed : JSON.stringify(parsed);
    } catch {
      return raw;
    }
  }
  return JSON.stringify(raw);
};

const downloadPdf = async (row: AutoriteDeclaration | null) => {
  if (!row) return;
  try {
    const res = await autoritesService.getDeclarationPdf(row.id);
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `declaration_${row.identifiant_doc_dm || row.id.slice(0, 8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch {
    message.error("Impossible de télécharger le PDF");
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return value;
  }
};

export default function Declarations() {
  const { autorite } = useAutorite();
  const isHaute = autorite?.niveau === "HAUTE";

  const [data, setData] = useState<AutoriteDeclaration[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [certFilter, setCertFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [acting, setActing] = useState<string | null>(null);
  const [selected, setSelected] = useState<AutoriteDeclaration | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await autoritesService.getDeclarations({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        search: search || undefined,
        declaration_type: typeFilter,
        is_certified: certFilter === undefined ? undefined : certFilter === "true",
      });
      setData(res.data.data);
      setTotal(res.data.count);
    } catch {
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, typeFilter, certFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCertify = async (id: string) => {
    setActing(id);
    try {
      await autoritesService.certify(id);
      message.success("Déclaration certifiée");
      fetchData();
      setSelected((prev) => (prev && prev.id === id ? { ...prev, is_certified: true } : prev));
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Certification impossible");
    } finally {
      setActing(null);
    }
  };

  const handleUncertify = async (id: string) => {
    setActing(id);
    try {
      await autoritesService.uncertify(id);
      message.success("Certification retirée");
      fetchData();
      setSelected((prev) => (prev && prev.id === id ? { ...prev, is_certified: false } : prev));
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Impossible de retirer la certification");
    } finally {
      setActing(null);
    }
  };

  const openDetail = (row: AutoriteDeclaration) => {
    setSelected(row);
  };

  const columns: ColumnsType<AutoriteDeclaration> = [
    {
      title: "Référence",
      dataIndex: "identifiant_doc_dm",
      width: 130,
      render: (v: string, row) => (
        <Typography.Text strong style={{ color: autoritePalette.greenDark }}>
          {v || row.id.slice(0, 8).toUpperCase()}
        </Typography.Text>
      ),
    },
    {
      title: "Type de document",
      dataIndex: "doc_type_nom",
      width: 170,
      render: (v: string, row) => (
        <Typography.Text style={{ color: autoritePalette.textMain }}>{v || row.doc_type || "—"}</Typography.Text>
      ),
    },
    {
      title: "Propriétaire",
      dataIndex: "owner_name",
      width: 170,
      render: (v: string) => <Typography.Text style={{ color: autoritePalette.textMain }}>{v}</Typography.Text>,
    },
    {
      title: "Trouvé par",
      dataIndex: "finder_name",
      width: 160,
      render: (_: string, row: AutoriteDeclaration) => {
        const name = isFoundDecl(row.declaration_type)
          ? [row.reporter_prenom, row.reporter_nom].filter(Boolean).join(" ")
          : row.finder_name;
        return name ? (
          <Typography.Text style={{ color: autoritePalette.primary }}>{name}</Typography.Text>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        );
      },
    },
    {
      title: "N° document",
      dataIndex: "document_number",
      width: 140,
      render: (v?: string | null) => v || "—",
    },
    {
      title: "Type",
      dataIndex: "declaration_type",
      width: 100,
      render: (v: string) => <Tag color={TYPE_COLORS[v] || "default"}>{TYPE_LABELS[v] || v}</Tag>,
    },
    {
      title: "Ville",
      dataIndex: "ville",
      width: 120,
      render: (v?: string | null) => v || "—",
    },
    {
      title: "Date",
      dataIndex: "created_at",
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: "Statut",
      key: "certification",
      width: 140,
      render: (_, row) =>
        row.is_certified ? (
          <Tooltip title={`Certifiée par ${row.certified_by_prenom || ""} ${row.certified_by_nom || "une autorité"}`}>
            <Badge status="success" text="Certifiée" />
          </Tooltip>
        ) : (
          <Badge status="default" text="Non certifiée" />
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      fixed: "right",
      render: (_, row) => (
        <Space>
          {row.is_certified ? (
            isHaute ? (
              <Popconfirm
                title="Retirer la certification ?"
                description="La déclaration redeviendra non certifiée."
                onConfirm={() => handleUncertify(row.id)}
                okText="Retirer"
                okButtonProps={{ danger: true }}
                cancelText="Annuler"
              >
                <Button
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  loading={acting === row.id}
                  disabled={acting !== null}
                >
                  Décertifier
                </Button>
              </Popconfirm>
            ) : (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Réservé aux autorités hautes
              </Typography.Text>
            )
          ) : (
            <Popconfirm
              title="Certifier cette déclaration ?"
              description="Vous confirmez l'authenticité de cette déclaration."
              onConfirm={() => handleCertify(row.id)}
              okText="Certifier"
              cancelText="Annuler"
            >
              <Button
                size="small"
                type="primary"
                icon={<SafetyCertificateOutlined />}
                loading={acting === row.id}
                disabled={acting !== null}
              >
                Certifier
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        style={{ marginBottom: 16, borderRadius: 10, border: `1px solid ${autoritePalette.border}` }}
        styles={{ body: { padding: "16px 20px" } }}
      >
        <Space wrap size={12}>
          <Input
            allowClear
            placeholder="Rechercher (nom, n° document, référence)"
            prefix={<SearchOutlined style={{ color: autoritePalette.textMuted }} />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: 280 }}
          />
          <Select
            allowClear
            placeholder="Type"
            value={typeFilter}
            onChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}
            style={{ width: 130 }}
            options={[
              { value: "LOST", label: "Perdu" },
              { value: "FOUND", label: "Trouvé" },
            ]}
          />
          <Select
            allowClear
            placeholder="Certification"
            value={certFilter}
            onChange={(v) => {
              setCertFilter(v);
              setPage(1);
            }}
            style={{ width: 160 }}
            options={[
              { value: "true", label: "Certifiées" },
              { value: "false", label: "Non certifiées" },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Actualiser
          </Button>
        </Space>
        <div style={{ marginTop: 10 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {isHaute
              ? "Accès à l'ensemble des déclarations du territoire."
              : `Déclarations de votre ville (${autorite?.ville || "—"}).`}{" "}
            {total} résultat{total > 1 ? "s" : ""}.
          </Typography.Text>
        </div>
      </Card>

      <Card style={{ borderRadius: 10, border: `1px solid ${autoritePalette.border}` }} styles={{ body: { padding: 12 } }}>
        <Table<AutoriteDeclaration>
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 1200 }}
          onRow={(row) => ({
            onClick: () => openDetail(row),
            style: { cursor: "pointer" },
          })}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showTotal: (t) => `${t} déclaration(s)`,
          }}
          locale={{
            emptyText: <Empty description="Aucune déclaration trouvée" />,
          }}
        />
      </Card>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        width={560}
        title={
          <Space>
            <FileOutlined style={{ color: autoritePalette.primary }} />
            <span>Détails de la déclaration</span>
            <Tag color={selected?.is_certified ? "success" : "default"} style={{ fontWeight: 500 }}>
              {selected?.is_certified ? "Certifiée" : "Non certifiée"}
            </Tag>
            <Button
              size="small"
              type="link"
              icon={<DownloadOutlined />}
              onClick={() => { void downloadPdf(selected); }}
              style={{ fontSize: 12 }}
            >
              Version PDF
            </Button>
          </Space>
        }
      >
        {selected && <DetailContent row={selected} isHaute={isHaute} acting={acting === selected.id} onCertify={() => handleCertify(selected.id)} onUncertify={() => handleUncertify(selected.id)} />}
      </Drawer>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0" }}>
      <span style={{ color: autoritePalette.primary, marginTop: 2, minWidth: 16, textAlign: "center" }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <Typography.Text type="secondary" style={{ fontSize: 11, display: "block", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {label}
        </Typography.Text>
        {value !== undefined && value !== null && String(value) !== "" ? (
          <Typography.Text style={{ fontSize: 13, color: autoritePalette.textMain }}>{value}</Typography.Text>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            —
          </Typography.Text>
        )}
      </div>
    </div>
  );
}

function DetailContent({
  row,
  isHaute,
  acting,
  onCertify,
  onUncertify,
}: {
  row: AutoriteDeclaration;
  isHaute: boolean;
  acting: boolean;
  onCertify: () => void;
  onUncertify: () => void;
}) {
  const foundLoc = parseFoundLocation(row.found_location);

  return (
    <div>
      <div
        style={{
          background: `linear-gradient(135deg, ${autoritePalette.greenDark}, ${autoritePalette.greenMid})`,
          borderRadius: 10,
          padding: 18,
          color: "#fff",
          marginBottom: 16,
        }}
      >
        <Space align="center" style={{ width: "100%", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <Typography.Title level={4} style={{ color: "#fff", margin: 0 }}>
              {row.identifiant_doc_dm || row.id.slice(0, 8).toUpperCase()}
            </Typography.Title>
            <Typography.Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
              {row.doc_type_nom || row.doc_type || "Document"}
            </Typography.Text>
          </div>
          <Tag color={TYPE_COLORS[row.declaration_type] || "default"} style={{ fontWeight: 600, margin: 0 }}>
            {TYPE_LABELS[row.declaration_type] || row.declaration_type}
          </Tag>
        </Space>

        <Space style={{ marginTop: 8, width: "100%", justifyContent: "space-between" }} wrap>
          <Space size={8}>
            <UserOutlined />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{row.owner_name}</span>
          </Space>
          {row.is_certified && (
            <Badge
              status="success"
              text={
                <span style={{ color: "#fff", fontSize: 12 }}>
                  Certifiée par {row.certified_by_prenom || ""} {row.certified_by_nom || ""}
                  {row.certified_at ? ` · ${new Date(row.certified_at).toLocaleDateString("fr-FR")}` : ""}
                </span>
              }
            />
          )}
        </Space>
        {(() => {
          const foundName = isFoundDecl(row.declaration_type)
            ? [row.reporter_prenom, row.reporter_nom].filter(Boolean).join(" ")
            : row.finder_name;
          return foundName ? (
            <Space size={8} style={{ marginTop: 10 }}>
              <SearchOutlined style={{ color: "rgba(255,255,255,0.75)" }} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.9)" }}>
                Trouvé par <strong>{foundName}</strong>
              </span>
            </Space>
          ) : null;
        })()}
      </div>

      <Descriptions column={1} size="small" colon={false}>
        <Descriptions.Item label={<Space size={6}><IdcardOutlined /> N° document</Space>}>
          {row.document_number || "—"}
        </Descriptions.Item>
        <Descriptions.Item label={<Space size={6}><FileOutlined /> Type</Space>}>
          {row.doc_type_nom || row.doc_type || "—"}
        </Descriptions.Item>
        <Descriptions.Item label={<Space size={6}><EnvironmentOutlined /> Localisation</Space>}>
          {[row.quartier, row.ville, row.region, row.pays].filter(Boolean).join(", ") || "—"}
        </Descriptions.Item>
        <Descriptions.Item label={<Space size={6}><PushpinOutlined /> Lieu trouvé</Space>}>
          {foundLoc || "—"}
        </Descriptions.Item>
        <Descriptions.Item label={<Space size={6}><CalendarOutlined /> Date perte</Space>}>
          {row.date_perte ? new Date(row.date_perte).toLocaleDateString("fr-FR") : "—"}
        </Descriptions.Item>
        <Descriptions.Item label={<Space size={6}><CalendarOutlined /> Date expiration</Space>}>
          {row.date_expiration ? new Date(row.date_expiration).toLocaleDateString("fr-FR") : "—"}
        </Descriptions.Item>
        <Descriptions.Item label={<Space size={6}><CalendarOutlined /> Enregistrée le</Space>}>
          {new Date(row.created_at).toLocaleString("fr-FR")}
        </Descriptions.Item>
        <Descriptions.Item label={<Space size={6}><EditOutlined /> État physique</Space>}>
          {row.etat_physique || "—"}
        </Descriptions.Item>
        <Descriptions.Item label={<Space size={6}><WalletOutlined /> Récompense</Space>}>
          {row.recompense_montant != null ? `${Number(row.recompense_montant).toLocaleString("fr-FR")} XAF` : "—"}
        </Descriptions.Item>
      </Descriptions>

      {row.description && (
        <>
          <Divider style={{ margin: "12px 0" }} />
          <Typography.Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Description
          </Typography.Text>
          <Typography.Paragraph style={{ marginTop: 6, fontSize: 13, marginBottom: 0 }}>
            {row.description}
          </Typography.Paragraph>
        </>
      )}

      <Divider style={{ margin: "12px 0" }} />
      <Typography.Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Contact du déclarant
      </Typography.Text>
      <div style={{ marginTop: 8 }}>
        <DetailRow icon={<PhoneOutlined />} label="Téléphone" value={row.telephone_contact} />
        <DetailRow icon={<MailOutlined />} label="Email" value={row.email_contact} />
        <DetailRow icon={<EnvironmentOutlined />} label="Mode de contact" value={row.mode_contact} />
      </div>

      <Divider style={{ margin: "16px 0" }} />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        {row.is_certified ? (
          isHaute ? (
            <Popconfirm
              title="Retirer la certification ?"
              onConfirm={onUncertify}
              okText="Retirer"
              okButtonProps={{ danger: true }}
              cancelText="Annuler"
            >
              <Button danger icon={<StopOutlined />} loading={acting}>
                Décertifier
              </Button>
            </Popconfirm>
          ) : (
            <Typography.Text type="secondary">
              Réservé aux autorités hautes
            </Typography.Text>
          )
        ) : (
          <Popconfirm
            title="Certifier cette déclaration ?"
            description="Vous confirmez l'authenticité de cette déclaration."
            onConfirm={onCertify}
            okText="Certifier"
            cancelText="Annuler"
          >
            <Button type="primary" icon={<SafetyCertificateOutlined />} loading={acting} size="large">
              Certifier cette déclaration
            </Button>
          </Popconfirm>
        )}
      </div>
    </div>
  );
}
