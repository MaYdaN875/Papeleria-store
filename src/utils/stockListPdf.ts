/**
 * Genera un PDF con la lista de productos con stock bajo para surtir.
 * Incluye: nombre, stock actual, stock mínimo y cantidad sugerida a comprar.
 */
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export interface ProductRowForPdf {
  id: number
  name: string
  stock: number
}

const TITLE = "Lista de productos para surtir"
const SUBTITLE = "God Art · Papelería"
const COLUMNS = ["#", "Producto", "Stock actual", "Stock mínimo", "Cantidad a surtir"]

function getSurtirQuantity(stock: number, minStock: number): number {
  return Math.max(0, minStock - stock)
}

export function downloadStockListPdf(
  products: ProductRowForPdf[],
  minStockThreshold: number
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const margin = 18
  let y = 20

  // ── Encabezado ──
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.text(TITLE, margin, y)
  y += 10

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(80, 80, 80)
  doc.text(SUBTITLE, margin, y)
  y += 6

  const now = new Date()
  const dateStr = now.toLocaleDateString("es-MX", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  doc.text(`Generado: ${dateStr}`, margin, y)
  doc.text(`Stock mínimo configurado: ${minStockThreshold} unidades`, margin, y + 5)
  doc.setTextColor(0, 0, 0)
  y += 14

  if (products.length === 0) {
    doc.setFont("helvetica", "normal")
    doc.text("No hay productos con stock bajo con el umbral actual.", margin, y)
    doc.save("lista-surtir-inventario.pdf")
    return
  }

  // ── Tabla ──
  const body = products.map((p, index) => {
    const surtir = getSurtirQuantity(p.stock, minStockThreshold)
    return [
      String(index + 1),
      p.name.length > 55 ? p.name.slice(0, 52) + "…" : p.name,
      String(p.stock),
      String(minStockThreshold),
      String(surtir),
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [COLUMNS],
    body,
    margin: { left: margin, right: margin },
    theme: "striped",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 28 },
      3: { cellWidth: 28 },
      4: { cellWidth: 38 },
    },
    alternateRowStyles: {
      fillColor: [245, 248, 250],
    },
    didDrawPage: () => {
      const pageHeightMm = 297
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(120, 120, 120)
      doc.text(
        `Lista para surtir · ${products.length} producto(s) · God Art`,
        margin,
        pageHeightMm - 10
      )
    },
  })

  doc.save("lista-surtir-inventario.pdf")
}
