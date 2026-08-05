import { useState } from "react";
import { Button, Card, Form, Input, Typography, Alert, Space } from "antd";
import { LockOutlined, MailOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAutorite } from "../../context/AutoriteContext";
import { autoritePalette } from "../../theme/autorites";
import AutoriteDesignProvider from "../../components/autorites/AutoriteDesignProvider";

export default function AutoriteConnexion() {
  const { login } = useAutorite();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onFinish = async (values: { email: string; mot_de_passe: string }) => {
    setLoading(true);
    setError("");
    try {
      const autorite = await login(values.email, values.mot_de_passe);
      if (autorite.must_change_password) {
        navigate("/autorite/changement-mot-de-passe", { replace: true });
      } else {
        navigate("/autorite/dashboard", { replace: true });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Connexion impossible. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AutoriteDesignProvider>
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          overflow: "hidden",
          backgroundColor: autoritePalette.greenDark,
        }}
      >
        {/* ── Illustration vectorielle de fond ── */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 }}
        >
          <defs>
            <pattern id="dm-dots" width="38" height="38" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#FFFFFF" opacity="0.055" />
            </pattern>
            <linearGradient id="dm-wave" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={autoritePalette.greenMid} />
              <stop offset="0.5" stopColor={autoritePalette.primary} />
              <stop offset="1" stopColor={autoritePalette.greenMid} />
            </linearGradient>
          </defs>

          <rect width="1440" height="900" fill="url(#dm-dots)" />

          {/* halo or central */}
          <circle cx="720" cy="450" r="460" fill={autoritePalette.primary} opacity="0.06" />

          {/* bouclier institutionnel */}
          <g fill="none" stroke={autoritePalette.primary} strokeOpacity="0.35" strokeWidth="3">
            <path d="M 300 120 C 330 130 370 130 400 120 L 400 240 C 400 300 360 330 350 340 C 340 330 300 300 300 240 Z" />
            <circle cx="350" cy="200" r="26" strokeOpacity="0.45" />
            <path d="M 350 182 L 350 218 M 332 200 L 368 200" strokeOpacity="0.45" />
            <path d="M 322 246 L 322 256 M 378 246 L 378 256" />
          </g>

          {/* documents plies */}
          <g fill={autoritePalette.primary} fillOpacity="0.18">
            <path d="M 1080 170 L 1160 170 L 1160 250 L 1080 250 Z" stroke={autoritePalette.primary} strokeOpacity="0.3" strokeWidth="2" fillOpacity="0.06" />
            <path d="M 1160 170 L 1190 200 L 1160 200 Z" />
            <path d="M 1096 200 L 1144 200 M 1096 218 L 1144 218 M 1096 236 L 1124 236" stroke={autoritePalette.primary} strokeOpacity="0.3" strokeWidth="2" />
          </g>
          <g fill={autoritePalette.primary} fillOpacity="0.14">
            <path d="M 1010 260 L 1074 260 L 1074 324 L 1010 324 Z" stroke={autoritePalette.primary} strokeOpacity="0.25" strokeWidth="2" fillOpacity="0.05" />
            <path d="M 1074 260 L 1096 282 L 1074 282 Z" />
          </g>

          {/* onde inferieure */}
          <path
            d="M 0 760 C 240 700 420 820 720 770 C 1020 720 1200 840 1440 770 L 1440 900 L 0 900 Z"
            fill="url(#dm-wave)"
            opacity="0.14"
          />
        </svg>

      <Card
        style={{ width: 420, maxWidth: "100%", boxShadow: "0 12px 40px rgba(26,26,26,0.25)", position: "relative", zIndex: 1 }}
        styles={{ body: { padding: 36 } }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
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

          <Form.Item
            name="mot_de_passe"
            label="Mot de passe"
            rules={[{ required: true, message: "Veuillez saisir votre mot de passe" }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: autoritePalette.textMuted }} />} placeholder="••••••••" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 46, fontWeight: 600 }}>
            Se connecter
          </Button>
        </Form>

        <Space direction="vertical" size={4} style={{ width: "100%", textAlign: "center", marginTop: 20 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Accès réservé aux autorités habilitées
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Mot de passe temporaire fourni par e-mail
          </Typography.Text>
        </Space>
      </Card>
      </div>
    </AutoriteDesignProvider>
  );
}
