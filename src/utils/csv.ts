export function generateCsv(columns: string[], rows: Record<string, unknown>[]): string {
  const header = columns.map(escapeCell).join(',')
  const body = rows.map(row =>
    columns.map(col => escapeCell(String(row[col] ?? ''))).join(',')
  ).join('\n')
  return `${header}\n${body}`
}

function escapeCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
