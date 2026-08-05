import type { ThemeConfig } from "antd";

export const partenairePalette = {
  primary: "#1F7A8C",
  primaryDark: "#125C6E",
  primaryLight: "#E0F2F5",
  greenDark: "#0E3F4F",
  greenMid: "#155F73",
  greenLight: "#E6F4F7",
  bgMain: "#F4F7F8",
  surface: "#FFFFFF",
  textMain: "#12343C",
  textMuted: "#5C767F",
  border: "#D9E4E7",
  danger: "#C4463A",
  success: "#2D6A4F",
};

export const partenaireTheme: ThemeConfig = {
  token: {
    colorPrimary: partenairePalette.primary,
    colorInfo: partenairePalette.primary,
    colorSuccess: partenairePalette.success,
    colorWarning: partenairePalette.primary,
    colorError: partenairePalette.danger,
    colorBgLayout: partenairePalette.bgMain,
    colorBgContainer: partenairePalette.surface,
    colorBorder: partenairePalette.border,
    colorBorderSecondary: partenairePalette.border,
    colorText: partenairePalette.textMain,
    colorTextSecondary: partenairePalette.textMuted,
    borderRadius: 6,
    fontFamily: "Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 14,
  },
  components: {
    Layout: {
      headerBg: partenairePalette.greenDark,
      headerColor: "#FFFFFF",
      siderBg: partenairePalette.greenDark,
      triggerBg: partenairePalette.greenMid,
      bodyBg: partenairePalette.bgMain,
      headerHeight: 64,
    },
    Menu: {
      darkItemBg: partenairePalette.greenDark,
      darkSubMenuItemBg: partenairePalette.greenDark,
      darkItemSelectedBg: partenairePalette.primary,
      darkItemHoverBg: partenairePalette.greenMid,
      darkItemColor: "rgba(255, 255, 255, 0.82)",
      darkItemHoverColor: "#FFFFFF",
      darkItemSelectedColor: "#FFFFFF",
      itemBorderRadius: 6,
      itemMarginInline: 8,
    },
    Button: {
      primaryShadow: "0 2px 6px rgba(31, 122, 140, 0.35)",
      fontWeight: 500,
    },
    Card: {
      borderRadiusLG: 10,
      boxShadowTertiary: "0 1px 4px rgba(18, 52, 60, 0.06)",
    },
    Table: {
      headerBg: partenairePalette.greenLight,
      headerColor: partenairePalette.greenDark,
      rowHoverBg: partenairePalette.primaryLight,
      borderColor: partenairePalette.border,
    },
    Tag: {
      borderRadiusSM: 4,
    },
    Tabs: {
      inkBarColor: partenairePalette.primary,
      itemSelectedColor: partenairePalette.primaryDark,
    },
  },
};