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
  params: CalculationParams
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

      const companyData = [
        { label: "CNPJ:", value: formatCNPJ(companySnapshot.cnpj) },
        { label: "Razão Social:", value: companySnapshot.razaoSocial },
        { label: "Segmento:", value: companySnapshot.segmento },
        { label: "FPAS:", value: companySnapshot.fpasCode },
        { label: "Colaboradores:", value: companySnapshot.colaboradores.toString() },
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
      doc.fillColor(textColor).fontSize(14).font("Helvetica-Bold").text("Distribuição por Nível de Risco", 50, y);
      y += 25;

      const boxWidth = 150;
      const boxHeight = 60;
      const spacing = 20;
      const startX = 50;

      doc.rect(startX, y, boxWidth, boxHeight).fill("#10b981");
      doc
        .fillColor("#ffffff")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("BAIXO RISCO", startX + 10, y + 10);
      doc.fontSize(14).text(formatCurrency(simulation.creditoVerde), startX + 10, y + 28);
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(formatPercentage(params.percentualVerde), startX + 10, y + 46);

      doc.rect(startX + boxWidth + spacing, y, boxWidth, boxHeight).fill("#f59e0b");
      doc
        .fillColor("#ffffff")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("MÉDIO RISCO", startX + boxWidth + spacing + 10, y + 10);
      doc.fontSize(14).text(formatCurrency(simulation.creditoAmarelo), startX + boxWidth + spacing + 10, y + 28);
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(formatPercentage(params.percentualAmarelo), startX + boxWidth + spacing + 10, y + 46);

      doc.rect(startX + 2 * (boxWidth + spacing), y, boxWidth, boxHeight).fill("#ef4444");
      doc
        .fillColor("#ffffff")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text("ALTO RISCO", startX + 2 * (boxWidth + spacing) + 10, y + 10);
      doc.fontSize(14).text(formatCurrency(simulation.creditoVermelho), startX + 2 * (boxWidth + spacing) + 10, y + 28);
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(formatPercentage(params.percentualVermelho), startX + 2 * (boxWidth + spacing) + 10, y + 46);

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
