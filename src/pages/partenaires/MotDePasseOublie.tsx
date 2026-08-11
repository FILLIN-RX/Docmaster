import { useState } from "react";
import { Button, Card, Form, Input, Typography, Alert, Result } from "antd";
import { MailOutlined, ShopOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { useI18n } from "../../context/I18nContext";
import { partenairesService } from "../../services/partenairesService";
import { partenairePalette } from "../../theme/partenaires";
import PartenaireDesignProvider from "../../components/partenaires/PartenaireDesignProvider";
import PortalAuthBackground from "../../components/ui/PortalAuthBackground";
import LanguageSwitcher from "../../components/ui/LanguageSwitcher";

export default function PartenaireMotDePasseOublie() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    setError("");
    try {
      await partenairesService.forgotPassword(values.email);
      setEmail(values.email);
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || t("portal_forgot_error_default"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PartenaireDesignProvider>
      <PortalAuthBackground palette={partenairePalette} variant="building" background={partenairePalette.greenDark}>
        <div style={{ position: "absolute", top: 16, right: 16, zIndex: 2 }}>
          <LanguageSwitcher onDark accentColor={partenairePalette.primary} />
        </div>

        <Card
          style={{ width: 420, maxWidth: "100%", boxShadow: "0 12px 40px rgba(18,18,18,0.25)", position: "relative", zIndex: 1 }}
          styles={{ body: { padding: 36 } }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: partenairePalette.greenDark,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <ShopOutlined style={{ color: partenairePalette.primary, fontSize: 30 }} />
            </div>
            <Typography.Title level={3} style={{ margin: 0, color: partenairePalette.greenDark }}>
              DocMaster
            </Typography.Title>
            <Typography.Text style={{ color: partenairePalette.textMuted }}>
              {t("partenaire_login_title")}
            </Typography.Text>
          </div>

          {sent ? (
            <Result
              status="success"
              icon={<MailOutlined style={{ color: partenairePalette.success, fontSize: 56 }} />}
              title={t("portal_forgot_sent_title")}
              subTitle={
                <span style={{ fontSize: 13 }}>
                  {t("portal_forgot_sent_desc").replace("{email}", email)}
                </span>
              }
              extra={[
                <Button
                  key="back"
                  type="primary"
                  block
                  onClick={() => navigate("/partenaire/connexion")}
                  style={{ height: 44, fontWeight: 600 }}
                >
                  {t("portal_forgot_back_login")}
                </Button>,
              ]}
            />
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <Typography.Title level={4} style={{ margin: 0, color: partenairePalette.greenDark }}>
                  {t("portal_forgot_title")}
                </Typography.Title>
                <Typography.Text type="secondary" style={{ display: "block", marginTop: 6, fontSize: 13 }}>
                  {t("portal_forgot_desc")}
                </Typography.Text>
              </div>

              {error && (
                <Alert type="error" message={error} showIcon style={{ marginBottom: 18 }} closable onClose={() => setError("")} />
              )}

              <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
                <Form.Item
                  name="email"
                  label={t("portal_email_label")}
                  rules={[
                    { required: true, message: t("portal_email_required") },
                    { type: "email", message: t("portal_email_invalid") },
                  ]}
                >
                  <Input prefix={<MailOutlined style={{ color: partenairePalette.textMuted }} />} placeholder="organisation@exemple.cm" />
                </Form.Item>

                <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 46, fontWeight: 600 }}>
                  {t("portal_forgot_send")}
                </Button>
              </Form>

              <div style={{ textAlign: "center", marginTop: 20 }}>
                <Link to="/partenaire/connexion" style={{ fontSize: 13, color: partenairePalette.primaryDark, fontWeight: 500 }}>
                  <ArrowLeftOutlined style={{ marginRight: 6 }} />
                  {t("portal_forgot_back_login")}
                </Link>
              </div>
            </>
          )}
        </Card>
      </PortalAuthBackground>
    </PartenaireDesignProvider>
  );
}
