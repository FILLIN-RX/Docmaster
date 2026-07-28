import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { useI18n } from "../../context/I18nContext";
import Topbar from "../../layout/Topbar";
import DatePicker from "../../components/ui/DatePicker";
import VipAvatar, { isVipUser } from "../../components/ui/VipBadge";
import type { UserProfile } from "../../types/api";
import {
  TextInput,
  PasswordInput,
  Select,
  Button,
  Paper,
  Tabs,
  Text,
  Title,
  Group,
  Stack,
  Alert,
  SimpleGrid,
  Divider,
  Modal,
  Box,
} from "@mantine/core";

function resolvePhotoUrl(p: string | undefined | null): string {
  if (!p) return "";
  if (p.startsWith("http") || p.startsWith("data:")) return p;
  return "/" + p.replace(/^\//, "");
}

export default function InfosProfil() {
  const { t, lang, setLanguage } = useI18n();
  const { user, updateUser, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<string | null>("personal");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    ville: "",
    date_naissance: "",
    lieu_naissance: "",
    currency: "XAF",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const [pwForm, setPwForm] = useState({ current: "", new: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      nom: user.nom || "",
      prenom: user.prenom || "",
      email: user.email || "",
      telephone: user.telephone || "",
      ville: user.ville || "",
      date_naissance: user.date_naissance || "",
      lieu_naissance: user.lieu_naissance || "",
      currency: user.currency || "XAF",
    });
    if (user.photo_url) {
      setPhotoPreview(resolvePhotoUrl(user.photo_url));
    }
  }, [user]);

  const isIncomplete = (() => {
    const req = [form.telephone, form.ville, form.date_naissance, form.lieu_naissance];
    return req.some((v) => !v || String(v).trim() === "");
  })();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ ok: false, msg: t("profil_photo_too_large") });
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!form.nom.trim() || !form.prenom.trim()) {
      setFeedback({ ok: false, msg: t("profil_firstname_required") });
      return;
    }

    const validDate =
      form.date_naissance && !isNaN(new Date(form.date_naissance).getTime())
        ? form.date_naissance
        : "";

    setSaving(true);
    try {
      let body: FormData | Partial<UserProfile>;

      if (photoFile) {
        const fd = new FormData();
        fd.append("nom", form.nom.trim());
        fd.append("prenom", form.prenom.trim());
        fd.append("telephone", form.telephone.trim());
        fd.append("ville", form.ville.trim());
        if (validDate) fd.append("date_naissance", validDate);
        fd.append("lieu_naissance", form.lieu_naissance.trim());
        fd.append("currency", form.currency);
        fd.append("photo_profile", photoFile);
        body = fd;
      } else {
        body = {
          nom: form.nom.trim(),
          prenom: form.prenom.trim(),
          telephone: form.telephone.trim(),
          ville: form.ville.trim(),
          ...(validDate ? { date_naissance: validDate } : {}),
          lieu_naissance: form.lieu_naissance.trim(),
          currency: form.currency,
        };
      }

      const result = await authService.updateProfile(body);

      if (result.user) {
        updateUser(result.user);
        setPhotoFile(null);
        if (result.user.photo_url) {
          setPhotoPreview(resolvePhotoUrl(result.user.photo_url));
        }
        setFeedback({ ok: true, msg: t("profil_update_success") });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        setFeedback({ ok: false, msg: t("profil_update_error") });
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        t("profil_network_error");
      setFeedback({ ok: false, msg });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (pwForm.new.length < 6) {
      setFeedback({ ok: false, msg: t("profil_password_length") });
      return;
    }
    if (pwForm.new !== pwForm.confirm) {
      setFeedback({ ok: false, msg: t("profil_password_mismatch") });
      return;
    }

    setPwSaving(true);
    try {
      const result = await authService.changePassword(pwForm.current, pwForm.new);
      if (result.success) {
        setPwForm({ current: "", new: "", confirm: "" });
        setFeedback({ ok: true, msg: t("profil_password_success") });
      } else {
        setFeedback({ ok: false, msg: result.message || t("profil_password_change_error") });
      }
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      const msg = err?.response?.data?.error || t("profil_password_change_error");
      setFeedback({ ok: false, msg });
    } finally {
      setPwSaving(false);
    }
  };

  const initials = user?.initial || "DM";

  return (
    <div className="flex flex-col h-screen">
      <Topbar
        title={t("profil_title")}
        breadcrumbs={[
          { label: t("profil_breadcrumb_home"), href: "/dashboard" },
          { label: t("profil_breadcrumb_profile") },
        ]}
      />

      <div className="flex-1 overflow-hidden p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-full w-full">

          {/* Left Column - Main Form */}
          <div className="overflow-y-auto space-y-5">
            {feedback && (
              <Alert
                color={feedback.ok ? "green" : "red"}
                icon={feedback.ok ? <i className="fa-solid fa-check" /> : <i className="fa-solid fa-triangle-exclamation" />}
                radius="md"
                variant="light"
              >
                {feedback.msg}
              </Alert>
            )}

            <Paper radius="lg" withBorder>
              <Tabs value={tab} onChange={setTab}>
                <Tabs.List grow>
                  <Tabs.Tab value="personal">
                    <Group gap={6} justify="center">
                      <i className="fa-solid fa-user-gear text-sm" />
                      {t("profil_tab_personal")}
                    </Group>
                  </Tabs.Tab>
                  <Tabs.Tab value="preferences">
                    <Group gap={6} justify="center">
                      <i className="fa-solid fa-sliders text-sm" />
                      {t("profil_tab_preferences")}
                    </Group>
                  </Tabs.Tab>
                </Tabs.List>

                <Box p="md">
                  <form onSubmit={handleSave}>
                    <Tabs.Panel value="personal">
                      <Stack gap="md">
                        <Group align="center" gap="md" pb="md" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
                          <Box style={{ position: "relative" }}>
                            <VipAvatar isVip={isVipUser(user)}>
                              <div className="w-24 h-24 rounded-2xl bg-primary-light flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                {photoPreview ? (
                                  <img src={photoPreview} className="w-full h-full object-cover" alt={t("profil_photo_alt")} />
                                ) : (
                                  <span className="text-2xl font-bold text-primary">{initials}</span>
                                )}
                              </div>
                            </VipAvatar>
                            <label
                              htmlFor="photo-input"
                              className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-lg shadow-md border border-borda flex items-center justify-center cursor-pointer hover:bg-surface-2 transition-colors"
                            >
                              <i className="fa-solid fa-camera text-[13px] text-textMuted" />
                              <input
                                ref={photoInputRef}
                                id="photo-input"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoChange}
                              />
                            </label>
                          </Box>
                          <div>
                            <Text fw={700} size="sm">{t("profil_photo_alt")}</Text>
                            <Text size="xs" c="dimmed">{t("profil_photo_hint")}</Text>
                          </div>
                        </Group>

                        <SimpleGrid cols={{ base: 1, md: 2 }}>
                          <TextInput
                            label={t("profil_label_firstname")}
                            placeholder={t("profil_placeholder_firstname")}
                            value={form.prenom}
                            onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                            required
                            radius="xl"
                            size="sm"
                          />
                          <TextInput
                            label={t("profil_label_lastname")}
                            placeholder={t("profil_placeholder_lastname")}
                            value={form.nom}
                            onChange={(e) => setForm({ ...form, nom: e.target.value })}
                            required
                            radius="xl"
                            size="sm"
                          />
                          <TextInput
                            label={t("profil_label_email")}
                            value={form.email}
                            readOnly
                            radius="xl"
                            size="sm"
                            style={{ backgroundColor: "#F4EFE6", cursor: "not-allowed" }}
                          />
                          <TextInput
                            label={t("profil_label_city")}
                            placeholder={t("profil_placeholder_city")}
                            value={form.ville}
                            onChange={(e) => setForm({ ...form, ville: e.target.value })}
                            radius="xl"
                            size="sm"
                          />
                          <TextInput
                            label={t("profil_label_phone")}
                            placeholder={t("profil_placeholder_phone")}
                            value={form.telephone}
                            onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                            radius="xl"
                            size="sm"
                          />
                        </SimpleGrid>
                      </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="preferences">
                      <Stack gap="md">
                        <SimpleGrid cols={{ base: 1, md: 2 }}>
                          <div>
                            <Text size="xs" fw={700} c="dimmed" tt="uppercase" spacing="xs" mb={6}>
                              {t("profil_label_birthdate")}
                            </Text>
                            <DatePicker
                              value={form.date_naissance}
                              onChange={(v) => setForm({ ...form, date_naissance: v })}
                              className="w-full"
                              placeholder={t("profil_placeholder_date")}
                            />
                          </div>
                          <TextInput
                            label={t("profil_label_birthplace")}
                            placeholder={t("profil_placeholder_region")}
                            value={form.lieu_naissance}
                            onChange={(e) => setForm({ ...form, lieu_naissance: e.target.value })}
                            radius="xl"
                            size="sm"
                          />
                          <Select
                            label={t("profil_label_currency")}
                            value={form.currency}
                            onChange={(val) => setForm({ ...form, currency: val || "XAF" })}
                            data={[
                              { value: "XAF", label: t("profil_currency_xaf") },
                              { value: "EUR", label: t("profil_currency_eur") },
                              { value: "USD", label: t("profil_currency_usd") },
                            ]}
                            radius="xl"
                            size="sm"
                            searchable
                            clearable={false}
                          />
                          <Select
                            label={t("profil_label_language")}
                            value={lang}
                            onChange={(val) => val && setLanguage(val)}
                            data={[
                              { value: "fr", label: "Français" },
                              { value: "en", label: "English" },
                            ]}
                            radius="xl"
                            size="sm"
                            searchable
                            clearable={false}
                          />
                        </SimpleGrid>
                      </Stack>
                    </Tabs.Panel>

                    <Group justify="flex-end" pt="md" mt="md" style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}>
                      <Button
                        type="submit"
                        loading={saving}
                        leftSection={<i className="fa-solid fa-floppy-disk" />}
                        radius="xl"
                        size="md"
                        style={{ backgroundColor: "#1E3A2F" }}
                      >
                        {t("profil_save")}
                      </Button>
                    </Group>
                  </form>
                </Box>
              </Tabs>
            </Paper>

            {isIncomplete && (
              <Alert color="blue" icon={<i className="fa-solid fa-circle-info" />} radius="md" variant="light">
                <Text fw={700} size="sm">{t("profil_completion_title")}</Text>
                <Text size="xs" c="dimmed">{t("profil_completion_desc")}</Text>
              </Alert>
            )}
          </div>

          {/* Right Column - Side Content */}
          <div className="overflow-y-auto space-y-5">

          <Paper radius="lg" withBorder p="md">
            <Title order={5} mb="md">
              <Group gap={8}>
                <i className="fa-solid fa-lock text-primary" />
                {t("profil_change_password")}
              </Group>
            </Title>
            <form onSubmit={handleChangePw}>
              <Stack gap="sm" maw={400}>
                <PasswordInput
                  label={t("profil_current_password")}
                  value={pwForm.current}
                  onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                  required
                  minLength={4}
                  radius="xl"
                  size="sm"
                />
                <PasswordInput
                  label={t("profil_new_password")}
                  value={pwForm.new}
                  onChange={(e) => setPwForm({ ...pwForm, new: e.target.value })}
                  required
                  minLength={6}
                  radius="xl"
                  size="sm"
                />
                <PasswordInput
                  label={t("profil_confirm_password")}
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  required
                  minLength={6}
                  radius="xl"
                  size="sm"
                />
                <Button
                  type="submit"
                  loading={pwSaving}
                  leftSection={<i className="fa-solid fa-lock" />}
                  radius="xl"
                  size="md"
                  color="green"
                  variant="filled"
                >
                  {t("profil_update_password")}
                </Button>
              </Stack>
            </form>
          </Paper>

          {/* Subscription Status */}
          <Paper radius="lg" withBorder p="md">
            <Group justify="space-between" mb="md">
              <Title order={5}>
                <Group gap={8}>
                  <i className="fa-solid fa-crown text-primary" />
                  {t("profil_subscription_status")}
                </Group>
              </Title>
              <Text
                component="a"
                href="/abonnement"
                size="xs"
                fw={700}
                c="primary"
                style={{ textDecoration: "none" }}
              >
                {t("profil_manage_subscription")} <i className="fa-solid fa-arrow-right text-[10px]" />
              </Text>
            </Group>
            {user?.subscription ? (
              <Paper bg="gray.0" p="md" radius="lg" withBorder>
                <Group gap="md" mb="sm">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    user.subscription.status === "active" ? "bg-green-light" : "bg-red-50"
                  }`}>
                    <i className={`fa-solid ${
                      user.subscription.status === "active" ? "fa-check-circle text-green-mid" : "fa-clock text-red-400"
                    }`} />
                  </div>
                  <div>
                    <Text fw={700} size="sm">{user.subscription.plan_name}</Text>
                    <Text size="xs" fw={600} c={user.subscription.status === "active" ? "green" : "red"}>
                      {user.subscription.status === "active" ? t("profil_sub_active") : t("profil_sub_expired")}
                    </Text>
                  </div>
                </Group>
                {user.subscription.expiry_date && (
                  <Group gap={6}>
                    <i className="fa-regular fa-calendar text-primary text-xs" />
                    <Text size="xs" c="dimmed">
                      {t("profil_sub_expires")} {new Date(user.subscription.expiry_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </Text>
                  </Group>
                )}
              </Paper>
            ) : (
              <Paper bg="gray.0" p="md" radius="lg" withBorder ta="center">
                <i className="fa-solid fa-user text-2xl text-textMuted/30 mb-2 block" />
                <Text size="sm" c="dimmed">{t("profil_no_subscription")}</Text>
                <Text
                  component="a"
                  href="/abonnement"
                  size="xs"
                  fw={700}
                  c="primary"
                  mt="sm"
                  inline
                  style={{ textDecoration: "none" }}
                >
                  {t("profil_discover_plans")} <i className="fa-solid fa-arrow-right text-[10px]" />
                </Text>
              </Paper>
            )}
          </Paper>

          {/* Danger Zone */}
          <Paper radius="lg" p="md" mt="md" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
            <Title order={5} mb="xs" c="red.7">
              <Group gap={8}>
                <i className="fa-solid fa-triangle-exclamation" />
                {t("profil_danger_zone_title")}
              </Group>
            </Title>
            <Text size="sm" c="red.6" mb="md">
              {t("profil_danger_zone_desc")}
            </Text>
            <Button
              color="red"
              leftSection={<i className="fa-solid fa-trash-can" />}
              radius="xl"
              size="md"
              onClick={() => setShowDeleteConfirm(true)}
            >
              {t("profil_delete_account")}
            </Button>
          </Paper>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      <Modal
        opened={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        centered
        radius="xl"
        size="sm"
        padding="xl"
        title={
          <Stack align="center" gap="md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-triangle-exclamation text-red-600 text-3xl" />
            </div>
            <div>
              <Title order={4} ta="center">{t("profil_delete_confirm_title")}</Title>
              <Text size="sm" c="dimmed" ta="center" mt={4}>{t("profil_delete_confirm_desc")}</Text>
            </div>
          </Stack>
        }
      >
        <Stack gap="sm">
          <Button
            color="red"
            fullWidth
            size="md"
            radius="xl"
            loading={deletingAccount}
            leftSection={deletingAccount ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-trash-can" />}
            onClick={async () => {
              setDeletingAccount(true);
              const result = await deleteAccount();
              setDeletingAccount(false);
              setShowDeleteConfirm(false);
              if (result.success) {
                navigate("/login", { replace: true });
              }
            }}
          >
            {t("profil_delete_confirm_yes")}
          </Button>
          <Button
            variant="default"
            fullWidth
            size="md"
            radius="xl"
            disabled={deletingAccount}
            onClick={() => setShowDeleteConfirm(false)}
          >
            {t("profil_delete_confirm_cancel")}
          </Button>
        </Stack>
      </Modal>
    </div>
  );
}
