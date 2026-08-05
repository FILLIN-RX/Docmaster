import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Popconfirm,
  Row,
  Select,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  FileProtectOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { partenairesService, type PartenaireDeclaration } from "../../services/partenairesService";
import { partenairePalette } from "../../theme/partenaires";

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

const formatDate = (v?: string | null) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return v;
  }
};

export default function Declarations() {
  const navigate = useNavigate();
  const [data, setData] = useState<PartenaireDeclaration[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await partenairesService.getDeclarations({
        page,
        limit: pageSize,
        q: search || undefined,
        status: statusFilter,
      });
      setData(res.data.rows);
      setTotal(res.data.total);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onDelete = async (id: string) => {
    try {
      await partenairesService.deleteDeclaration(id);
      fetchData();
    } catch (err: any) {
      // noop
    }
  };

  const columns = [
    {
      title: "Référence",
      dataIndex: "identifiant_doc_dm",
      key: "identifiant_doc_dm",
      width: 130,
      render: (v: string | null, row: PartenaireDeclaration) => (
        <Typography.Text strong style={{ color: partenairePalette.primaryDark }}>
          {v || row.id.slice(0, 8)}
        </Typography.Text>
      ),
    },
    {
      title: "Type de document",
      key: "doc_type",
      width: 190,
      render: (_: any, row: PartenaireDeclaration) => (
        <Typography.Text>{row.doc_type_name || row.doc_type || "—"}</Typography.Text>
      ),
    },
    {
      title: "Propriétaire",
      dataIndex: "owner_name",
      key: "owner_name",
      width: 180,
      render: (v: string) => <Typography.Text strong>{v || "—"}</Typography.Text>,
    },
    {
      title: "N° document",
      dataIndex: "document_number",
      key: "document_number",
      width: 150,
      render: (v?: string | null) => v || "—",
    },
    {
      title: "Localisation",
      key: "ville",
      width: 160,
      render: (_: any, row: PartenaireDeclaration) => [row.ville, row.quartier].filter(Boolean).join(", ") || "—",
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: statusTag,
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: formatDate,
    },
    {
      title: "",
      key: "actions",
      width: 60,
      render: (_: any, row: PartenaireDeclaration) => (
        <Popconfirm
          title="Supprimer cette déclaration ?"
          description="Cette action est irréversible."
          okText="Supprimer"
          okButtonProps={{ danger: true }}
          cancelText="Annuler"
          onConfirm={() => onDelete(row.id)}
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Card
        style={{ marginBottom: 16, borderRadius: 10, border: `1px solid ${partenairePalette.border}` }}
        styles={{ body: { padding: 16 } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={8}>
            <Input
              prefix={<SearchOutlined style={{ color: partenairePalette.textMuted }} />}
              placeholder="Rechercher (propriétaire, n° document, référence)"
              allowClear
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </Col>
          <Col xs={24} md={5}>
            <Select
              style={{ width: "100%" }}
              placeholder="Filtrer par statut"
              allowClear
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              options={[
                { value: "AVAILABLE", label: "Disponible" },
                { value: "MATCHED", label: "Correspondance" },
                { value: "RETURNED", label: "Rendu" },
              ]}
            />
          </Col>
          <Col xs={24} md={5}>
            <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
              Actualiser
            </Button>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: "right" }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate("/partenaire/declarer")}>
              Déclarer une trouvaille
            </Button>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 10, border: `1px solid ${partenairePalette.border}` }} styles={{ body: { padding: 0 } }}>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          scroll={{ x: 1100 }}
          locale={{ emptyText: <Empty description="Aucune déclaration" /> }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (t) => `${t} déclaration(s)`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>
    </div>
  );
}