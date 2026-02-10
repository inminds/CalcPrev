import PDFDocument from "pdfkit";
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
        margin: 50,
        info: {
          Title: "Diagnóstico Previdenciário - Machado Schutz",
          Author: "Machado Schutz Advogados",
          Subject: `Diagnóstico para ${companySnapshot.razaoSocial}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const primaryColor = "#0891b2";
      const textColor = "#1f2937";
      const lightGray = "#6b7280";

      doc.rect(0, 0, doc.page.width, 120).fill(primaryColor);

      doc
        .fillColor("#ffffff")
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("MACHADO SCHUTZ", 50, 35);

      doc.fontSize(12).font("Helvetica").text("Advogados", 50, 62);

      doc.fontSize(18).font("Helvetica-Bold").text("Diagnóstico Previdenciário", 50, 90);

      let y = 150;

      doc.fillColor(textColor).fontSize(14).font("Helvetica-Bold").text("Dados da Empresa", 50, y);
      y += 25;

      doc.fontSize(10).font("Helvetica");

      const baseLabel = companySnapshot.baseInputType === "folha" ? "Valor médio da folha:" : "Colaboradores:";
      const baseValue = companySnapshot.baseInputType === "folha"
        ? formatCurrency(companySnapshot.folhaMedia || simulation.folhaMedia || simulation.baseFolha)
        : companySnapshot.colaboradores.toString();

      const fpasLine = fpasDescription ? `${companySnapshot.fpasCode} - ${fpasDescription}` : companySnapshot.fpasCode;

      const companyData = [
        { label: "CNPJ:", value: formatCNPJ(companySnapshot.cnpj) },
        { label: "Razão Social:", value: companySnapshot.razaoSocial },
        { label: "Segmento:", value: companySnapshot.segmento },
        { label: "FPAS:", value: fpasLine },
        { label: baseLabel, value: baseValue },
        { label: "Desonerada:", value: companySnapshot.isDesonerada ? "Sim" : "Não" },
      ];

      companyData.forEach((item) => {
        doc.fillColor(lightGray).text(item.label, 50, y, { continued: true });
        doc.fillColor(textColor).text(` ${item.value}`);
        y += 18;
      });

      y += 20;
      doc.fillColor(textColor).fontSize(14).font("Helvetica-Bold").text("Resumo do Cálculo", 50, y);
      y += 25;

      doc.fontSize(10).font("Helvetica");

      const calculationData = [
        { label: "Base da Folha:", value: formatCurrency(simulation.baseFolha) },
        { label: "Imposto Mensal Estimado:", value: formatCurrency(simulation.impostoMensalEstimado) },
        { label: "Meses de Projeção:", value: simulation.mesesProjetados.toString() },
        { label: "Total Projetado:", value: formatCurrency(simulation.totalProjetado) },
      ];

      calculationData.forEach((item) => {
        doc.fillColor(lightGray).text(item.label, 50, y, { continued: true });
        doc.fillColor(textColor).text(` ${item.value}`);
        y += 18;
      });

      y += 10;
      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Crédito Estimado Total: " + formatCurrency(simulation.creditoEstimadoTotal), 50, y);

      y += 40;
      doc.fillColor(textColor).fontSize(14).font("Helvetica-Bold").text("Distribuição", 50, y);
      y += 25;

      const boxWidth = 150;
      const boxHeight = 60;
      const spacing = 20;
      const startX = 50;

      const distribution = [
        { color: "#10b981", value: simulation.creditoVerde, percent: params.percentualVerde },
        { color: "#f59e0b", value: simulation.creditoAmarelo, percent: params.percentualAmarelo },
        { color: "#ef4444", value: simulation.creditoVermelho, percent: params.percentualVermelho },
      ];

      distribution.forEach((item, idx) => {
        const offsetX = startX + idx * (boxWidth + spacing);
        doc.rect(offsetX, y, boxWidth, boxHeight).fill(item.color);
        doc
          .fillColor("#ffffff")
          .fontSize(14)
          .font("Helvetica-Bold")
          .text(formatCurrency(item.value), offsetX + 10, y + 16);
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(formatPercentage(item.percent), offsetX + 10, y + 38);
      });

      y += boxHeight + 40;

      doc
        .rect(50, y, doc.page.width - 100, 100)
        .fillColor("#f3f4f6")
        .fill();

      doc.fillColor(textColor).fontSize(10).font("Helvetica-Bold").text("Aviso Legal", 60, y + 10);

      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor(lightGray)
        .text(
          "Os valores apresentados são estimativas baseadas nos parâmetros informados e têm caráter meramente ilustrativo. " +
            "Os cálculos não constituem garantia de recuperação de crédito e estão sujeitos a análise técnica e jurídica detalhada. " +
            "Para uma avaliação precisa, entre em contato com nossa equipe especializada.",
          60,
          y + 28,
          { width: doc.page.width - 120, align: "justify" }
        );

      const footerY = doc.page.height - 50;
      doc
        .fillColor(lightGray)
        .fontSize(8)
        .text("Machado Schutz Advogados - Calculadora Previdenciária V1", 50, footerY, {
          align: "center",
          width: doc.page.width - 100,
        });

      doc
        .text(`Documento gerado em ${new Date().toLocaleDateString("pt-BR")}`, 50, footerY + 12, {
          align: "center",
          width: doc.page.width - 100,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
