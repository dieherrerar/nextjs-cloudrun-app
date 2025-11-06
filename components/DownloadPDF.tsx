"use client";
import React, { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type Grafico = {
  id_grafico: number | string;
  titulo_grafico: string;
  activo: number;
};
type Kpi = { id_kpi: number; label: string; value: string | number };

interface Props {
  date: string;
  kpis: Kpi[];
  graficos: Grafico[];
  chartNodeIds: Record<number, string>;
  kpiNodeId: string;
}

// 🧾 Descripciones de cada gráfico
const CAPTIONS: Record<number, string> = {
  2: "Relación entre la concentración de CO₂ y la temperatura ambiental durante el periodo analizado.",
  3: "Comparativa entre el promedio diario de PM y el límite recomendado por la OMS (24h).",
  4: "Distribución porcentual de las partículas en suspensión, según su tipo y concentración relativa.",
  5: "Tendencia temporal del CO₂ y el consumo, observando patrones de relación a lo largo del tiempo.",
};

const PAR_MARGIN_X = 60;
const PAR_LINE_HEIGHT = 16;
const PAR_WIDTH = (doc: jsPDF) =>
  doc.internal.pageSize.getWidth() - PAR_MARGIN_X * 2;

//FUNCION PARA PÁRRAFO JUSTIFICADO.
function drawJustifiedParagraph(doc: jsPDF, text: string, yStart: number) {
  const pageW = doc.internal.pageSize.getWidth();
  const textWidth = PAR_WIDTH(doc);
  const lines = doc.splitTextToSize(text, textWidth);

  let y = yStart;
  lines.forEach((line: any, i: any) => {
    const isLast = i === lines.length - 1;
    if (!isLast && line.includes(" ")) {
      const words = line.trim().split(/\s+/);
      const base = words.join(" ");
      const baseW = doc.getTextWidth(base);
      const gaps = words.length - 1;
      const extra = gaps > 0 ? (textWidth - baseW) / gaps : 0;

      let x = PAR_MARGIN_X;
      words.forEach((w: any, idx: any) => {
        doc.text(w, x, y);
        x += doc.getTextWidth(w) + (idx < gaps ? extra : 0);
      });
    } else {
      doc.text(line, PAR_MARGIN_X, y);
    }
    y += PAR_LINE_HEIGHT;
  });

  return y;
}

//FUNCIÓN PARA TÍTULO CENTRADO.
function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, pageW / 2, y, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
}

export default function DownloadPDF({
  date,
  kpis,
  graficos,
  chartNodeIds,
  kpiNodeId,
}: Props) {
  const [busy, setBusy] = useState(false);

  const addFooter = (doc: jsPDF, pageNum: number) => {
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setFontSize(9);
    doc.text(`EcoPulse • ${new Date().toLocaleString("es-CL")}`, 20, h - 16, {
      align: "left",
    });
    doc.text(`Página ${pageNum}`, w - 40, h - 16, { align: "right" });
  };

  //Portada
  const addCover = (doc: jsPDF) => {
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Fondo suave
    doc.setFillColor(230, 245, 255);
    doc.rect(0, 0, pageW, pageH, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(25, 90, 140);
    doc.text("Reporte Ambiental", pageW / 2, 200, { align: "center" });

    doc.setFontSize(20);
    doc.text("EcoPulse", pageW / 2, 230, { align: "center" });

    // Línea decorativa
    doc.setDrawColor(25, 90, 140);
    doc.setLineWidth(1.2);
    doc.line(pageW / 2 - 60, 245, pageW / 2 + 60, 245);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.text(
      `Fecha seleccionada: ${new Date(date).toLocaleDateString("es-CL")}`,
      pageW / 2,
      280,
      { align: "center" }
    );

    doc.setFontSize(11);
    doc.text(
      "Sistema de monitoreo ambiental y analítica inteligente.",
      pageW / 2,
      300,
      { align: "center" }
    );

    addFooter(doc, 1);
  };

  const addIntroduccion = (doc: jsPDF, pageNum: number) => {
    doc.addPage();
    const pageW = doc.internal.pageSize.getWidth();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Introducción", pageW / 2, 60, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const intro =
      "El presente informe tiene como objetivo proporcionar una visión general del estado ambiental monitoreado por la plataforma EcoPulse. En las siguientes secciones se presentan los principales indicadores y tendencias obtenidas a partir de los sensores desplegados, así como su análisis comparativo respecto a los valores de referencia establecidos.\n\nEste reporte se genera de forma automática y recoge tanto las métricas clave (KPIs) como los gráficos que permiten visualizar la evolución de las variables ambientales de interés. La información busca facilitar la interpretación de los datos, apoyar la toma de decisiones y contribuir a la gestión sustentable del entorno monitoreado.";

    // Justificar manualmente el texto (como en Word)
    const marginX = 60;
    const lineHeight = 16;
    const textWidth = pageW - marginX * 2;
    const lines = doc.splitTextToSize(intro, textWidth);

    let y = 100;
    lines.forEach((txt: any, idx: any) => {
      doc.text("", PAR_MARGIN_X - 10, y);
      y = drawJustifiedParagraph(doc, txt, y);
      y += 6;
    });

    addFooter(doc, pageNum);
  };

  //KPIs
  const addKpis = async (
    doc: jsPDF,
    kpiNodeId: string,
    kpis: any[],
    pageNum: number
  ) => {
    const node = document.querySelector(kpiNodeId) as HTMLElement | null;
    if (!node) return;

    // Captura del bloque de KPIs
    node.scrollIntoView({ block: "center" });
    const canvas = await html2canvas(node, { scale: 2, useCORS: true });
    const img = canvas.toDataURL("image/png");

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const footerSpace = 40;

    // 1) Preparamos los textos (descripciones) y estimamos su altura total
    const pm25 = kpis.find((k) => k.id_kpi === 1)?.value;
    const temp = kpis.find((k) => k.id_kpi === 2)?.value;
    const co2 = kpis.find((k) => k.id_kpi === 3)?.value;
    const rain = kpis.find((k) => k.id_kpi === 4)?.value;

    const items: string[] = [];
    if (pm25 !== undefined) {
      const ref = 130;
      const pos = Number(pm25) <= ref ? "por debajo" : "por encima";
      items.push(
        `MP2.5 promedio del día (µg/m³): indicador de material particulado fino (≤ 2,5 µm). ` +
          `Al momento de la generación del informe, el promedio fue ${pm25} µg/m³, ` +
          `ubicándose ${pos} del umbral OMS (${ref} µg/m³).`
      );
    }
    if (temp !== undefined) {
      items.push(
        `Temperatura promedio (°C): describe las condiciones térmicas predominantes del periodo. ` +
          `El valor observado es ${temp} °C.`
      );
    }
    if (co2 !== undefined) {
      items.push(
        `CO₂ máximo (ppm): mayor concentración puntual registrada por los sensores durante el intervalo. ` +
          `El valor alcanzó ${co2} ppm.`
      );
    }
    if (rain !== undefined) {
      items.push(
        `Precipitación acumulada (mm): total de agua caída en el periodo de análisis. ` +
          `Se registró ${rain} mm.`
      );
    }
    if (items.length === 0) {
      kpis.forEach((k) => items.push(`${k.label}: ${k.value}.`));
    }

    // Estimar altura total del texto para reservar espacio antes de calcular el tamaño de la imagen
    const textWidth = PAR_WIDTH(doc);
    const bulletGap = 6;
    let estimatedTextHeight = 0;
    items.forEach((txt) => {
      const wrapped = doc.splitTextToSize(txt, textWidth);
      const linesCount = wrapped.length;
      estimatedTextHeight += linesCount * PAR_LINE_HEIGHT + bulletGap;
    });
    if (estimatedTextHeight > 0) {
      estimatedTextHeight -= bulletGap; // quitar el gap del último bullet
    }

    // 2) Pintamos la página: título → imagen (arriba) → texto (debajo)
    doc.addPage();
    drawSectionTitle(doc, "KPIs del Dashboard", 50);

    const titleGap = 20;
    const imgTop = 50 + titleGap; // debajo del título
    const textTopGap = 18; // espacio entre imagen y texto

    // Calcular tamaño máximo permitido para la imagen para que quepa también el texto y el footer
    const maxW = pageW - 80;
    const maxH =
      pageH - imgTop - textTopGap - estimatedTextHeight - footerSpace;

    // Si el texto es muy largo, maxH podría ser pequeño; aseguramos un mínimo visual
    const safeMaxH = Math.max(120, maxH);

    const ratio = Math.min(maxW / canvas.width, safeMaxH / canvas.height);
    const drawW = canvas.width * ratio;
    const drawH = canvas.height * ratio;
    const imgX = (pageW - drawW) / 2;
    const imgY = imgTop;

    // Dibuja imagen primero
    doc.addImage(img, "PNG", imgX, imgY, drawW, drawH);

    // 3) Descripciones justificadas, DEBAJO de la imagen
    let y = imgY + drawH + textTopGap;
    items.forEach((txt) => {
      // bullet
      doc.text("•", PAR_MARGIN_X - 10, y);
      y = drawJustifiedParagraph(doc, txt, y);
      y += bulletGap;
    });
    addFooter(doc, pageNum);
  };

  //GRAFICOS
  const addDomImage = async (
    doc: jsPDF,
    selector: string,
    title: string,
    caption: string,
    pageNum: number
  ) => {
    const node = document.querySelector(selector) as HTMLElement | null;
    if (!node) return;

    node.scrollIntoView({ block: "center" });
    const canvas = await html2canvas(node, { scale: 2, useCORS: true });
    const img = canvas.toDataURL("image/png");

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const footerSpace = 40;

    doc.addPage();
    drawSectionTitle(doc, title, 40);

    const maxW = pageW - 100;
    const maxH = pageH - 180;
    const imgW = canvas.width;
    const imgH = canvas.height;
    const ratio = Math.min(maxW / imgW, maxH / imgH);
    const drawW = imgW * ratio;
    const drawH = imgH * ratio;
    const imgX = (pageW - drawW) / 2;
    const imgY = 60;
    doc.addImage(img, "PNG", imgX, imgY, drawW, drawH);

    if (caption) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      const yCaption = imgY + drawH + 18;

      const yEndLimit = pageH - footerSpace - 10;
      let y = drawJustifiedParagraph(doc, caption, yCaption);

      if (y > yEndLimit) {
        const remaining = caption;
        doc.addPage();
        drawSectionTitle(doc, "Continuación", 40);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        y = drawJustifiedParagraph(doc, remaining, 70);
      }
    }

    addFooter(doc, pageNum);
  };

  const handleExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      // Portada
      addCover(doc);

      let pageNum = 2;

      // Introducción
      addIntroduccion(doc, pageNum++);

      // KPIs
      await addKpis(doc, kpiNodeId, kpis, pageNum++);

      // Gráficos activos
      const activos = graficos
        .filter((g) => Number(g.activo) === 1)
        .sort((a, b) => Number(a.id_grafico) - Number(b.id_grafico));

      for (const g of activos) {
        const nodeSel = chartNodeIds[Number(g.id_grafico)];
        const caption = CAPTIONS[Number(g.id_grafico)] || "";
        if (nodeSel) {
          await addDomImage(doc, nodeSel, g.titulo_grafico, caption, pageNum++);
        }
      }

      const name = `EcoPulse_${new Date(date).toISOString().slice(0, 10)}.pdf`;
      doc.save(name);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      className="btn btn-sm dashboard-btn-blue"
      onClick={handleExport}
      disabled={busy}
    >
      {busy ? "Generando PDF..." : "Exportar PDF"}
    </button>
  );
}
