import { Menu, Avatar, Typography, Badge, Button, Tooltip } from "antd";
import {
  DashboardOutlined,
  FileProtectOutlined,
  LogoutOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useAutorite } from "../../context/AutoriteContext";
import { autoritePalette } from "../../theme/autorites";

interface AutoriteSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export default function AutoriteSidebar({ collapsed, onCollapse }: AutoriteSidebarProps) {
  const { autorite, logout } = useAutorite();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = (() => {
    if (location.pathname.includes("/declarations")) return "declarations";
    if (location.pathname.includes("/autorites")) return "autorites";
    if (location.pathname.includes("/journal")) return "journal";
    return "dashboard";
  })();

  const menuItems = [
    { key: "dashboard", icon: <DashboardOutlined />, label: "Tableau de bord" },
    { key: "declarations", icon: <FileProtectOutlined />, label: "Déclarations" },
    { key: "journal", icon: <HistoryOutlined />, label: "Journal d'activité" },
    ...(autorite?.niveau === "HAUTE"
      ? [{ key: "autorites", icon: <TeamOutlined />, label: "Gestion des autorités" }]
      : []),
  ];

  const goTo = (key: string) => {
    if (key === "declarations") navigate("/autorite/declarations");
    else if (key === "autorites") navigate("/autorite/autorites");
    else if (key === "journal") navigate("/autorite/journal");
    else navigate("/autorite/dashboard");
  };

  const sidebarW = collapsed ? 80 : 240;

  return (
    <aside
      style={{
        width: sidebarW,
        minWidth: sidebarW,
        height: "100vh",
        background: autoritePalette.greenDark,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease, min-width 0.2s ease",
        overflow: "hidden",
        flexShrink: 0,
        position: "relative",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 10,
          padding: collapsed ? "0" : "0 16px",
          borderBottom: `1px solid ${autoritePalette.greenMid}`,
          cursor: "pointer",
          flexShrink: 0,
        }}
        onClick={() => navigate("/autorite/dashboard")}
      >
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: autoritePalette.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <SafetyCertificateOutlined style={{ color: "#fff", fontSize: 18 }} />
        </span>
        {!collapsed && (
          <div style={{ lineHeight: 1.1, overflow: "hidden", whiteSpace: "nowrap" }}>
            <Typography.Text strong style={{ color: "#FFFFFF", fontSize: 15, display: "block" }}>
              DocMaster
            </Typography.Text>
            <Typography.Text style={{ color: autoritePalette.primaryLight, fontSize: 11, display: "block" }}>
              Espace Autorité
            </Typography.Text>
          </div>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 8 }}>
        <Menu
          theme="dark"
          mode="inline"
          inlineCollapsed={collapsed}
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => goTo(key)}
          style={{ marginTop: 12, background: "transparent" }}
        />
      </div>

      {/* User card */}
      {!collapsed && autorite && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.08)",
            border: `1px solid ${autoritePalette.greenMid}`,
            margin: "0 16px 16px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Avatar style={{ background: autoritePalette.primary, fontWeight: 600, fontSize: 12 }} icon={<UserOutlined />}>
              {autorite ? `${(autorite.prenom || "").charAt(0)}${(autorite.nom || "").charAt(0)}`.toUpperCase() : ""}
            </Avatar>
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <Typography.Text strong style={{ color: "#fff", fontSize: 12, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {autorite.prenom} {autorite.nom}
              </Typography.Text>
              <Typography.Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                <EnvironmentOutlined /> {autorite.ville}
                {autorite.region ? `, ${autorite.region}` : ""}
              </Typography.Text>
            </div>
          </div>
          <Badge
            status={autorite.niveau === "HAUTE" ? "warning" : "success"}
            text={<span style={{ color: "#fff", fontSize: 11 }}>Autorité {autorite.niveau === "HAUTE" ? "Haute" : "Niveau"}</span>}
            style={{ display: "block", marginBottom: 10 }}
          />
          <Button danger block size="small" icon={<LogoutOutlined />} onClick={() => logout()} style={{ fontWeight: 500 }}>
            Se déconnecter
          </Button>
        </div>
      )}

      {collapsed && (
        <div style={{ padding: "0 0 16px", display: "flex", justifyContent: "center" }}>
          <Tooltip title="Se déconnecter" placement="right">
            <Button danger type="text" icon={<LogoutOutlined />} onClick={() => logout()} />
          </Tooltip>
        </div>
      )}
    </aside>
  );
}