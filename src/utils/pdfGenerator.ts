import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AdminDailyClosing } from "../types/admin";

export const generateClosingPDF = (closing: AdminDailyClosing) => {
  // Inicializamos jsPDF
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Configuración de márgenes
  const marginX = 14;
  let currentY = 20;

  // 1. Cabecera (Logo / Nombre de Tienda)
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(33, 37, 41); // Gris muy oscuro
  doc.text("God Art Papelería", marginX, currentY);
  
  currentY += 8;
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(108, 117, 125); // Gris claro
  doc.text(`Reporte de Corte de Caja #${closing.id}`, marginX, currentY);

  // Fecha de generación (alineado a la derecha)
  const today = new Date().toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.setFontSize(10);
  doc.text(`Generado: ${today}`, 196 - doc.getTextWidth(`Generado: ${today}`), currentY);

  currentY += 15;

  // 2. Línea separadora
  doc.setDrawColor(222, 226, 230);
  doc.setLineWidth(0.5);
  doc.line(marginX, currentY, 196, currentY);
  currentY += 10;

  // 3. Información del periodo
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(33, 37, 41);
  doc.text("Información del Periodo", marginX, currentY);
  currentY += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const pStart = new Date(closing.periodStart).toLocaleString("es-MX");
  const pEnd = new Date(closing.periodEnd).toLocaleString("es-MX");
  doc.text(`Desde: ${pStart}`, marginX, currentY);
  currentY += 5;
  doc.text(`Hasta: ${pEnd}`, marginX, currentY);
  currentY += 10;

  // 4. Resumen Financiero (Cajas)
  // Usamos rectángulos con borde redondeado y fondo tenue
  const boxWidth = 55;
  const boxHeight = 20;
  
  // Caja 1: Ingresos Totales
  doc.setFillColor(232, 245, 233); // Verde claro tenue
  doc.roundedRect(marginX, currentY, boxWidth, boxHeight, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(76, 175, 80); // Verde oscuro
  doc.text("Ingresos Totales", marginX + 5, currentY + 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`$${closing.totalRevenue.toFixed(2)}`, marginX + 5, currentY + 15);

  // Caja 2: Unidades Vendidas
  doc.setFillColor(227, 242, 253); // Azul claro tenue
  doc.roundedRect(marginX + boxWidth + 5, currentY, boxWidth, boxHeight, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(33, 150, 243); // Azul
  doc.text("Unidades Vendidas", marginX + boxWidth + 10, currentY + 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${closing.totalUnits}`, marginX + boxWidth + 10, currentY + 15);

  // Caja 3: Total Órdenes
  doc.setFillColor(255, 243, 224); // Naranja claro tenue
  doc.roundedRect(marginX + boxWidth * 2 + 10, currentY, boxWidth, boxHeight, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(255, 152, 0); // Naranja
  doc.text("Total Ventas", marginX + boxWidth * 2 + 15, currentY + 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${closing.totalOrders}`, marginX + boxWidth * 2 + 15, currentY + 15);

  currentY += boxHeight + 15;

  // 5. Tabla de Productos
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(33, 37, 41);
  doc.text("Desglose de Productos Vendidos", marginX, currentY);
  currentY += 5;

  const tableData = closing.productsDetail.map((p) => [
    p.product_name,
    p.total_units.toString(),
    `$${Number(p.total_revenue).toFixed(2)}`,
    p.total_orders.toString(),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Producto", "Cantidad", "Ingresos", "Nº Ventas"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [52, 58, 64], // Gris oscuro corporativo
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "center" },
    },
    didDrawPage: function (data) {
      // Pie de página en todas las páginas de la tabla
      const pageCount = (doc.internal as any).getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.text(`Página ${data.pageNumber} de ${pageCount}`, pageSize.width / 2, pageHeight - 10, {
        align: "center",
      });
    },
  });

  // @ts-ignore
  const finalY = doc.lastAutoTable.finalY || currentY;

  // 6. Notas adicionales
  if (closing.notes) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(33, 37, 41);
    doc.text("Notas del Administrador:", marginX, finalY + 15);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(108, 117, 125);
    doc.text(closing.notes, marginX, finalY + 22, { maxWidth: 180 });
  }

  // 7. Descargar
  const safeDate = new Date(closing.closedAt).toISOString().split("T")[0];
  doc.save(`GodArt_Corte_Caja_${closing.id}_${safeDate}.pdf`);
};
