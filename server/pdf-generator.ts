import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import type { Simulation, CompanySnapshot, Lead, CalculationParams } from "@shared/schema";

function formatCurrency(value: string | number): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue);
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatPercentage(value: string | number): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return `${(numValue * 100).toFixed(0)}%`;
}

const MSH_GREEN = "#00513B";
const MSH_BEIGE = "#D7AE81";
const MSH_TEXT = "#1C1C1C";
const MSH_TEXT_SECONDARY = "#4F4F4F";
const MSH_LIGHT_BG = "#F5F0EB";

function getLogoPath(): string | null {
  const possiblePaths = [
    path.join(process.cwd(), "client/public/logo-light.png"),
    path.join(process.cwd(), "public/logo-light.png"),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function drawLine(doc: PDFKit.PDFDocument, x1: number, y: number, x2: number, color: string, width = 1) {
  doc.strokeColor(color).lineWidth(width).moveTo(x1, y).lineTo(x2, y).stroke();
}

export function generatePDF(
  simulation: Simulation,
  companySnapshot: CompanySnapshot,
  lead: Lead,
  params: CalculationParams,
  fpasDescription?: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        info: {
          Title: "Diagnóstico Previdenciário - Machado Schütz & Heck",
          Author: "Machado Schütz & Heck Advogados Associados",
          Subject: `Diagnóstico para ${companySnapshot.razaoSocial}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;

      // === HEADER ===
      const headerHeight = 100;
      doc.rect(0, 0, pageWidth, headerHeight).fill(MSH_GREEN);

      const logoPath = getLogoPath();
      if (logoPath) {
        try {
          doc.image(logoPath, margin, 20, { height: 60 });
        } catch {
          doc
            .fillColor("#ffffff")
            .fontSize(22)
            .font("Helvetica-Bold")
            .text("MSH", margin, 30);
        }
      } else {
        doc
          .fillColor("#ffffff")
          .fontSize(22)
          .font("Helvetica-Bold")
          .text("MSH", margin, 30);
      }

      doc
        .fillColor("#ffffff")
        .fontSize(10)
        .font("Helvetica")
        .text("Advogados Associados", pageWidth - 200, 35, { width: 150, align: "right" });

      doc
        .fillColor(MSH_BEIGE)
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("Diagnóstico Previdenciário", pageWidth - 200, 55, { width: 150, align: "right" });

      doc.rect(0, headerHeight, pageWidth, 4).fill(MSH_BEIGE);

      // === LEAD INFO ===
      let y = headerHeight + 24;

      doc
        .fillColor(MSH_TEXT_SECONDARY)
        .fontSize(9)
        .font("Helvetica")
        .text(`Preparado para: ${lead.name}`, margin, y);

      doc
        .text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, pageWidth - 200, y, { width: 150, align: "right" });

      y += 22;

      drawLine(doc, margin, y, pageWidth - margin, MSH_BEIGE, 0.5);

      // === DADOS DA EMPRESA ===
      y += 18;

      doc.rect(margin - 4, y - 2, 4, 18).fill(MSH_GREEN);
      doc
        .fillColor(MSH_GREEN)
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("Dados da Empresa", margin + 8, y);

      y += 28;

      const baseLabel = companySnapshot.baseInputType === "folha" ? "Valor médio da folha" : "Colaboradores";
      const baseValue = companySnapshot.baseInputType === "folha"
        ? formatCurrency(companySnapshot.folhaMedia || simulation.folhaMedia || simulation.baseFolha)
        : companySnapshot.colaboradores.toString();

      const fpasLine = fpasDescription ? `${companySnapshot.fpasCode} - ${fpasDescription}` : companySnapshot.fpasCode;

      const companyData = [
        { label: "CNPJ", value: formatCNPJ(companySnapshot.cnpj) },
        { label: "Razão Social", value: companySnapshot.razaoSocial },
        { label: "Segmento", value: companySnapshot.segmento },
        { label: "FPAS", value: fpasLine },
        { label: baseLabel, value: baseValue },
        { label: "Desonerada", value: companySnapshot.isDesonerada ? "Sim" : "Não" },
      ];

      const col1X = margin;
      const col2X = margin + contentWidth / 2 + 10;
      const labelWidth = 110;

      companyData.forEach((item, idx) => {
        const colX = idx % 2 === 0 ? col1X : col2X;
        const rowY = y + Math.floor(idx / 2) * 20;

        doc.fillColor(MSH_TEXT_SECONDARY).fontSize(9).font("Helvetica").text(item.label + ":", colX, rowY, { width: labelWidth, continued: false });
        doc.fillColor(MSH_TEXT).fontSize(9).font("Helvetica-Bold").text(item.value, colX + labelWidth, rowY);
      });

      y += Math.ceil(companyData.length / 2) * 20 + 14;

      drawLine(doc, margin, y, pageWidth - margin, "#E0E0E0", 0.5);

      // === RESUMO DO CÁLCULO ===
      y += 18;

      doc.rect(margin - 4, y - 2, 4, 18).fill(MSH_GREEN);
      doc
        .fillColor(MSH_GREEN)
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("Resumo do Cálculo", margin + 8, y);

      y += 28;

      const calculationData = [
        { label: "Base da Folha", value: formatCurrency(simulation.baseFolha) },
        { label: "Imposto Mensal Estimado", value: formatCurrency(simulation.impostoMensalEstimado) },
        { label: "Meses de Projeção", value: simulation.mesesProjetados.toString() },
        { label: "Total Projetado", value: formatCurrency(simulation.totalProjetado) },
      ];

      calculationData.forEach((item, idx) => {
        const colX = idx % 2 === 0 ? col1X : col2X;
        const rowY = y + Math.floor(idx / 2) * 20;

        doc.fillColor(MSH_TEXT_SECONDARY).fontSize(9).font("Helvetica").text(item.label + ":", colX, rowY, { width: labelWidth + 20, continued: false });
        doc.fillColor(MSH_TEXT).fontSize(9).font("Helvetica-Bold").text(item.value, colX + labelWidth + 20, rowY);
      });

      y += Math.ceil(calculationData.length / 2) * 20 + 10;

      // === CRÉDITO TOTAL ===
      const creditBoxY = y;
      const creditBoxHeight = 50;
      doc.rect(margin, creditBoxY, contentWidth, creditBoxHeight).fill(MSH_GREEN);

      doc
        .fillColor("#ffffff")
        .fontSize(11)
        .font("Helvetica")
        .text("Crédito Estimado Total", margin + 20, creditBoxY + 10);

      doc
        .fillColor(MSH_BEIGE)
        .fontSize(20)
        .font("Helvetica-Bold")
        .text(formatCurrency(simulation.creditoEstimadoTotal), margin + 20, creditBoxY + 26);

      y = creditBoxY + creditBoxHeight + 24;

      // === DISTRIBUIÇÃO ===
      doc.rect(margin - 4, y - 2, 4, 18).fill(MSH_GREEN);
      doc
        .fillColor(MSH_GREEN)
        .fontSize(13)
        .font("Helvetica-Bold")
        .text("Distribuição por Nível de Risco", margin + 8, y);

      y += 30;

      const boxWidth = (contentWidth - 20) / 3;
      const boxHeight = 75;

      const distribution = [
        { label: "Verde", color: "#10b981", borderColor: "#059669", value: simulation.creditoVerde, percent: params.percentualVerde },
        { label: "Amarelo", color: "#f59e0b", borderColor: "#d97706", value: simulation.creditoAmarelo, percent: params.percentualAmarelo },
        { label: "Vermelho", color: "#ef4444", borderColor: "#dc2626", value: simulation.creditoVermelho, percent: params.percentualVermelho },
      ];

      distribution.forEach((item, idx) => {
        const offsetX = margin + idx * (boxWidth + 10);

        doc.rect(offsetX, y, boxWidth, 4).fill(item.color);

        doc.rect(offsetX, y + 4, boxWidth, boxHeight - 4).fill(MSH_LIGHT_BG);

        doc
          .fillColor(MSH_TEXT)
          .fontSize(9)
          .font("Helvetica-Bold")
          .text(item.label, offsetX + 12, y + 14, { width: boxWidth - 24 });

        doc
          .fillColor(MSH_TEXT)
          .fontSize(15)
          .font("Helvetica-Bold")
          .text(formatCurrency(item.value), offsetX + 12, y + 30, { width: boxWidth - 24 });

        doc
          .fillColor(MSH_TEXT_SECONDARY)
          .fontSize(10)
          .font("Helvetica")
          .text(formatPercentage(item.percent), offsetX + 12, y + 52, { width: boxWidth - 24 });
      });

      y += boxHeight + 28;

      // === AVISO LEGAL ===
      drawLine(doc, margin, y, pageWidth - margin, "#E0E0E0", 0.5);
      y += 14;

      doc.rect(margin - 4, y - 2, 4, 14).fill(MSH_BEIGE);
      doc
        .fillColor(MSH_TEXT)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("Aviso Legal", margin + 8, y);

      y += 18;

      doc
        .fontSize(7.5)
        .font("Helvetica")
        .fillColor(MSH_TEXT_SECONDARY)
        .text(
          "Os valores apresentados são estimativas baseadas nos parâmetros informados e têm caráter meramente ilustrativo. " +
            "Os cálculos não constituem garantia de recuperação de crédito e estão sujeitos a análise técnica e jurídica detalhada. " +
            "Para uma avaliação precisa, entre em contato com nossa equipe especializada.",
          margin,
          y,
          { width: contentWidth, align: "justify", lineGap: 2 }
        );

      // === FOOTER ===
      const footerHeight = 45;
      const footerY = pageHeight - footerHeight;

      doc.rect(0, footerY, pageWidth, footerHeight).fill(MSH_GREEN);

      doc
        .fillColor(MSH_BEIGE)
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("Machado Schütz & Heck Advogados Associados", margin, footerY + 10, {
          width: contentWidth,
          align: "center",
        });

      doc
        .fillColor("#ffffff")
        .fontSize(7)
        .font("Helvetica")
        .text("www.msh.adv.br  |  Calculadora Previdenciária V1.1", margin, footerY + 24, {
          width: contentWidth,
          align: "center",
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
