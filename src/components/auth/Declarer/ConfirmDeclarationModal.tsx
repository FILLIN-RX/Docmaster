import { Modal, Drawer, ThemeIcon, Title, Text, Paper, PasswordInput, Group, Button, Stack, Box } from "@mantine/core";
import { useI18n } from "../../../context/I18nContext";

interface ConfirmDeclarationModalProps {
  opened: boolean;
  isMobile: boolean;
  password: string;
  passwordError: boolean;
  submitting: boolean;
  onClose: () => void;
  onPasswordChange: (value: string) => void;
  onConfirm: () => void;
}

/**
 * Confirmation step before submitting a declaration. Shows a password prompt
 * to re-verify the user's identity.
 *
 * Renders as a bottom-sheet Drawer on mobile and a centered Modal on desktop.
 */
export default function ConfirmDeclarationModal({
  opened,
  isMobile,
  password,
  passwordError,
  submitting,
  onClose,
  onPasswordChange,
  onConfirm,
}: ConfirmDeclarationModalProps) {
  const { t } = useI18n();

  const handleClose = () => {
    onClose();
    onPasswordChange("");
  };

  const body = (
    <Stack align="center" gap="sm">
      <ThemeIcon size={60} radius="xl" color="red" variant="light">
        <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 24 }} />
      </ThemeIcon>
      <Title order={3} ta="center" style={{ fontFamily: "Bricolage Grotesque" }}>
        {t("declarer_confirm_title")}
      </Title>
      <Text size="sm" c="dimmed" ta="center">
        {t("declarer_confirm_desc")}
      </Text>
      <Paper
        p="sm"
        radius="md"
        w="100%"
        style={{ background: "var(--mantine-color-orange-0)", border: "1px solid var(--mantine-color-orange-2)" }}
      >
        <Text size="xs" c="orange.9" fw={600}>
          <i className="fa-solid fa-circle-info" style={{ marginRight: 6 }} />
          {t("declarer_cost_warning")}
        </Text>
      </Paper>
      <PasswordInput
        w="100%"
        label={t("declarer_placeholder_password")}
        value={password}
        onChange={(e) => onPasswordChange(e.currentTarget.value)}
        onKeyDown={(e) => e.key === "Enter" && password && !submitting && onConfirm()}
        error={passwordError ? t("declarer_wrong_password") : undefined}
        leftSection={<i className="fa-solid fa-lock" />}
      />
      <Group w="100%" gap="sm" grow>
        <Button variant="default" onClick={handleClose}>
          {t("declarer_cancel")}
        </Button>
        <Button
          color="red"
          loading={submitting}
          onClick={onConfirm}
          leftSection={!submitting && <i className="fa-solid fa-circle-check" />}
        >
          {t("declarer_confirm")}
        </Button>
      </Group>
    </Stack>
  );

  if (isMobile) {
    return (
      <Drawer
        opened={opened}
        onClose={handleClose}
        position="bottom"
        size="auto"
        withCloseButton={false}
        padding="lg"
        radius="lg"
        styles={{ content: { borderTopLeftRadius: 24, borderTopRightRadius: 24 } }}
      >
        <Box w={48} h={4} bg="gray.3" mx="auto" mb="md" style={{ borderRadius: 99 }} />
        {body}
      </Drawer>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      centered
      radius="lg"
      size="md"
      withCloseButton={false}
    >
      {body}
    </Modal>
  );
}
