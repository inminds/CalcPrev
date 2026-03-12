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


const MSH_GREEN = "#00513B";
const MSH_BEIGE = "#D7AE81";
const MSH_TEXT = "#1C1C1C";
const MSH_TEXT_SECONDARY = "#4F4F4F";
const MSH_LIGHT_BG = "#F5F0EB";

function getLogoPath(): string | null {
  const possiblePaths = [
    path.join(process.cwd(), "client/public/Negativo_Dourado-Horizontal.png"),
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

function drawFieldRow(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number, labelW: number, valueW: number): number {
  doc.fillColor(MSH_TEXT_SECONDARY).fontSize(9).font("Helvetica").text(label + ":", x, y, { width: labelW });
  const textHeight = doc.heightOfString(value, { width: valueW });
  doc.fillColor(MSH_TEXT).fontSize(9).font("Helvetica-Bold").text(value, x + labelW, y, { width: valueW });
  return Math.max(14, textHeight + 4);
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function drawThickArc(
  doc: PDFKit.PDFDocument,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number,
  endDeg: number,
  color: string
) {
  const step = 2;
  const outerPts: [number, number][] = [];
  const innerPts: [number, number][] = [];

  if (startDeg > endDeg) {
    for (let d = startDeg; d >= endDeg; d -= step) {
      const r = toRad(d);
      outerPts.push([cx + outerR * Math.cos(r), cy - outerR * Math.sin(r)]);
      innerPts.push([cx + innerR * Math.cos(r), cy - innerR * Math.sin(r)]);
    }
    const rEnd = toRad(endDeg);
    outerPts.push([cx + outerR * Math.cos(rEnd), cy - outerR * Math.sin(rEnd)]);
    innerPts.push([cx + innerR * Math.cos(rEnd), cy - innerR * Math.sin(rEnd)]);
  } else {
    for (let d = startDeg; d <= endDeg; d += step) {
      const r = toRad(d);
      outerPts.push([cx + outerR * Math.cos(r), cy - outerR * Math.sin(r)]);
      innerPts.push([cx + innerR * Math.cos(r), cy - innerR * Math.sin(r)]);
    }
    const rEnd = toRad(endDeg);
    outerPts.push([cx + outerR * Math.cos(rEnd), cy - outerR * Math.sin(rEnd)]);
    innerPts.push([cx + innerR * Math.cos(rEnd), cy - innerR * Math.sin(rEnd)]);
  }

  if (outerPts.length < 2) return;

  doc.save();
  doc.moveTo(outerPts[0][0], outerPts[0][1]);
  for (let i = 1; i < outerPts.length; i++) {
    doc.lineTo(outerPts[i][0], outerPts[i][1]);
  }
  for (let i = innerPts.length - 1; i >= 0; i--) {
    doc.lineTo(innerPts[i][0], innerPts[i][1]);
  }
  doc.closePath();
  doc.fillColor(color).fill();
  doc.restore();
}

function drawSpeedometer(
  doc: PDFKit.PDFDocument,
  cx: number,
  cy: number,
  radius: number,
  percentage: number,
  color: string,
  label: string,
  valueText: string
) {
  const startAngle = 225;
  const totalSweep = 270;
  const endAngle = startAngle - totalSweep;
  const arcWidth = 7;
  const outerR = radius;
  const innerR = radius - arcWidth;

  drawThickArc(doc, cx, cy, outerR, innerR, startAngle, endAngle, "#E0E0E0");

  const filledEndAngle = startAngle - (totalSweep * percentage);
  if (percentage > 0.01) {
    drawThickArc(doc, cx, cy, outerR, innerR, startAngle, filledEndAngle, color);
  }

  const numTicks = 11;
  for (let i = 0; i <= numTicks; i++) {
    const tickAngle = startAngle - (totalSweep * i) / numTicks;
    const tickRad = toRad(tickAngle);
    const isMajor = i % 5 === 0;
    const tickOuterR = outerR + 1;
    const tickInnerR = isMajor ? outerR - arcWidth - 4 : outerR - arcWidth - 2;

    const x1 = cx + tickOuterR * Math.cos(tickRad);
    const y1 = cy - tickOuterR * Math.sin(tickRad);
    const x2 = cx + tickInnerR * Math.cos(tickRad);
    const y2 = cy - tickInnerR * Math.sin(tickRad);

    doc.save();
    doc.strokeColor("#B0B0B0").lineWidth(isMajor ? 1 : 0.5);
    doc.moveTo(x1, y1).lineTo(x2, y2).stroke();
    doc.restore();
  }

  const needleAngle = startAngle - (totalSweep * percentage);
  const needleRad = toRad(needleAngle);
  const needleLen = innerR - 3;
  const needleTipX = cx + needleLen * Math.cos(needleRad);
  const needleTipY = cy - needleLen * Math.sin(needleRad);

  const baseSize = 2;
  const perpRad = needleRad + Math.PI / 2;
  const bx1 = cx + baseSize * Math.cos(perpRad);
  const by1 = cy - baseSize * Math.sin(perpRad);
  const bx2 = cx - baseSize * Math.cos(perpRad);
  const by2 = cy + baseSize * Math.sin(perpRad);

  doc.save();
  doc.moveTo(needleTipX, needleTipY);
  doc.lineTo(bx1, by1);
  doc.lineTo(bx2, by2);
  doc.closePath();
  doc.fillColor(MSH_TEXT).fill();
  doc.restore();

  doc.save();
  doc.circle(cx, cy, 3).fillColor(color).fill();
  doc.restore();

  const labelDot = 4;
  const labelDotX = cx - 20;
  const labelDotY = cy - radius - 10;
  doc.save();
  doc.circle(labelDotX, labelDotY + 3, labelDot / 2).fillColor(color).fill();
  doc.restore();
  doc.fillColor(MSH_TEXT).fontSize(8).font("Helvetica-Bold").text(label, labelDotX + 6, labelDotY, { width: 50 });

  const textY = cy + radius - 8;
  doc.fillColor(MSH_TEXT).fontSize(11).font("Helvetica-Bold").text(valueText, cx - 55, textY, { width: 110, align: "center" });
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function drawJustifiedRichText(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
  lineGap: number,
  boldTerms: string[],
): number {
  const termSet = new Set(boldTerms.map((term) => term.toLowerCase()));
  const regex = new RegExp(`(${boldTerms.map(escapeRegex).join("|")})`, "gi");
  const segments = text.split(regex).filter(Boolean);
  const startY = y;

  segments.forEach((segment, index) => {
    const isBold = termSet.has(segment.toLowerCase());
    const isLast = index === segments.length - 1;

    doc.font(isBold ? "Helvetica-Bold" : "Helvetica");
    if (index === 0) {
      doc.text(segment, x, y, {
        width,
        align: "justify",
        lineGap,
        continued: !isLast,
      });
      return;
    }

    doc.text(segment, {
      continued: !isLast,
    });
  });

  return doc.y - startY;
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
          Title: "Diagnóstico Previdenciário - Machado Schutz Advogados e Associados",
          Author: "Machado Schutz Advogados e Associados",
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
      const labelW = 120;
      const valueW = contentWidth - labelW;

      // === HEADER ===
      const headerHeight = 80;
      doc.rect(0, 0, pageWidth, headerHeight).fill(MSH_GREEN);

      const logoPath = getLogoPath();
      if (logoPath) {
        try {
          doc.image(logoPath, margin, 20, { height: 40 });
        } catch {
          doc.fillColor("#ffffff").fontSize(20).font("Helvetica-Bold").text("Machado Schutz", margin, 28);
        }
      } else {
        doc.fillColor("#ffffff").fontSize(20).font("Helvetica-Bold").text("Machado Schutz", margin, 28);
      }

      doc
        .fillColor(MSH_BEIGE)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Diagnóstico Previdenciário", pageWidth - 210, 32, { width: 160, align: "right" });

      doc.rect(0, headerHeight, pageWidth, 3).fill(MSH_BEIGE);

      // === LEAD INFO ===
      let y = headerHeight + 18;

      const leadName = lead.name || lead.email || "Cliente";
      doc
        .fillColor(MSH_TEXT_SECONDARY)
        .fontSize(8)
        .font("Helvetica")
        .text(`Preparado para: ${leadName}`, margin, y);

      doc
        .text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, pageWidth - 200, y, { width: 150, align: "right" });

      y += 18;
      drawLine(doc, margin, y, pageWidth - margin, MSH_BEIGE, 0.5);

      // === DADOS DA EMPRESA ===
      y += 14;

      doc.rect(margin - 4, y - 2, 4, 16).fill(MSH_GREEN);
      doc.fillColor(MSH_GREEN).fontSize(12).font("Helvetica-Bold").text("Dados da Empresa", margin + 8, y);

      y += 22;

      const baseLabel = companySnapshot.baseInputType === "folha" ? "Valor médio da folha" : "Colaboradores";
      const baseValue = companySnapshot.baseInputType === "folha"
        ? formatCurrency(companySnapshot.folhaMedia || simulation.folhaMedia || simulation.baseFolha)
        : companySnapshot.colaboradores.toString();

      const fpasLine = fpasDescription
        ? `${companySnapshot.fpasCode} - ${fpasDescription}`
        : companySnapshot.fpasCode;

      const companyFields = [
        { label: "CNPJ", value: formatCNPJ(companySnapshot.cnpj) },
        { label: "Razão Social", value: companySnapshot.razaoSocial },
        { label: "Segmento", value: companySnapshot.segmento },
        { label: baseLabel, value: baseValue },
        { label: "Desonerada", value: companySnapshot.isDesonerada ? "Sim" : "Não" },
      ];

      companyFields.forEach((item) => {
        const rowH = drawFieldRow(doc, item.label, item.value, margin, y, labelW, valueW);
        y += rowH;
      });

      y += 8;
      drawLine(doc, margin, y, pageWidth - margin, "#E0E0E0", 0.5);

      // === RESUMO DO CÁLCULO ===
      y += 14;

      doc.rect(margin - 4, y - 2, 4, 16).fill(MSH_GREEN);
      doc.fillColor(MSH_GREEN).fontSize(12).font("Helvetica-Bold").text("Resumo do Cálculo", margin + 8, y);

      y += 22;

      const calcFields = [
        { label: "Base Estimada da Folha", value: formatCurrency(simulation.baseFolha) },
        { label: "Imposto Mensal", value: formatCurrency(simulation.impostoMensalEstimado) },
        { label: "Meses de Projeção", value: simulation.mesesProjetados.toString() },
        { label: "Crédito Estimado Mensal", value: formatCurrency(simulation.totalProjetado) },
      ];

      const calcCol2X = margin + contentWidth / 2 + 10;
      const calcLabelW = 105;
      const calcValueW = contentWidth / 2 - calcLabelW - 10;

      calcFields.forEach((item, idx) => {
        const colX = idx % 2 === 0 ? margin : calcCol2X;
        const rowY = y + Math.floor(idx / 2) * 18;

        doc.fillColor(MSH_TEXT_SECONDARY).fontSize(9).font("Helvetica").text(item.label + ":", colX, rowY, { width: calcLabelW });
        doc.fillColor(MSH_TEXT).fontSize(9).font("Helvetica-Bold").text(item.value, colX + calcLabelW, rowY, { width: calcValueW });
      });

      y += Math.ceil(calcFields.length / 2) * 18 + 10;

      // === CRÉDITO TOTAL ===
      const creditBoxH = 46;
      doc.rect(margin, y, contentWidth, creditBoxH).fill(MSH_GREEN);

      doc.fillColor("#ffffff").fontSize(10).font("Helvetica").text(`Total Crédito Projetado (${simulation.mesesProjetados} meses)`, margin + 16, y + 8);
      doc.fillColor(MSH_BEIGE).fontSize(18).font("Helvetica-Bold").text(formatCurrency(simulation.creditoEstimadoTotal), margin + 16, y + 24);

      y += creditBoxH + 18;

      // === DISTRIBUIÇÃO COM VELOCÍMETROS ===
      doc.rect(margin - 4, y - 2, 4, 16).fill(MSH_GREEN);
      doc.fillColor(MSH_GREEN).fontSize(12).font("Helvetica-Bold").text("Distribuição por Nível de Risco", margin + 8, y);

      y += 24;

      const gaugeSpacing = contentWidth / 3;
      const gaugeRadius = 42;
      const gaugeCenterY = y + gaugeRadius + 12;

      const distribution = [
        { label: "Verde", color: "#10b981", value: simulation.creditoVerde, percent: params.percentualVerde },
        { label: "Amarelo", color: "#f59e0b", value: simulation.creditoAmarelo, percent: params.percentualAmarelo },
        { label: "Vermelho", color: "#ef4444", value: simulation.creditoVermelho, percent: params.percentualVermelho },
      ];

      distribution.forEach((item, idx) => {
        const gaugeCenterX = margin + gaugeSpacing * idx + gaugeSpacing / 2;
        const pct = typeof item.percent === "string" ? parseFloat(item.percent) : item.percent;

        drawSpeedometer(
          doc,
          gaugeCenterX,
          gaugeCenterY,
          gaugeRadius,
          pct,
          item.color,
          item.label,
          formatCurrency(item.value)
        );
      });

      y = gaugeCenterY + gaugeRadius + 10;

      // === DESCRIÇÃO DIAGNÓSTICO ===
      drawLine(doc, margin, y, pageWidth - margin, "#E0E0E0", 0.5);
      y += 10;

      doc.rect(margin - 4, y - 2, 4, 12).fill(MSH_BEIGE);
      doc.fillColor(MSH_TEXT).fontSize(9).font("Helvetica-Bold").text("Descrição Diagnóstico", margin + 8, y);

      y += 16;

      const diagnosisText =
        "Este diagnóstico prévio visa estimar possíveis oportunidades de recuperação de créditos previdenciários, decorrentes de verbas " +
        "indevidamente incluídas na base de cálculo do INSS Patronal. A análise considera a legislação vigente, incluindo decisões do STF e STJ e o " +
        "posicionamento de âmbito administrativos da RFB (DRJ, CARF, TRT, TRF e a própria Receita Federal), classificando cada rubrica através de um " +
        "semáforo de cores (verde, amarelo e vermelho). O estudo evidencia potenciais valores a compensar no período não prescrito dos últimos 5 anos " +
        "(65 meses \"+13º\"), oferecendo à empresa um mapa claro das oportunidades de economia tributária e dos caminhos mais estratégicos para seu " +
        "aproveitamento.";

      const diagnosisBoldTerms = [
        "INSS Patronal",
        "STF",
        "STJ",
        "DRJ",
        "CARF",
        "TRT",
        "TRF",
        "Receita Federal",
        "verde",
        "amarelo",
        "vermelho",
      ];

      doc.fontSize(8).fillColor(MSH_TEXT);
      y += drawJustifiedRichText(doc, diagnosisText, margin, y, contentWidth - 6, 2, diagnosisBoldTerms);

      y += 10;

      // === LEGENDA ===
      drawLine(doc, margin, y, pageWidth - margin, "#E0E0E0", 0.5);
      y += 10;

      doc.rect(margin - 4, y - 2, 4, 12).fill(MSH_BEIGE);
      doc.fillColor(MSH_TEXT).fontSize(9).font("Helvetica-Bold").text("Legenda", margin + 8, y);
      y += 16;

      const legendItems = [
        { color: "#10b981", text: "Verde - Alta e/ou certa a chance de sucesso." },
        { color: "#f59e0b", text: "Amarelo - A chance de sucesso é igual ou superior a 50%, mas menor do que verde." },
        { color: "#ef4444", text: "Vermelho - A chance de sucesso é igual ou inferior a 50%." },
      ];

      legendItems.forEach((item) => {
        const dotX = margin + 5;
        const dotY = y + 5;

        // outer ring for a slightly raised "badge" look
        doc.circle(dotX, dotY, 4).fillColor("#FFFFFF").fill();
        doc.circle(dotX, dotY, 3.2).fillColor(item.color).fill();

        doc
          .fillColor(MSH_TEXT)
          .fontSize(8)
          .font("Helvetica")
          .text(item.text, margin + 16, y, { width: contentWidth - 16, lineGap: 2 });

        y += Math.max(14, doc.heightOfString(item.text, { width: contentWidth - 16, lineGap: 2 }) + 3);
      });

      y += 8;

      // === AVISO LEGAL ===
      drawLine(doc, margin, y, pageWidth - margin, "#E0E0E0", 0.5);
      y += 10;

      doc.rect(margin - 4, y - 2, 4, 12).fill(MSH_BEIGE);
      doc.fillColor(MSH_TEXT).fontSize(8).font("Helvetica-Bold").text("Aviso Legal", margin + 8, y);

      y += 14;

      doc
        .fontSize(7)
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
      const footerHeight = 40;
      const footerY = pageHeight - footerHeight;

      doc.rect(0, footerY, pageWidth, footerHeight).fill(MSH_GREEN);

      doc
        .fillColor(MSH_BEIGE)
        .fontSize(8)
        .font("Helvetica-Bold")
        .text("Machado Schutz Advogados e Associados", margin, footerY + 8, {
          width: contentWidth,
          align: "center",
        });

      doc
        .fillColor("#ffffff")
        .fontSize(7)
        .font("Helvetica")
        .text("www.msh.adv.br  |  Calculadora Previdenciária V1.1", margin, footerY + 22, {
          width: contentWidth,
          align: "center",
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
