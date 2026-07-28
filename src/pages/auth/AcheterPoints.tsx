import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../context/I18nContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Topbar from "../../layout/Topbar";
import PaymentModal from "../../components/modals/PaymentModal";
import apiClient from "../../services/api";
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  SimpleGrid,
  Loader,
  Badge,
  Card,
  ThemeIcon,
  Box,
  Button,
  Container,
  Divider,
  MantineColor,
} from "@mantine/core";

const PACKS = [
  { points: 500, label: "Pack Découverte", badge: "Débutant" },
  { points: 1000, label: "Pack Standard", badge: "Populaire" },
  { points: 1500, label: "Pack Premium", badge: "Recommandé" },
  { points: 5000, label: "Pack Supérieur", badge: "Meilleur rapport" },
  { points: 10000, label: "Pack Expert", badge: "Max de points" },
];

const PACK_COLORS: MantineColor[] = ["violet", "pink", "blue", "teal", "orange"];
const PACK_ICONS = ["fa-seedling", "fa-star", "fa-gem", "fa-crown", "fa-rocket"];

export default function AcheterPoints() {
  const { t } = useI18n();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [rate, setRate] = useState(10);
  const [selectedPack, setSelectedPack] = useState<number | null>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState("");
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);
  const [pollingElapsed, setPollingElapsed] = useState(0);
  const [paySuccess, setPaySuccess] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    apiClient
      .get("points/rate")
      .then((res: any) => {
        if (res.data?.rate) setRate(res.data.rate);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const openPayModal = (points: number) => {
    setSelectedPack(points);
    setPayError("");
    setPollingStatus(null);
    setPollingElapsed(0);
    setPaySuccess(false);
    setPayModalOpen(true);
  };

  const closePayModal = () => {
    setPayModalOpen(false);
    setSelectedPack(null);
    setPayError("");
    setPollingStatus(null);
    if (pollingRef.current) clearInterval(pollingRef.current);
  };

  const startPolling = () => {
    const startedAt = Date.now();
    pollingRef.current = setInterval(async () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setPollingElapsed(elapsed);

      try {
        const profileRes = await apiClient.get("/api/auth/profile");
        const newPoints = profileRes.data?.points ?? profileRes.data?.data?.points ?? 0;
        const oldPoints = user?.points ?? 0;
        if (newPoints > oldPoints) {
          clearInterval(pollingRef.current!);
          setPollingStatus(null);
          setPaySuccess(true);
          updateUser(profileRes.data.data || profileRes.data);
          return;
        }
        if (elapsed > 120) {
          setPollingStatus("Le paiement est en cours de traitement. Vous recevrez vos points sous peu.");
        } else if (elapsed > 60) {
          setPollingStatus("Confirmation en cours... Cette opération peut prendre jusqu'à 2 minutes.");
        } else {
          setPollingStatus("Paiement en attente de confirmation...");
        }
      } catch {}
    }, 5000);
    setTimeout(() => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }, 300000);
  };

  const handlePay = async (method: "orange" | "mtn" | "points", phone: string) => {
    setProcessing(true);
    setPayError("");

    if (method === "points") {
      setProcessing(false);
      setPayError("L'achat de points avec des points n'est pas possible. Veuillez utiliser Orange Money ou MTN MoMo.");
      return;
    }

    try {
      const paymentMethod = method === "orange" ? "ORANGE_MONEY" : "MTN_MOMO";
      const res = await apiClient.post("points/purchase", {
        pointsAmount: selectedPack,
        phone,
        method: paymentMethod,
      });
      setProcessing(false);

      if (!res.data) {
        setPayError("Aucune réponse du serveur. Veuillez réessayer.");
        return;
      }

      if (res.data.success && res.data.data?.transactionId) {
        toast.success("Paiement initié ! Confirmez la transaction sur votre téléphone.");
        startPolling();
      } else if (res.data.message) {
        setPayError(res.data.message);
      } else {
        setPayError("Erreur lors de l'initialisation du paiement. Veuillez réessayer.");
      }
    } catch (e: any) {
      setProcessing(false);
      const msg =
        e.response?.data?.message ||
        e.response?.data?.error ||
        e.message ||
        "Erreur de connexion. Veuillez vérifier votre réseau et réessayer.";
      setPayError(msg);
    }
  };

  const xafAmount = selectedPack ? Math.ceil(selectedPack / rate) : 0;

  // --- Écran de statut (polling / succès) ---
  if (pollingStatus || paySuccess) {
    return (
      <Box style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%" }}>
        <Topbar title="Achat de points" />
        <Box
          className="custom-scroll"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflowY: "auto",
            padding: "1.5rem",
          }}
        >
          {paySuccess ? (
            <Stack align="center" gap="lg" maw={380} ta="center">
              <ThemeIcon size={80} radius={40} variant="light" color="green">
                <i className="fa-solid fa-check" style={{ fontSize: 30 }} />
              </ThemeIcon>
              <Title order={2} className="font-bricolage">
                Achat réussi !
              </Title>
              <Text c="dimmed">
                <Text component="span" fw={800} c="primary" size="xl">
                  {selectedPack?.toLocaleString("fr-FR")}
                </Text>{" "}
                points ont été crédités sur votre compte.
              </Text>
              <Button
                size="md"
                radius="xl"
                color="primary"
                mt="sm"
                className="font-bricolage"
                onClick={() => navigate("/mes-gains")}
              >
                Voir mes gains
              </Button>
            </Stack>
          ) : (
            <Stack align="center" gap="md" ta="center">
              <Loader size="lg" color="primary" />
              <Text size="lg" fw={600}>
                {pollingStatus}
              </Text>
              {pollingElapsed > 0 && (
                <Text size="sm" c="dimmed">
                  Temps écoulé : {pollingElapsed}s
                </Text>
              )}
            </Stack>
          )}
        </Box>
      </Box>
    );
  }

  // --- Écran principal ---
  return (
    <Box style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100%" }}>
      <Topbar
        title="Acheter des points"
        breadcrumbs={[
          { label: t("mesgains_breadcrumb_home"), href: "/dashboard" },
          { label: "Acheter des points" },
        ]}
      />

      <Box
        className="custom-scroll"
        style={{ flex: 1, overflowY: "auto" }}
        p={{ base: "md", sm: "lg" }}
        pb={96}
      >
        <Container size="lg" px={0}>
          <Stack gap="lg">
            {/* Hero - Solde de points */}
            <Paper
              p="xl"
              radius="lg"
              style={{
                background: "linear-gradient(135deg, #1E3A2F 0%, #2D5A42 55%, #3B7A58 100%)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <Box
                style={{
                  position: "absolute",
                  width: 300,
                  height: 300,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.04)",
                  top: -100,
                  right: -80,
                  pointerEvents: "none",
                }}
              />
              <Box
                style={{
                  position: "absolute",
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  background: "var(--mantine-color-primary-light)",
                  opacity: 0.15,
                  bottom: -70,
                  left: -50,
                  pointerEvents: "none",
                }}
              />

              <Group justify="space-between" align="flex-start" style={{ position: "relative", zIndex: 1 }}>
                <div>
                  <Text size="xs" fw={600} tt="uppercase" c="white" opacity={0.65} style={{ letterSpacing: 1.5 }}>
                    Solde actuel
                  </Text>
                  <Group gap={8} mt={4} align="baseline">
                    <Text fw={800} className="font-bricolage" fz={32} lh={1} c="white">
                      {(user?.points ?? 0).toLocaleString("fr-FR")}
                    </Text>
                    <Text c="white" opacity={0.7} fw={600} size="sm">
                      pts
                    </Text>
                  </Group>
                </div>
                <ThemeIcon
                  size={56}
                  radius="lg"
                  variant="white"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                >
                  <i className="fa-solid fa-sack-dollar" style={{ fontSize: 20 }} />
                </ThemeIcon>
              </Group>

              <Text size="sm" c="white" opacity={0.8} mt="md" style={{ position: "relative", zIndex: 1 }}>
                {rate} points = 1 XAF
              </Text>
            </Paper>

            {/* Grille des packs */}
            <div>
              <Title order={3} className="font-bricolage" mb={4}>
                Choisissez un pack
              </Title>
              <Text size="sm" c="dimmed" mb="md">
                Sélectionnez le nombre de points que vous souhaitez acheter
              </Text>

              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="md">
                {PACKS.map((pack, index) => {
                  const xaf = Math.ceil(pack.points / rate);
                  const color = PACK_COLORS[index];
                  return (
                    <Card
                      key={pack.points}
                      radius="lg"
                      padding="lg"
                      withBorder
                      className="transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                      style={{ cursor: "pointer" }}
                      onClick={() => openPayModal(pack.points)}
                    >
                      <Card.Section
                        p="lg"
                        style={{
                          background: `linear-gradient(135deg, var(--mantine-color-${color}-6), var(--mantine-color-${color}-8))`,
                        }}
                      >
                        <Group justify="space-between" align="flex-start">
                          <ThemeIcon
                            size={40}
                            radius="md"
                            variant="white"
                            style={{ background: "rgba(255,255,255,0.2)" }}
                          >
                            <i className={`fa-solid ${PACK_ICONS[index]}`} style={{ color: "white" }} />
                          </ThemeIcon>
                          <Badge
                            variant="white"
                            size="sm"
                            style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                          >
                            {pack.badge}
                          </Badge>
                        </Group>
                        <Text fw={800} className="font-bricolage" fz={28} lh={1} c="white" mt="md">
                          {pack.points.toLocaleString("fr-FR")}
                        </Text>
                        <Text size="xs" c="white" opacity={0.75}>
                          points
                        </Text>
                      </Card.Section>

                      <Group justify="space-between" mt="md">
                        <div>
                          <Text fw={600} size="sm">
                            {pack.label}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {xaf.toLocaleString("fr-FR")} XAF
                          </Text>
                        </div>
                        <ThemeIcon size={28} radius="xl" variant="light" color={color}>
                          <i className="fa-solid fa-arrow-right" style={{ fontSize: 11 }} />
                        </ThemeIcon>
                      </Group>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </div>

            {/* Info méthodes de paiement */}
            <Card radius="lg" padding="lg" withBorder>
              <Group gap="sm" mb="md">
                <ThemeIcon size={36} radius="md" variant="light" color="primary">
                  <i className="fa-solid fa-shield-halved" style={{ fontSize: 14 }} />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="sm">
                    Paiement sécurisé
                  </Text>
                  <Text size="xs" c="dimmed">
                    Via Orange Money ou MTN MoMo
                  </Text>
                </div>
              </Group>

              <Divider mb="md" />

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                <Paper p="sm" radius="md" bg="orange.0">
                  <Group gap="sm">
                    <ThemeIcon size={32} radius="md" color="orange">
                      <Text fw={800} size="xs">
                        O
                      </Text>
                    </ThemeIcon>
                    <Text size="sm" fw={600}>
                      Orange Money
                    </Text>
                  </Group>
                </Paper>
                <Paper p="sm" radius="md" bg="yellow.0">
                  <Group gap="sm">
                    <ThemeIcon size={32} radius="md" color="yellow">
                      <Text fw={800} size="xs">
                        M
                      </Text>
                    </ThemeIcon>
                    <Text size="sm" fw={600}>
                      MTN MoMo
                    </Text>
                  </Group>
                </Paper>
              </SimpleGrid>
            </Card>
          </Stack>
        </Container>
      </Box>

      <PaymentModal
        isOpen={payModalOpen}
        onClose={closePayModal}
        onPay={handlePay}
        amount={xafAmount}
        title="Achat de points"
        description={`Pack de ${selectedPack?.toLocaleString("fr-FR")} points`}
        processing={processing}
        error={payError}
      />
    </Box>
  );
}