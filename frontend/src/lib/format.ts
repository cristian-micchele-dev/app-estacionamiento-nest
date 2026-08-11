/** $1.500 — sin decimales */
export function formatCurrency(n: number): string {
  return `$${Number(n).toLocaleString('es-AR')}`
}

/** 1.500,00 — con 2 decimales (sin el $ para poder componer: `$${fmtMoney(n)}`) */
export function fmtMoney(n: number): string {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2 })
}
