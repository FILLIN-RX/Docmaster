import { Dropdown, Button } from "antd";
import { GlobalOutlined, CheckOutlined } from "@ant-design/icons";
import { useI18n } from "../../context/I18nContext";

const LANGS = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
];

interface LanguageSwitcherProps {
  accentColor?: string;
  onDark?: boolean;
}

export default function LanguageSwitcher({
  accentColor = "#1F7A8C",
  onDark = false,
}: LanguageSwitcherProps) {
  const { lang, setLanguage } = useI18n();

  const current = LANGS.find((l) => l.code === lang) || LANGS[0];

  const textColor = onDark ? "rgba(255,255,255,0.92)" : "#333";

  const menu = {
    items: LANGS.map((l) => ({
      key: l.code,
      icon: l.code === lang ? <CheckOutlined style={{ color: accentColor }} /> : undefined,
      label: l.label,
      onClick: () => setLanguage(l.code),
    })),
  };

  return (
    <Dropdown menu={menu} placement="bottomRight">
      <Button
        size="small"
        onClick={(e) => e.preventDefault()}
        icon={<GlobalOutlined style={{ color: onDark ? "#fff" : accentColor }} />}
        style={{
          borderColor: onDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.12)",
          background: onDark ? "rgba(255,255,255,0.08)" : "transparent",
          color: textColor,
          fontWeight: 500,
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        {current.label}
      </Button>
    </Dropdown>
  );
}
