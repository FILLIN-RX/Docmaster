import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Steps,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import {
  CameraOutlined,
  CheckCircleOutlined,
  ContactsOutlined,
  EnvironmentOutlined,
  FileProtectOutlined,
  PhoneOutlined,
  TagOutlined,
  UserOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { documentTypesService } from "../../services/declarationsService";
import type { DocTypeCatalog } from "../../types/api";
import { partenairesService } from "../../services/partenairesService";
import AntdLocationSelect from "../../components/ui/AntdLocationSelect";
import OsmStreetSearch from "../../components/ui/OsmStreetSearch";
import { partenairePalette } from "../../theme/partenaires";

interface LocationValue {
  region: string;
  department: string;
  arrondissement: string;
}

const inputCls = "w-full";

export default function DeclarerTrouvaille() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [docTypes, setDocTypes] = useState<DocTypeCatalog[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [autreType, setAutreType] = useState("");

  const [ownerName, setOwnerName] = useState("");
  const [docNum, setDocNum] = useState("");
  const [etat, setEtat] = useState("bon");
  const [details, setDetails] = useState("");

  const [location, setLocation] = useState<LocationValue>({ region: "", department: "", arrondissement: "" });
  const [rue, setRue] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [dateFound, setDateFound] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dateExpiration, setDateExpiration] = useState<string>("");

  const [fileRecto, setFileRecto] = useState<File | null>(null);
  const [fileVerso, setFileVerso] = useState<File | null>(null);
  const [previewRecto, setPreviewRecto] = useState<string | null>(null);
  const [previewVerso, setPreviewVerso] = useState<string | null>(null);

  const [contactTel, setContactTel] = useState("");
  const [contactMode, setContactMode] = useState("PHONE");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  useEffect(() => {
    documentTypesService.getActive().then((res) => {
      if (res.success && Array.isArray(res.data)) setDocTypes(res.data as DocTypeCatalog[]);
    });
  }, []);

  const selectedDoc = docTypes.find((d) => d.id === selectedType);

  const nextStep = () => {
    if (step === 0 && !selectedType) {
      message.warning("Sélectionnez d'abord le type de document.");
      return;
    }
    if (step === 1 && ownerName.trim().length < 2) {
      message.warning("Entrez le nom du propriétaire (au moins 2 caractères).");
      return;
    }
    if (step === 2) {
      if (!location.department) {
        message.warning("Sélectionnez la ville (département).");
        return;
      }
      if (dateFound && new Date(dateFound) > new Date()) {
        message.warning("La date de trouvaille ne peut pas être dans le futur.");
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleFileSelect = (
    file: File | null,
    setFile: (f: File | null) => void,
    setPreview: (s: string | null) => void
  ) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      message.error("Veuillez choisir une image.");
      return;
    }
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const submitDeclaration = async () => {
    if (!consent) {
      message.warning("Veuillez certifier l'exactitude des informations.");
      return;
    }
    if (!selectedType) {
      message.warning("Sélectionnez le type de document.");
      return;
    }
    if (!ownerName) {
      message.warning("Entrez le nom du propriétaire.");
      return;
    }
    if (!location.department) {
      message.warning("Sélectionnez la ville.");
      return;
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("doc_type", selectedType);
    formData.append("owner_name", ownerName);
    if (docNum.trim()) formData.append("document_number", docNum.trim());
    formData.append("etat_physique", etat);
    formData.append("ville", (location.arrondissement || location.department) || "");
    if (location.region) formData.append("region", location.region);
    if (location.department) formData.append("department", location.department);
    if (location.arrondissement) formData.append("arrondissement", location.arrondissement);
    formData.append("pays", "Cameroun");
    formData.append("date_perte", dateFound);
    if (dateExpiration) formData.append("date_expiration", dateExpiration);
    formData.append("mode_contact", contactMode);
    if (contactTel.trim()) formData.append("telephone_contact", contactTel.trim());
    if (details.trim()) formData.append("description", details.trim());
    if (rue.trim()) formData.append("quartier", rue.trim());
    if (coords) formData.append("found_location", JSON.stringify({ lat: coords.lat, lon: coords.lon }));
    if (autreType.trim()) {
      formData.append("metadata", JSON.stringify({ autre_type: autreType.trim() }));
    }
    if (fileRecto) formData.append("photo_recto", fileRecto);
    if (fileVerso) formData.append("photo_verso", fileVerso);

    try {
      const res = await partenairesService.createDeclaration(formData);
      setSuccessRef(res.data?.data?.identifiant_doc_dm || null);
      message.success("Déclaration de trouvaille enregistrée");
    } catch (err: any) {
      const errors = err?.response?.data?.errors;
      if (errors && typeof errors === "object") {
        const first = Object.values(errors)[0];
        message.error(Array.isArray(first) ? (first[0] as string) : String(first));
      } else {
        message.error(err?.response?.data?.message || "Impossible d'enregistrer la déclaration.");
      }
      setSubmitting(false);
    }
  };

  if (successRef !== null) {
    return (
      <div style={{ maxWidth: 560, margin: "40px auto" }}>
        <Card
          style={{ borderRadius: 10, border: `1px solid ${partenairePalette.border}`, textAlign: "center" }}
          styles={{ body: { padding: 32 } }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: partenairePalette.greenLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <CheckCircleOutlined style={{ color: partenairePalette.success, fontSize: 26 }} />
          </div>
          <Typography.Title level={4} style={{ marginBottom: 4 }}>
            Déclaration publiée
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
            Votre déclaration de trouvaille a été enregistrée avec succès.
          </Typography.Paragraph>
          <div
            style={{
              background: partenairePalette.bgMain,
              border: `1px solid ${partenairePalette.border}`,
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 20,
              textAlign: "left",
            }}
          >
            <Typography.Text style={{ fontSize: 11, color: partenairePalette.textMuted, display: "block", textTransform: "uppercase", fontWeight: 600 }}>
              Référence de la déclaration
            </Typography.Text>
            <Space>
              <Typography.Text strong style={{ fontSize: 18, letterSpacing: 1 }}>
                {successRef || "—"}
              </Typography.Text>
              {successRef && (
                <Button
                  size="small"
                  type="text"
                  icon={<i className="fa-solid fa-copy" />}
                  onClick={() => navigator.clipboard.writeText(successRef)}
                />
              )}
            </Space>
          </div>
          <div style={{ padding: "12px 16px", background: "#fff7e6", border: "1px solid #ffd591", borderRadius: 8, textAlign: "left", marginBottom: 24 }}>
            <Typography.Text style={{ fontSize: 12, color: "#d46b08" }}>
              <i className="fa-solid fa-wallet" style={{ marginRight: 8 }} />
              La récompense financière sera créditée sur votre portefeuille.
            </Typography.Text>
          </div>
          <Space>
            <Button
              onClick={() => {
                window.location.reload();
              }}
            >
              Nouvelle déclaration
            </Button>
            <Button type="primary" onClick={() => navigate("/partenaire/declarations")}>
              Voir mes déclarations
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card
        style={{ marginBottom: 16, borderRadius: 10, border: `1px solid ${partenairePalette.border}` }}
        styles={{ body: { padding: 16 } }}
      >
        <Steps
          current={step}
          size="small"
          items={[
            { title: "Type", icon: <TagOutlined /> },
            { title: "Informations", icon: <UserOutlined /> },
            { title: "Localisation", icon: <EnvironmentOutlined /> },
            { title: "Photos", icon: <CameraOutlined /> },
            { title: "Contact", icon: <ContactsOutlined /> },
          ]}
        />
      </Card>

      {/* Étape 1 — Type de document */}
      {step === 0 && (
        <Card style={{ borderRadius: 10, border: `1px solid ${partenairePalette.border}` }}>
          <Typography.Title level={5}>
            <TagOutlined style={{ color: partenairePalette.primary, marginRight: 8 }} />
            Quel type de document avez-vous trouvé ?
          </Typography.Title>
          {docTypes.length === 0 ? (
            <Empty description="Aucun type de document disponible" />
          ) : (
            <Row gutter={[12, 12]}>
              {docTypes.map((d) => (
                <Col xs={12} sm={8} md={6} key={d.id}>
                  <div
                    onClick={() => {
                      setSelectedType(d.id);
                      setAutreType("");
                    }}
                    style={{
                      border: `2px solid ${selectedType === d.id ? partenairePalette.primary : partenairePalette.border}`,
                      background: selectedType === d.id ? partenairePalette.primaryLight : "#fff",
                      borderRadius: 10,
                      padding: "12px 8px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all .2s",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: selectedType === d.id ? partenairePalette.primary : partenairePalette.greenLight,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 8px",
                      }}
                    >
                      <i className={`fa-solid fa-${d.icone || "file-lines"}`} style={{ color: selectedType === d.id ? "#fff" : partenairePalette.primary, fontSize: 16 }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: partenairePalette.textMain }}>{d.nom}</div>
                    {(d.delai_expiration_mois ?? 0) > 0 ? (
                      <Tag color="orange" style={{ fontSize: 10, marginTop: 6 }}>
                        A expiration
                      </Tag>
                    ) : (
                      <Tag color="green" style={{ fontSize: 10, marginTop: 6 }}>
                        Sans expiration
                      </Tag>
                    )}
                  </div>
                </Col>
              ))}
            </Row>
          )}
          {selectedType === "autre" && (
            <Input
              style={{ marginTop: 16 }}
              placeholder="Précisez le type de document"
              value={autreType}
              onChange={(e) => setAutreType(e.target.value)}
            />
          )}
          <Button type="primary" block style={{ marginTop: 24, height: 40 }} onClick={nextStep} disabled={!selectedType}>
            Continuer <i className="fa-solid fa-arrow-right ml-1" style={{ fontSize: 11 }} />
          </Button>
        </Card>
      )}

      {/* Étape 2 — Informations */}
      {step === 1 && (
        <Card style={{ borderRadius: 10, border: `1px solid ${partenairePalette.border}` }}>
          <Typography.Title level={5}>
            <UserOutlined style={{ color: partenairePalette.primary, marginRight: 8 }} />
            Informations sur le document
          </Typography.Title>
          <Form layout="vertical" requiredMark={false}>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Nom du propriétaire (si lisible)">
                  <Input
                    placeholder="Nom complet figurant sur le document"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Numéro du document (si visible)">
                  <Input placeholder="N° de document" value={docNum} onChange={(e) => setDocNum(e.target.value)} />
                </Form.Item>
              </Col>
            </Row>

            {selectedDoc && (selectedDoc.delai_expiration_mois ?? 0) > 0 && (
              <Form.Item label="Date d'expiration (si visible)">
                <Input type="date" value={dateExpiration} onChange={(e) => setDateExpiration(e.target.value)} />
              </Form.Item>
            )}

            <Form.Item label="État physique du document">
              <Radio.Group value={etat} onChange={(e) => setEtat(e.target.value)}>
                <Space wrap>
                  <Radio.Button value="bon">
                    <i className="fa-solid fa-circle-check" style={{ color: "#16a34a", marginRight: 6 }} />
                    Bon état
                  </Radio.Button>
                  <Radio.Button value="moyen">
                    <i className="fa-solid fa-triangle-exclamation" style={{ color: "#f59e0b", marginRight: 6 }} />
                    État moyen
                  </Radio.Button>
                  <Radio.Button value="abime">
                    <i className="fa-solid fa-circle-xmark" style={{ color: "#ef4444", marginRight: 6 }} />
                    Abîmé
                  </Radio.Button>
                </Space>
              </Radio.Group>
            </Form.Item>

            <Form.Item label="Détails utiles">
              <Input.TextArea
                rows={2}
                placeholder="Couleur, particularités, autres informations..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </Form.Item>
          </Form>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Button onClick={() => setStep(0)}>Retour</Button>
            <Button type="primary" onClick={nextStep}>
              Continuer <i className="fa-solid fa-arrow-right ml-1" style={{ fontSize: 11 }} />
            </Button>
          </Space>
        </Card>
      )}

      {/* Étape 3 — Localisation */}
      {step === 2 && (
        <Card style={{ borderRadius: 10, border: `1px solid ${partenairePalette.border}` }}>
          <Typography.Title level={5}>
            <EnvironmentOutlined style={{ color: partenairePalette.primary, marginRight: 8 }} />
            Où le document a-t-il été trouvé ?
          </Typography.Title>
          <Form layout="vertical" requiredMark={false}>
            <Form.Item label="Ville / Région" required>
              <AntdLocationSelect
                value={location}
                onChange={(val) => setLocation({ ...val })}
              />
            </Form.Item>
            <Form.Item label="Rue / lieu précis">
              <OsmStreetSearch
                value={rue}
                onChange={(v) => setRue(v)}
                onCoordinates={(lat, lon) => setCoords({ lat, lon })}
                placeholder="Rechercher une rue ou un lieu (OpenStreetMap)…"
              />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Date de trouvaille" required>
                  <Input type="date" value={dateFound} onChange={(e) => setDateFound(e.target.value)} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Button onClick={() => setStep(1)}>Retour</Button>
            <Button type="primary" onClick={nextStep}>
              Continuer <i className="fa-solid fa-arrow-right ml-1" style={{ fontSize: 11 }} />
            </Button>
          </Space>
        </Card>
      )}

      {/* Étape 4 — Photos */}
      {step === 3 && (
        <Card style={{ borderRadius: 10, border: `1px solid ${partenairePalette.border}` }}>
          <Typography.Title level={5}>
            <CameraOutlined style={{ color: partenairePalette.primary, marginRight: 8 }} />
            Photos du document
          </Typography.Title>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="Photo recto">
                <Upload
                  beforeUpload={(file) => {
                    handleFileSelect(file, setFileRecto, setPreviewRecto);
                    return false;
                  }}
                  maxCount={1}
                  onRemove={() => {
                    setFileRecto(null);
                    setPreviewRecto(null);
                  }}
                  fileList={fileRecto ? [{ uid: "recto", name: fileRecto.name, status: "done" } as any] : []}
                  listType="picture-card"
                  style={{ width: "100%" }}
                >
                  {!previewRecto && (
                    <div style={{ fontSize: 12, color: partenairePalette.textMuted }}>
                      <UploadOutlined style={{ fontSize: 20, display: "block", marginBottom: 6 }} />
                      Ajouter
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Photo verso (optionnel)">
                <Upload
                  beforeUpload={(file) => {
                    handleFileSelect(file, setFileVerso, setPreviewVerso);
                    return false;
                  }}
                  maxCount={1}
                  onRemove={() => {
                    setFileVerso(null);
                    setPreviewVerso(null);
                  }}
                  fileList={fileVerso ? [{ uid: "verso", name: fileVerso.name, status: "done" } as any] : []}
                  listType="picture-card"
                >
                  {!previewVerso && (
                    <div style={{ fontSize: 12, color: partenairePalette.textMuted }}>
                      <UploadOutlined style={{ fontSize: 20, display: "block", marginBottom: 6 }} />
                      Ajouter
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
          </Row>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Button onClick={() => setStep(2)}>Retour</Button>
            <Button type="primary" onClick={() => setStep(4)}>
              Continuer <i className="fa-solid fa-arrow-right ml-1" style={{ fontSize: 11 }} />
            </Button>
          </Space>
        </Card>
      )}

      {/* Étape 5 — Contact & publication */}
      {step === 4 && (
        <Card style={{ borderRadius: 10, border: `1px solid ${partenairePalette.border}` }}>
          <Typography.Title level={5}>
            <PhoneOutlined style={{ color: partenairePalette.primary, marginRight: 8 }} />
            Contact et publication
          </Typography.Title>
          <Form layout="vertical" requiredMark={false}>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Téléphone de contact">
                  <Input
                    placeholder="+237 6XX XXX XXX"
                    value={contactTel}
                    onChange={(e) => setContactTel(e.target.value)}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Mode de contact préféré">
                  <Select
                    value={contactMode}
                    onChange={setContactMode}
                    options={[
                      { value: "PHONE", label: "Par téléphone" },
                      { value: "APP_CHAT", label: "Chat dans l'application" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <div
            style={{
              background: partenairePalette.bgMain,
              border: `1px solid ${partenairePalette.border}`,
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 16,
            }}
          >
            <Typography.Text style={{ fontSize: 11, color: partenairePalette.textMuted, textTransform: "uppercase", fontWeight: 600, display: "block", marginBottom: 8 }}>
              Récapitulatif
            </Typography.Text>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Typography.Text type="secondary">Type</Typography.Text>
                <Typography.Text strong>{selectedDoc?.nom || autreType || "—"}</Typography.Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Typography.Text type="secondary">Localisation</Typography.Text>
                <Typography.Text strong>{(location.arrondissement || location.department) || "—"}</Typography.Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Typography.Text type="secondary">Date</Typography.Text>
                <Typography.Text strong>
                  {dateFound ? new Date(dateFound).toLocaleDateString("fr-FR") : "—"}
                </Typography.Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Typography.Text type="secondary">Photos</Typography.Text>
                <Typography.Text strong style={{ color: partenairePalette.success }}>
                  {[fileRecto, fileVerso].filter(Boolean).length}
                </Typography.Text>
              </div>
            </div>
          </div>

          <Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginBottom: 16 }}>
            Je certifie que les informations fournies sont exactes et que ce document a bien été trouvé.
          </Checkbox>

          <div style={{ padding: "10px 14px", background: "#fff7e6", border: "1px solid #ffd591", borderRadius: 8, fontSize: 12, color: "#d46b08", marginBottom: 20 }}>
            <FileProtectOutlined style={{ marginRight: 8 }} />
            La récompense financière (bonus de déclaration) sera créditée automatiquement sur votre portefeuille partenaire.
          </div>

          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Button onClick={() => setStep(3)} disabled={submitting}>
              Retour
            </Button>
            <Button type="primary" loading={submitting} onClick={submitDeclaration} style={{ background: partenairePalette.success, height: 40, paddingInline: 32 }}>
              {submitting ? "Publication..." : "Publier la déclaration"}
            </Button>
          </Space>
        </Card>
      )}
    </div>
  );
}