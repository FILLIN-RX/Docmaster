import { ConfigProvider } from "antd";
import { autoriteTheme } from "../../theme/autorites";

/**
 * Enveloppe isolée du module autorités : applique le thème antd uniquement
 * ici, sans affecter le design Mantine du reste de l'application.
 */
export default function AutoriteDesignProvider({ children }: { children: React.ReactNode }) {
  return <ConfigProvider theme={autoriteTheme}>{children}</ConfigProvider>;
}