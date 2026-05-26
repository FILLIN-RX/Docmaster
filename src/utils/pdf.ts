import { jsPDF } from "jspdf";

export interface DeclarationPDFData {
  ref: string;
  date: string;
  proprietaire: string;
  pour_soi: boolean;
  documents: { label: string; nom_complet: string; numero: string; date_delivrance: string; date_expiration: string }[];
  lieu_perte: string;
  date_perte: string;
  circonstances: string;
  urgence: string;
  telephone: string;
  email: string;
  recompense: string;
}

interface DocumentPDFData {
  type_doc: string;
  numero_doc?: string;
  nom_sur_doc?: string;
  date_delivrance?: string;
  date_expiration?: string;
  nom_autorite?: string;
  photo_recto?: string;
  photo_verso?: string;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url.startsWith("http")
      ? url
      : window.location.origin + "/" + url.replace(/^\//, "");
  });
}

export async function generateDocumentPDF(
  doc: DocumentPDFData
): Promise<boolean> {
  if (!doc) return false;

  try {
    const docPdf = new jsPDF();

    docPdf.setFillColor(245, 166, 75);
    docPdf.rect(0, 0, 210, 40, "F");

    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(24);
    docPdf.text("DOCMASTER", 105, 20, { align: "center" });
    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(10);
    docPdf.text("VOTRE PORTEFEUILLE DE DOCUMENTS NUMÉRIQUES", 105, 30, {
      align: "center",
    });

    docPdf.setTextColor(26, 26, 26);
    docPdf.setFontSize(18);
    docPdf.setFont("helvetica", "bold");
    docPdf.text(doc.type_doc.toUpperCase(), 20, 55);

    const fields: [string, string | undefined, number][] = [
      ["NUMÉRO:", doc.numero_doc, 50],
      ["TITULAIRE:", doc.nom_sur_doc, 60],
      ["DÉLIVRÉ LE:", doc.date_delivrance, 60],
      ["EXPIRATION:", doc.date_expiration, 60],
      ["AUTORITÉ:", doc.nom_autorite, 60],
    ];

    let yRow = 65;
    docPdf.setFontSize(10);
    for (const [label, value, xVal] of fields) {
      docPdf.setFont("helvetica", "normal");
      docPdf.setTextColor(107, 114, 128);
      docPdf.text(label, 20, yRow);
      docPdf.setTextColor(26, 26, 26);
      docPdf.setFont("helvetica", "bold");
      const display =
        value && value !== "NON SPÉCIFIÉ"
          ? label.startsWith("DÉLIVRÉ") || label.startsWith("EXPIRATION")
            ? new Date(value).toLocaleDateString("fr-FR")
            : value
          : "NON SPÉCIFIÉ";
      docPdf.text(display, xVal, yRow);
      yRow += 7;
    }

    let yOffset = 110;
    const imgWidth = 170;
    const imgHeight = 85;
    const centerX = (210 - imgWidth) / 2;

    if (doc.photo_recto) {
      try {
        const imgRecto = await loadImage(doc.photo_recto);
        docPdf.setFontSize(9);
        docPdf.setTextColor(150, 150, 150);
        docPdf.setFont("helvetica", "italic");
        docPdf.text("FACE AVANT (RECTO)", 20, yOffset - 5);
        docPdf.addImage(imgRecto, "JPEG", centerX, yOffset, imgWidth, imgHeight);
        yOffset += imgHeight + 15;
      } catch {
        console.error("Error loading recto image");
      }
    }

    if (doc.photo_verso) {
      try {
        const imgVerso = await loadImage(doc.photo_verso);
        docPdf.setFontSize(9);
        docPdf.setTextColor(150, 150, 150);
        docPdf.setFont("helvetica", "italic");
        docPdf.text("FACE ARRIÈRE (VERSO)", 20, yOffset - 5);
        docPdf.addImage(imgVerso, "JPEG", centerX, yOffset, imgWidth, imgHeight);
      } catch {
        console.error("Error loading verso image");
      }
    }

    const totalPages = docPdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      docPdf.setPage(i);
      docPdf.setFontSize(8);
      docPdf.setTextColor(180, 180, 180);
      docPdf.text(
        `Ce document est une copie numérique sécurisée générée par DocMaster le ${new Date().toLocaleDateString("fr-FR")}`,
        105,
        285,
        { align: "center" }
      );
    }

    docPdf.save(
      `docmaster-${doc.type_doc}-${doc.numero_doc || "export"}.pdf`
    );
    return true;
  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
}

export function generateDeclarationPDF(data: DeclarationPDFData) {
  const pdf = new jsPDF();

  const pageW = 210;
  let y = 20;

  function header() {
    pdf.setFillColor(30, 58, 47);
    pdf.rect(0, 0, pageW, 50, "F");
    pdf.setFillColor(245, 166, 75);
    pdf.rect(0, 50, pageW, 3, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.text("DOCMASTER", 105, 22, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("DÉCLARATION DE PERTE DE DOCUMENT", 105, 34, { align: "center" });
  }

  function footer() {
    const pages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      pdf.setPage(i);
      pdf.setFillColor(30, 58, 47);
      pdf.rect(0, 285, pageW, 12, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text(`DocMaster — ${data.ref} — Généré le ${data.date}`, 105, 293, { align: "center" });
    }
  }

  function section(title: string) {
    y += 6;
    pdf.setFillColor(245, 166, 75);
    pdf.rect(20, y, 3, 10, "F");
    pdf.setTextColor(30, 58, 47);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(title, 27, y + 8);
    y += 14;
  }

  function field(label: string, value: string) {
    pdf.setTextColor(107, 114, 128);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(label, 25, y);
    pdf.setTextColor(26, 26, 26);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(value || "—", 70, y);
    y += 7;
  }

  function divider() {
    y += 2;
    pdf.setDrawColor(234, 227, 216);
    pdf.line(20, y, 190, y);
    y += 5;
  }

  header();

  y = 62;
  pdf.setTextColor(107, 114, 128);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text(`Réf: ${data.ref}`, 190, y, { align: "right" });
  y += 4;
  pdf.text(`Date: ${data.date}`, 190, y, { align: "right" });
  y += 10;

  section("Informations du déclarant");
  field("Déclarant", data.pour_soi ? "Pour moi-même" : "Pour une autre personne");
  field("Contact", `${data.telephone}${data.email ? ` / ${data.email}` : ""}`);
  y += 4;

  divider();
  section("Document(s) concerné(s)");

  data.documents.forEach((d, i) => {
    if (i > 0) y += 2;
    pdf.setFillColor(245, 166, 75);
    pdf.setDrawColor(245, 166, 75);
    pdf.roundedRect(22, y - 1, 166, 6, 1, 1, "S");
    pdf.setTextColor(30, 58, 47);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(`${i + 1}. ${d.label}`, 26, y + 3);
    y += 9;
    field("Nom sur le document", d.nom_complet);
    field("Numéro", d.numero);
    field("Date de délivrance", d.date_delivrance);
    field("Date d'expiration", d.date_expiration);
    y += 2;
  });

  divider();
  section("Circonstances de la perte");
  field("Date de perte", data.date_perte);
  field("Lieu", data.lieu_perte);
  field("Circonstances", data.circonstances || "Non spécifiées");
  field("Urgence", data.urgence);
  if (data.recompense) field("Récompense", `${data.recompense} FCFA`);

  y += 6;
  divider();

  pdf.setDrawColor(234, 227, 216);
  pdf.line(50, y, 160, y);
  y += 4;
  pdf.setTextColor(107, 114, 128);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text("Signature du déclarant", 105, y, { align: "center" });

  if (y > 260) pdf.addPage();
  y = 270;
  pdf.setFillColor(245, 166, 75);
  pdf.roundedRect(60, y, 90, 16, 3, 3, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("CERTIFICAT DE DÉCLARATION", 105, y + 11, { align: "center" });
  y += 22;
  pdf.setTextColor(107, 114, 128);
  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(8);
  pdf.text("Document officiel généré par DocMaster. Faire défense de le falsifier.", 105, y, { align: "center" });

  footer();
  pdf.save(`declaration-perte-${data.ref}.pdf`);
}
