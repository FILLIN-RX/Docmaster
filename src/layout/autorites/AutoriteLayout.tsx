import { useState } from "react";
import { Typography, Space, Avatar, Dropdown, Button } from "antd";
import {
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation } from "react-router-dom";
import { useAutorite } from "../../context/AutoriteContext";
import { autoritePalette } from "../../theme/autorites";
import AutoriteDesignProvider from "../../components/autorites/AutoriteDesignProvider";
import AutoriteSidebar from "../../components/autorites/AutoriteSidebar";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Tableau de bord",
  declarations: "Gestion des déclarations",
  autorites: "Gestion des autorités",
  journal: "Journal d'activité",
};

export default function AutoriteLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { autorite, logout } = useAutorite();
  const location = useLocation();

  const selectedKey = (() => {
    if (location.pathname.includes("/declarations")) return "declarations";
    if (location.pathname.includes("/autorites")) return "autorites";
    if (location.pathname.includes("/journal")) return "journal";
    return "dashboard";
  })();

  const userMenu = {
    items: [
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Se déconnecter",
        danger: true,
        onClick: () => logout(),
      },
    ],
  };

  return (
    <AutoriteDesignProvider>
      <div style={{ display: "flex", minHeight: "100vh", background: autoritePalette.bgMain }}>
        <AutoriteSidebar collapsed={collapsed} onCollapse={setCollapsed} />

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <header
            style={{
              height: 64,
              background: autoritePalette.surface,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              borderBottom: `1px solid ${autoritePalette.border}`,
              boxShadow: "0 1px 3px rgba(26,26,26,0.05)",
              position: "sticky",
              top: 0,
              zIndex: 90,
              flexShrink: 0,
            }}
          >
            <Space>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ color: autoritePalette.textMain }}
              />
              <Typography.Title level={5} style={{ margin: 0, color: autoritePalette.greenDark }}>
                {PAGE_TITLES[selectedKey] || "Tableau de bord"}
              </Typography.Title>
            </Space>

            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: "pointer" }} size={10}>
                <Avatar style={{ background: autoritePalette.primary, fontWeight: 600 }} icon={<UserOutlined />}>
                  {autorite ? `${(autorite.prenom || "").charAt(0)}${(autorite.nom || "").charAt(0)}`.toUpperCase() : ""}
                </Avatar>
                <div style={{ lineHeight: 1.2 }}>
                  <Typography.Text strong style={{ color: autoritePalette.textMain, display: "block", fontSize: 13 }}>
                    {autorite ? `${autorite.prenom} ${autorite.nom}` : ""}
                  </Typography.Text>
                  <Typography.Text style={{ color: autoritePalette.textMuted, fontSize: 11, display: "block" }}>
                    {autorite?.email}
                  </Typography.Text>
                </div>
              </Space>
            </Dropdown>
          </header>

          {/* Content */}
          <main style={{ flex: 1, padding: 24, overflowY: "auto" }}>
            <Outlet />
          </main>
        </div>
      </div>
    </AutoriteDesignProvider>
  );
}