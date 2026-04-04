import * as XLSX from 'xlsx'

const url = 'https://www.irishimmigration.ie/wp-content/uploads/2026/02/ILEP-11-February-2026.xlsx'
const res = await fetch(url)
const buffer = await res.arrayBuffer()
const workbook = XLSX.read(buffer, { type: 'array' })

console.log('Sheet names:', workbook.SheetNames)

const sheet = workbook.Sheets[workbook.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })

console.log('\nTotal rows:', rows.length)
console.log('\nColumn names in row 0:')
if (rows[0]) {
  for (const k of Object.keys(rows[0])) {
    console.log(`  "${k}" → "${String(rows[0][k]).slice(0, 60)}"`)
  }
}
console.log('\nSample row 1:')
if (rows[1]) {
  for (const [k, v] of Object.entries(rows[1])) {
    console.log(`  "${k}" → "${String(v).slice(0, 60)}"`)
  }
}
