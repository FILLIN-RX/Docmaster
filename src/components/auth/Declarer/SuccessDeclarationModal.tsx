import { Modal, Drawer, ThemeIcon, Title, Text, Paper, Button, Group, Stack, Box } from "@mantine/core";
import { useI18n } from "../../../context/I18nContext";

interface SuccessDeclarationModalProps {
  opened: boolean;
  isMobile: boolean;
  refNumber: string;
  onDownloadPdf: () => void;
  onNewDeclaration: () => void;
  onMyDeclarations: () => void;
}

/**
 * Confirmation screen displayed after a declaration is successfully submitted.
 * Shows the document reference number and offers PDF download or navigation to
 * the user's declaration list.
 *
 * Renders as a bottom-sheet Drawer on mobile and a centered Modal on desktop.
 */
export default function SuccessDeclarationModal({
  opened,
  isMobile,
  refNumber,
  onDownloadPdf,
  onNewDeclaration,
  onMyDeclarations,
}: SuccessDeclarationModalProps) {
  const { t } = useI18n();

  const body = (
    <Stack align="center" gap="sm">
      <ThemeIcon size={64} radius="xl" color="green" variant="light">
        <i className="fa-solid fa-check" style={{ fontSize: 28 }} />
      </ThemeIcon>
      <Title order={2} ta="center" style={{ fontFamily: "Bricolage Grotesque" }}>
        {t("declarer_success_title")}
      </Title>
      <Text size="sm" c="dimmed" ta="center">
        {t("declarer_success_desc")}
      </Text>
      <Paper p="sm" radius="md" style={{ background: "var(--color-bgMain)", border: "1px solid var(--color-borda)" }}>
        <Text ff="Bricolage Grotesque" fw={800} size="lg" c="green.9" style={{ letterSpacing: 2 }}>
          {refNumber}
        </Text>
      </Paper>
      <Text size="xs" c="gray.6" ta="center">
        {t("declarer_keep_reference")}
      </Text>
      <Button
        w="100%"
        size="md"
        color="orange"
        leftSection={<i className="fa-solid fa-file-arrow-down" />}
        onClick={onDownloadPdf}
      >
        {t("declarer_download_pdf")}
      </Button>
      <Group w="100%" gap="sm" grow>
        <Button variant="default" onClick={onNewDeclaration}>
          {t("declarer_new_declaration")}
        </Button>
        <Button
          color="dark"
          onClick={onMyDeclarations}
          styles={{ root: { background: "var(--color-green-dark)" } }}
        >
          {t("declarer_my_declarations")}
        </Button>
      </Group>
    </Stack>
  );

  if (isMobile) {
    return (
      <Drawer
        opened={opened}
        onClose={() => {}}
        position="bottom"
        size="auto"
        withCloseButton={false}
        padding="lg"
        radius="lg"
        lockScroll
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
      onClose={() => {}}
      centered
      radius="lg"
      size="md"
      withCloseButton={false}
      closeOnClickOutside={false}
    >
      {body}
    </Modal>
  );
}
