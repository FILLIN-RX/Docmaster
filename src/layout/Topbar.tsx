import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { useNotifications } from "../hooks/useNotifications";
import { getPhotoUrl } from "../utils/image";
import VipAvatar, { isVipUser } from "../components/ui/VipBadge";
import {
  Group,
  Text,
  Paper,
  Button,
  TextInput,
  Menu,
  ActionIcon,
  Burger,
  Breadcrumbs,
  Anchor,
  Avatar,
  Indicator,
} from "@mantine/core";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface TopbarProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  onToggleSidebar?: () => void;
}

export default function Topbar({ title, breadcrumbs = [], onToggleSidebar }: TopbarProps) {
  const { user } = useAuth();
  const { t, lang, setLanguage } = useI18n();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState("");
  const [opened, setOpened] = useState(false);

  const handleToggle = () => {
    setOpened((o) => !o);
    if (onToggleSidebar) {
      onToggleSidebar();
    } else if ((window as any).__sidebarToggle) {
      (window as any).__sidebarToggle();
    }
  };

  const doSearch = () => {
    const q = searchQ.trim();
    if (q) navigate(`/rechercher?q=${encodeURIComponent(q)}`);
    else navigate("/rechercher");
  };

  const languageLabel = lang === "fr" ? "Français" : lang === "ar" ? "العربية" : "English";

  return (
    <Paper
      component="header"
      radius={0}
      px={{ base: "sm", md: "xl" }}
      h={64}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--mantine-spacing-md)",
        borderBottom: "1px solid var(--color-borda)",
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* Left: sidebar toggle + breadcrumbs/title + search */}
      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
        <Burger
          opened={opened}
          onClick={handleToggle}
          size="sm"
          aria-label="Basculer le menu"
        />

        <div style={{ minWidth: 0, flex: 1 }}>
          {breadcrumbs.length > 0 ? (
            <Breadcrumbs
              separator={<i className="fa-solid fa-chevron-right" style={{ fontSize: 10, color: "var(--mantine-color-gray-5)" }} />}
              visibleFrom="sm"
            >
              {breadcrumbs.map((crumb, i) => {
                const isLast = i === breadcrumbs.length - 1;
                return crumb.href && !isLast ? (
                  <Anchor key={i} href={crumb.href} c="dimmed" size="sm" underline="never">
                    {crumb.label}
                  </Anchor>
                ) : (
                  <Text key={i} size="sm" fw={isLast ? 600 : 400} c={isLast ? "green.9" : "dimmed"} truncate>
                    {crumb.label}
                  </Text>
                );
              })}
            </Breadcrumbs>
          ) : (
            <Text fw={700} size="md" c="dark.6" visibleFrom="sm" truncate>
              {title}
            </Text>
          )}
        </div>

        <TextInput
          visibleFrom="md"
          value={searchQ}
          onChange={(e) => setSearchQ(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder={t("topbar_search")}
          radius="md"
          size="sm"
          w="100%"
          maw={340}
          leftSection={<i className="fa-solid fa-magnifying-glass" style={{ fontSize: 13, color: "var(--mantine-color-gray-5)" }} />}
          rightSection={
            <ActionIcon variant="subtle" color="yellow" onClick={doSearch} size="sm" aria-label="Rechercher">
              <i className="fa-solid fa-arrow-right" />
            </ActionIcon>
          }
          styles={{
            input: {
              backgroundColor: "var(--color-bgMain)",
              border: "1px solid var(--color-borderMain)",
            },
          }}
        />
      </Group>

      {/* Right: actions */}
      <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
        <Button
          component={Link}
          to="/declarer"
          visibleFrom="md"
          size="xs"
          radius="md"
          color="red"
          leftSection={<i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 10 }} />}
        >
          {t("topbar_declare_lost")}
        </Button>

        <Button
          component={Link}
          to="/trouver"
          visibleFrom="md"
          size="xs"
          radius="md"
          color="green"
          leftSection={<i className="fa-solid fa-hand-holding-hand" style={{ fontSize: 10 }} />}
        >
          {t("topbar_found_doc")}
        </Button>

        <Menu radius="md" width={140} shadow="md" withArrow>
          <Menu.Target>
            <Button
              visibleFrom="sm"
              variant="default"
              size="xs"
              radius="md"
              leftSection={<i className="fa-solid fa-globe" style={{ color: "var(--color-primary, #D98A30)", fontSize: 11 }} />}
              rightSection={<i className="fa-solid fa-chevron-down" style={{ fontSize: 9, color: "var(--mantine-color-gray-5)" }} />}
            >
              {languageLabel}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => setLanguage("fr")} leftSection={<i className="fa-solid fa-globe" style={{ color: "var(--color-primary, #D98A30)" }} />}>
              Français
            </Menu.Item>
            <Menu.Item onClick={() => setLanguage("en")} leftSection={<i className="fa-solid fa-globe" style={{ color: "var(--color-primary, #D98A30)" }} />}>
              English
            </Menu.Item>
            <Menu.Item onClick={() => setLanguage("ar")} leftSection={<i className="fa-solid fa-globe" style={{ color: "var(--color-primary, #D98A30)" }} />}>
              العربية
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        <Indicator
          label={unreadCount > 9 ? "9+" : unreadCount}
          size={16}
          color="red"
          disabled={unreadCount === 0}
          offset={4}
        >
          <ActionIcon
            onClick={() => (window as any).__openNotifModal?.()}
            variant="default"
            size="lg"
            radius="md"
            aria-label="Notifications"
          >
            <i className="fa-solid fa-bell" style={{ color: "var(--mantine-color-gray-6)" }} />
          </ActionIcon>
        </Indicator>

        <Button
          component={Link}
          to="/infos-profil"
          variant="default"
          size="xs"
          radius="md"
          h={40}
          pl={4}
          pr="xs"
          leftSection={
            <VipAvatar isVip={isVipUser(user)}>
              {user?.photo_url ? (
                <Avatar src={getPhotoUrl(user.photo_url)} radius="sm" size={28} />
              ) : (
                <Avatar radius="sm" size={28} color="green" variant="gradient" gradient={{ from: "green.9", to: "green.6" }}>
                  {user?.initial || "DM"}
                </Avatar>
              )}
            </VipAvatar>
          }
        >
          {user?.prenom ? (
            <Text size="xs" fw={600} c="dark.6" visibleFrom="sm">
              {user.prenom}
            </Text>
          ) : null}
        </Button>
      </Group>
    </Paper>
  );
}