/** UTF-8 BOM — makes Excel open the file with correct encoding */
const BOM = '\uFEFF'

function escapeCell(value: string | number | null | undefined): string {
  const str = value == null ? '' : String(value)
  // Wrap in quotes and escape internal quotes
  return `"${str.replace(/"/g, '""')}"`
}

export function exportCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
): void {
  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(',')),
  ]
  const csv = BOM + lines.join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
