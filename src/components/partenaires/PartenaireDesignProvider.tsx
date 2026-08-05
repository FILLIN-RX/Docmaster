import { ConfigProvider } from "antd";
import { partenaireTheme } from "../../theme/partenaires";

/**
 * Enveloppe isolée du module partenaires : applique le thème antd uniquement
 * ici, sans affecter le design Mantine du reste de l'application.
 */
export default function PartenaireDesignProvider({ children }: { children: React.ReactNode }) {
  return <ConfigProvider theme={partenaireTheme}>{children}</ConfigProvider>;
}