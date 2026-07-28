import { Card, Group, Text, Title, ThemeIcon, rem } from "@mantine/core";
import { useI18n } from "../../../context/I18nContext";

interface SectionCardProps {
  children: React.ReactNode;
  stepNum: number;
  title: string;
  description?: string;
}

/**
 * Reusable card for one numbered section in the multi-step declaration flow.
 * Used inside the form column to render a step's body.
 */
export default function SectionCard({ children, stepNum, title, description }: SectionCardProps) {
  const { t } = useI18n();

  return (
    <Card
      shadow="xs"
      radius="lg"
      padding={{ base: "md", sm: "xl" }}
      withBorder
      style={{
        background: "white",
        borderColor: "var(--color-borda)",
      }}
    >
      <Group gap="xs" mb="sm">
        <ThemeIcon size="md" radius="xl" color="orange" variant="filled">
          <Text size="xs" fw={700}>{stepNum}</Text>
        </ThemeIcon>
        <Text size="xs" fw={700} c="orange.7" tt="uppercase" style={{ letterSpacing: 0.5 }}>
          {t("declarer_step")} {stepNum}
        </Text>
      </Group>
      <Title order={3} mb={4} style={{ fontFamily: "Bricolage Grotesque", fontWeight: 800, fontSize: rem(17) }}>
        {title}
      </Title>
      {description && (
        <Text size="sm" c="dimmed" mb="md">
          {description}
        </Text>
      )}
      {children}
    </Card>
  );
}
