import { useState } from "react";
import { Typography, Space, Avatar, Dropdown, Button } from "antd";
import {
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation } from "react-router-dom";
import { usePartenaire } from "../../context/PartenaireContext";
import { partenairePalette } from "../../theme/partenaires";
import PartenaireDesignProvider from "../../components/partenaires/PartenaireDesignProvider";
import PartenaireSidebar from "../../components/partenaires/PartenaireSidebar";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Tableau de bord",
  declarer: "Déclarer une trouvaille",
  declarations: "Mes déclarations",
  portefeuille: "Portefeuille",
  profil: "Profil de l'organisation",
};

export default function PartenaireLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { partenaire, logout } = usePartenaire();
  const location = useLocation();

  const selectedKey = (() => {
    if (location.pathname.includes("/declarations")) return "declarations";
    if (location.pathname.includes("/declarer")) return "declarer";
    if (location.pathname.includes("/portefeuille")) return "portefeuille";
    if (location.pathname.includes("/profil")) return "profil";
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
    <PartenaireDesignProvider>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: partenairePalette.bgMain }}>
        <PartenaireSidebar collapsed={collapsed} onCollapse={setCollapsed} />

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Header */}
          <header
            style={{
              height: 64,
              background: partenairePalette.surface,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              borderBottom: `1px solid ${partenairePalette.border}`,
              boxShadow: "0 1px 3px rgba(18,18,18,0.05)",
              flexShrink: 0,
            }}
          >
            <Space>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ color: partenairePalette.textMain }}
              />
              <Typography.Title level={5} style={{ margin: 0, color: partenairePalette.greenDark }}>
                {PAGE_TITLES[selectedKey] || "Tableau de bord"}
              </Typography.Title>
            </Space>

            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: "pointer" }} size={10}>
                <Avatar style={{ background: partenairePalette.primary, fontWeight: 600 }} icon={<UserOutlined />}>
                  {(partenaire?.nom_organisation || "O").charAt(0).toUpperCase()}
                </Avatar>
                <div style={{ lineHeight: 1.2 }}>
                  <Typography.Text strong style={{ color: partenairePalette.textMain, display: "block", fontSize: 13 }}>
                    {partenaire?.nom_organisation || ""}
                  </Typography.Text>
                  <Typography.Text style={{ color: partenairePalette.textMuted, fontSize: 11, display: "block" }}>
                    {partenaire?.email}
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
    </PartenaireDesignProvider>
  );
}