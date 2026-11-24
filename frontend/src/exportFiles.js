import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportPDF(title, head, body, filename) {
  const d = new jsPDF({ orientation: head.length > 6 ? 'l' : 'p' })
  d.setFontSize(14)
  d.text('Conta Ponto - ' + title, 14, 16)
  d.setFontSize(8)
  d.text('Gerado em ' + new Date().toLocaleString('pt-BR'), 14, 22)
  autoTable(d, { startY: 27, head: [head], body, styles: { fontSize: 8 }, headStyles: { fillColor: [17, 19, 21] } })
  d.save(filename)
}

export function exportCSV(head, body, filename) {
  const blob = new Blob(['\ufeff' + [head, ...body].map((r) => r.join(';')).join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
