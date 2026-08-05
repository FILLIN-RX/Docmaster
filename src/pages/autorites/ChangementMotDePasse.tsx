import { useState } from "react";
import { Button, Card, Form, Input, Typography, Alert, Space } from "antd";
import { LockOutlined, KeyOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAutorite } from "../../context/AutoriteContext";
import { autoritesService } from "../../services/autoritesService";
import { autoritePalette } from "../../theme/autorites";
import AutoriteDesignProvider from "../../components/autorites/AutoriteDesignProvider";

export default function ChangementMotDePasse() {
  const { autorite, refresh } = useAutorite();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const onFinish = async (values: { ancien_mot_de_passe: string; nouveau_mot_de_passe: string }) => {
    setLoading(true);
    setError("");
    try {
      await autoritesService.changePassword(values.ancien_mot_de_passe, values.nouveau_mot_de_passe);
      setDone(true);
      await refresh();
      setTimeout(() => navigate("/autorite/dashboard", { replace: true }), 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Impossible de changer le mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AutoriteDesignProvider>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: `linear-gradient(135deg, ${autoritePalette.greenDark} 0%, ${autoritePalette.greenMid} 60%, ${autoritePalette.primaryDark} 100%)`,
        }}
      >
      <Card style={{ width: 440, maxWidth: "100%", boxShadow: "0 12px 40px rgba(26,26,26,0.25)" }} styles={{ body: { padding: 36 } }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: autoritePalette.primary,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <KeyOutlined style={{ color: "#fff", fontSize: 26 }} />
          </div>
          <Typography.Title level={4} style={{ margin: 0, color: autoritePalette.greenDark }}>
            Changez votre mot de passe
          </Typography.Title>
          <Typography.Text type="secondary" style={{ display: "block", marginTop: 6 }}>
            {autorite ? `${autorite.prenom} ${autorite.nom}` : ""} — pour des raisons de sécurité, vous devez
            définir un nouveau mot de passe avant de continuer.
          </Typography.Text>
        </div>

        {done && (
          <Alert
            type="success"
            icon={<CheckCircleOutlined />}
            message="Mot de passe mis à jour"
            description="Redirection vers votre espace..."
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {error && (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} closable onClose={() => setError("")} />
        )}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
          <Form.Item
            name="ancien_mot_de_passe"
            label="Mot de passe temporaire"
            rules={[{ required: true, message: "Veuillez saisir votre mot de passe actuel" }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: autoritePalette.textMuted }} />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            name="nouveau_mot_de_passe"
            label="Nouveau mot de passe"
            rules={[
              { required: true, message: "Veuillez saisir un nouveau mot de passe" },
              { min: 8, message: "Au moins 8 caractères" },
            ]}
            extra="Minimum 8 caractères."
          >
            <Input.Password prefix={<LockOutlined style={{ color: autoritePalette.textMuted }} />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            name="confirmation"
            label="Confirmer le nouveau mot de passe"
            dependencies={["nouveau_mot_de_passe"]}
            rules={[
              { required: true, message: "Veuillez confirmer le mot de passe" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("nouveau_mot_de_passe") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Les deux mots de passe ne correspondent pas"));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: autoritePalette.textMuted }} />} placeholder="••••••••" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 46, fontWeight: 600 }}>
            Enregistrer le nouveau mot de passe
          </Button>
        </Form>

        <Space direction="vertical" size={4} style={{ width: "100%", textAlign: "center", marginTop: 18 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Le mot de passe ne pourra être changé que depuis votre espace.
          </Typography.Text>
        </Space>
      </Card>
      </div>
    </AutoriteDesignProvider>
  );
}
