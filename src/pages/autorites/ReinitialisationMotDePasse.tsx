import { useState } from "react";
import { Button, Card, Form, Input, Typography, Alert, Result } from "antd";
import { LockOutlined, KeyOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { autoritesService } from "../../services/autoritesService";
import { autoritePalette } from "../../theme/autorites";
import AutoriteDesignProvider from "../../components/autorites/AutoriteDesignProvider";
import PortalAuthBackground from "../../components/ui/PortalAuthBackground";

export default function AutoriteReinitialisationMotDePasse() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const onFinish = async (values: { nouveau_mot_de_passe: string }) => {
    setLoading(true);
    setError("");
    try {
      await autoritesService.resetPassword(token, values.nouveau_mot_de_passe);
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Réinitialisation impossible. Vérifiez le lien reçu.");
    } finally {
      setLoading(false);
    }
  };

  const card = (content: React.ReactNode) => (
    <Card
      style={{ width: 420, maxWidth: "100%", boxShadow: "0 12px 40px rgba(26,26,26,0.25)", position: "relative", zIndex: 1 }}
      styles={{ body: { padding: 36 } }}
    >
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: autoritePalette.greenDark,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <KeyOutlined style={{ color: autoritePalette.primary, fontSize: 30 }} />
        </div>
        <Typography.Title level={3} style={{ margin: 0, color: autoritePalette.greenDark }}>
          DocMaster
        </Typography.Title>
        <Typography.Text style={{ color: autoritePalette.textMuted }}>
          Espace institutionnel des autorités
        </Typography.Text>
      </div>
      {content}
    </Card>
  );

  if (!token && !done) {
    return (
      <AutoriteDesignProvider>
        <PortalAuthBackground palette={autoritePalette} variant="shield" background={autoritePalette.greenDark}>
          {card(
            <Result
              status="error"
              title="Lien invalide ou expiré"
              subTitle="Le lien de réinitialisation est invalide ou a expiré. Veuillez refaire une demande."
              extra={[
                <Button
                  key="retry"
                  type="primary"
                  block
                  onClick={() => navigate("/autorite/mot-de-passe-oublie")}
                  style={{ height: 44, fontWeight: 600 }}
                >
                  Demander un nouveau lien
                </Button>,
              ]}
            />
          )}
        </PortalAuthBackground>
      </AutoriteDesignProvider>
    );
  }

  if (done) {
    return (
      <AutoriteDesignProvider>
        <PortalAuthBackground palette={autoritePalette} variant="shield" background={autoritePalette.greenDark}>
          {card(
            <Result
              status="success"
              title="Mot de passe réinitialisé"
              subTitle="Vous pouvez maintenant vous connecter avec votre nouveau mot de passe."
              extra={[
                <Button
                  key="login"
                  type="primary"
                  block
                  onClick={() => navigate("/autorite/connexion")}
                  style={{ height: 44, fontWeight: 600 }}
                >
                  Se connecter
                </Button>,
              ]}
            />
          )}
        </PortalAuthBackground>
      </AutoriteDesignProvider>
    );
  }

  return (
    <AutoriteDesignProvider>
      <PortalAuthBackground palette={autoritePalette} variant="shield" background={autoritePalette.greenDark}>
        {card(
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <Typography.Title level={4} style={{ margin: 0, color: autoritePalette.greenDark }}>
                Nouveau mot de passe
              </Typography.Title>
              <Typography.Text type="secondary" style={{ display: "block", marginTop: 6, fontSize: 13 }}>
                Choisissez un nouveau mot de passe pour votre compte autorité.
              </Typography.Text>
            </div>

            {error && (
              <Alert type="error" message={error} showIcon style={{ marginBottom: 18 }} closable onClose={() => setError("")} />
            )}

            <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
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
                Réinitialiser le mot de passe
              </Button>
            </Form>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Link to="/autorite/connexion" style={{ fontSize: 13, color: autoritePalette.primaryDark, fontWeight: 500 }}>
                <ArrowLeftOutlined style={{ marginRight: 6 }} />
                Retour à la connexion
              </Link>
            </div>
          </>
        )}
      </PortalAuthBackground>
    </AutoriteDesignProvider>
  );
}
