import { ConfigProvider } from "antd";
import { partenaireTheme } from "../../theme/partenaires";
import { useI18n } from "../../context/I18nContext";
import { getAntdLocale, applyDayjsLocale, isRtl } from "../../js/i18n/antd";

/**
 * Enveloppe isolée du module partenaires : applique le thème antd uniquement
 * ici, sans affecter le design Mantine du reste de l'application.
 */
export default function PartenaireDesignProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useI18n();
  applyDayjsLocale(lang);
  return (
    <ConfigProvider
      theme={partenaireTheme}
      locale={getAntdLocale(lang)}
      direction={isRtl(lang) ? "rtl" : "ltr"}
    >
      {children}
    </ConfigProvider>
  );
}
