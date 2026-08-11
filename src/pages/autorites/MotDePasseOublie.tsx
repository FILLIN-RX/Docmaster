import { useState } from "react";
import { Button, Card, Form, Input, Typography, Alert, Result } from "antd";
import { MailOutlined, SafetyCertificateOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { autoritesService } from "../../services/autoritesService";
import { autoritePalette } from "../../theme/autorites";
import AutoriteDesignProvider from "../../components/autorites/AutoriteDesignProvider";
import PortalAuthBackground from "../../components/ui/PortalAuthBackground";

export default function AutoriteMotDePasseOublie() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    setError("");
    try {
      await autoritesService.forgotPassword(values.email);
      setEmail(values.email);
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Impossible d'envoyer le lien de réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AutoriteDesignProvider>
      <PortalAuthBackground palette={autoritePalette} variant="shield" background={autoritePalette.greenDark}>
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
              <SafetyCertificateOutlined style={{ color: autoritePalette.primary, fontSize: 30 }} />
            </div>
            <Typography.Title level={3} style={{ margin: 0, color: autoritePalette.greenDark }}>
              DocMaster
            </Typography.Title>
            <Typography.Text style={{ color: autoritePalette.textMuted }}>
              Espace institutionnel des autorités
            </Typography.Text>
          </div>

          {sent ? (
            <Result
              status="success"
              icon={<MailOutlined style={{ color: autoritePalette.success, fontSize: 56 }} />}
              title="Lien envoyé"
              subTitle={
                <span style={{ fontSize: 13 }}>
                  Si un compte autorité existe avec <strong>{email}</strong>, un lien de réinitialisation vient
                  d'être envoyé par e-mail. Il expire dans 24 heures.
                </span>
              }
              extra={[
                <Button
                  key="back"
                  type="primary"
                  block
                  onClick={() => navigate("/autorite/connexion")}
                  style={{ height: 44, fontWeight: 600 }}
                >
                  Retour à la connexion
                </Button>,
              ]}
            />
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <Typography.Title level={4} style={{ margin: 0, color: autoritePalette.greenDark }}>
                  Mot de passe oublié
                </Typography.Title>
                <Typography.Text type="secondary" style={{ display: "block", marginTop: 6, fontSize: 13 }}>
                  Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.
                </Typography.Text>
              </div>

              {error && (
                <Alert type="error" message={error} showIcon style={{ marginBottom: 18 }} closable onClose={() => setError("")} />
              )}

              <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
                <Form.Item
                  name="email"
                  label="Adresse e-mail"
                  rules={[
                    { required: true, message: "Veuillez saisir votre e-mail" },
                    { type: "email", message: "Adresse e-mail invalide" },
                  ]}
                >
                  <Input prefix={<MailOutlined style={{ color: autoritePalette.textMuted }} />} placeholder="autorite@exemple.cm" />
                </Form.Item>

                <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 46, fontWeight: 600 }}>
                  Envoyer le lien
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
        </Card>
      </PortalAuthBackground>
    </AutoriteDesignProvider>
  );
}
