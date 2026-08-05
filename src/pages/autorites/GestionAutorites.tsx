import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Typography,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Tag,
  Empty,
  Badge,
  Popconfirm,
  Divider,
  message,
} from "antd";
import { UserAddOutlined, ReloadOutlined, DeleteOutlined, KeyOutlined } from "@ant-design/icons";
import { autoritesService, AutoriteSession } from "../../services/autoritesService";
import { autoritePalette } from "../../theme/autorites";

const { Title, Text } = Typography;

export default function GestionAutorites() {
  const [autorites, setAutorites] = useState<AutoriteSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAutorites = () => {
    setLoading(true);
    autoritesService
      .getManagedAutorites()
      .then((res) => setAutorites(res.data.data || []))
      .catch(() => setAutorites([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAutorites();
  }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const res = await autoritesService.createByHaute(values);
      setTempPassword(res.data.data?.temp_password || null);
      setModalOpen(false);
      form.resetFields();
      fetchAutorites();
      message.success("Autorité créée avec succès");
    } catch (err: any) {
      if (err?.response?.data?.message) {
        message.error(err.response.data.message);
      } else if (err?.response?.data?.errors) {
        const first = Object.values(err.response.data.errors)[0] as string[];
        message.error(first?.[0] || "Création impossible");
      }
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: "Autorité",
      key: "autorite",
      render: (_: unknown, a: AutoriteSession) => (
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: autoritePalette.greenDark,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 12,
              flexShrink: 0,
            }}
          >
            {`${(a.prenom || "").charAt(0)}${(a.nom || "").charAt(0)}`.toUpperCase()}
          </div>
          <div>
            <Text strong style={{ fontSize: 13, color: autoritePalette.textMain }}>
              {a.prenom} {a.nom}
            </Text>
            <div style={{ fontSize: 11, color: autoritePalette.textMuted }}>{a.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Ville",
      dataIndex: "ville",
      width: 160,
      render: (v: string, a: AutoriteSession) => (
        <Text style={{ fontSize: 12, color: autoritePalette.textMain }}>
          {v}
          {a.region ? `, ${a.region}` : ""}
        </Text>
      ),
    },
    {
      title: "Niveau",
      dataIndex: "niveau",
      width: 120,
      render: (v: string) => (
        <Tag color={v === "HAUTE" ? "orange" : "green"} style={{ fontWeight: 600 }}>
          {v === "HAUTE" ? "Haute" : "Niveau"}
        </Tag>
      ),
    },
    {
      title: "Statut",
      dataIndex: "is_active",
      width: 110,
      render: (v: boolean) =>
        v ? (
          <Badge status="success" text={<Text style={{ fontSize: 12 }}>Actif</Text>} />
        ) : (
          <Badge status="default" text={<Text style={{ fontSize: 12 }}>Inactif</Text>} />
        ),
    },
    {
      title: "Mot de passe",
      dataIndex: "must_change_password",
      width: 170,
      render: (v: boolean) =>
        v ? (
          <Tag icon={<KeyOutlined />} color="warning" style={{ fontSize: 11 }}>
            À changer
          </Tag>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Défini
          </Text>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 90,
      align: "right" as const,
      render: (_: unknown, a: AutoriteSession) => (
        <Popconfirm
          title="Supprimer cette autorité ?"
          description="Cette action est irréversible."
          onConfirm={() => handleDelete(a.id)}
          okText="Supprimer"
          okButtonProps={{ danger: true }}
          cancelText="Annuler"
        >
          <Button
            danger
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            loading={deletingId === a.id}
          />
        </Popconfirm>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await autoritesService.deleteManaged(id);
      message.success("Autorité supprimée");
      fetchAutorites();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Suppression impossible");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: autoritePalette.greenDark }}>
            Gestion des autorités
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Créez et gérez les autorités de niveau relevant de votre territoire.
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchAutorites}>
            Actualiser
          </Button>
          <Button type="primary" icon={<UserAddOutlined />} onClick={() => setModalOpen(true)} style={{ background: autoritePalette.primary, borderColor: autoritePalette.primary }}>
            Créer une autorité
          </Button>
        </Space>
      </div>

      <Card
        style={{ borderRadius: 10, border: `1px solid ${autoritePalette.border}` }}
        styles={{ body: { padding: 12 } }}
      >
        <Table<AutoriteSession>
          rowKey="id"
          columns={columns}
          dataSource={autorites}
          loading={loading}
          pagination={false}
          locale={{
            emptyText: <Empty description="Aucune autorité créée pour le moment" />,
          }}
        />
      </Card>

      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        title={
          <Space>
            <UserAddOutlined style={{ color: autoritePalette.primary }} />
            Créer une autorité de niveau
          </Space>
        }
        okText="Créer l'autorité"
        okButtonProps={{
          loading: saving,
          style: { background: autoritePalette.primary, borderColor: autoritePalette.primary },
        }}
        onOk={handleCreate}
        width={520}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item
              name="prenom"
              label="Prénom"
              rules={[{ required: true, message: "Prénom requis" }]}
            >
              <Input placeholder="ex: Marie" />
            </Form.Item>
            <Form.Item name="nom" label="Nom" rules={[{ required: true, message: "Nom requis" }]}>
              <Input placeholder="ex: Ngono" />
            </Form.Item>
          </div>
          <Form.Item
            name="email"
            label="Email institutionnel"
            rules={[
              { required: true, message: "Email requis" },
              { type: "email", message: "Email invalide" },
            ]}
          >
            <Input placeholder="ex: marie.ngono@pndp.cm" />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="telephone" label="Téléphone">
              <Input placeholder="ex: 671000000" />
            </Form.Item>
            <Form.Item name="ville" label="Ville" rules={[{ required: true, message: "Ville requise" }]}>
              <Input placeholder="ex: Yaoundé" />
            </Form.Item>
          </div>
          <Form.Item name="region" label="Région">
            <Input placeholder="ex: Centre" />
          </Form.Item>
          <Divider style={{ margin: "8px 0 16px" }} />
          <div
            style={{
              padding: "10px 14px",
              background: "#fff7e6",
              border: "1px solid #ffd591",
              borderRadius: 8,
              fontSize: 12,
              color: "#d46b08",
            }}
          >
            Un mot de passe temporaire sera généré et envoyé par e-mail (et SMS si téléphone fourni).
            L'autorité devra le changer dès sa première connexion.
          </div>
        </Form>
      </Modal>

      <Modal
        open={tempPassword !== null}
        onCancel={() => setTempPassword(null)}
        footer={
          <Button type="primary" onClick={() => setTempPassword(null)} style={{ background: autoritePalette.primary, borderColor: autoritePalette.primary }}>
            Fermer
          </Button>
        }
        width={420}
      >
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#f6ffed",
              border: "1px solid #b7eb8f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px",
            }}
          >
            <KeyOutlined style={{ color: "#52c41a", fontSize: 20 }} />
          </div>
          <Title level={4} style={{ margin: 0, color: autoritePalette.greenDark }}>
            Autorité créée
          </Title>
          <Text type="secondary" style={{ fontSize: 13, display: "block", margin: "8px 0 14px" }}>
            Le mot de passe temporaire a été envoyé par e-mail. Conservez-en une copie :
          </Text>
          <div
            style={{
              background: autoritePalette.greenDark,
              color: "#a7f3d0",
              fontFamily: "monospace",
              borderRadius: 8,
              padding: "12px",
              textAlign: "center",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.12em",
            }}
          >
            {tempPassword}
          </div>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 12 }}>
            L'autorité devra le changer à sa première connexion.
          </Text>
        </div>
      </Modal>
    </div>
  );
}
