/**
 * ETL: Download ILEP Excel from irishimmigration.ie and generate JSON.
 *
 * Source: https://www.irishimmigration.ie/wp-content/uploads/2026/02/ILEP-11-February-2026.xlsx
 * Columns: Programme Reference No, Programme Type, Provider, Address,
 *   Contact Email, Contact Telephone, Contact Name, Programme Title,
 *   Awarding Body, Award Title, Duration (ECTS / Weeks per year),
 *   Hours per week, NFQ Level, Entry Level, Exit Level
 *
 * Run: npm run data
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import * as XLSX from 'xlsx'

const OUT_DIR = join(process.cwd(), 'src/data')

// Detect latest ILEP URL from the page, fallback to known URL
const ILEP_PAGE = 'https://www.irishimmigration.ie/coming-to-study-in-ireland/what-are-my-study-options/a-third-level-course-or-a-language-course/'
const ILEP_FALLBACK = 'https://www.irishimmigration.ie/wp-content/uploads/2026/02/ILEP-11-February-2026.xlsx'

async function findIlepUrl(): Promise<string> {
  try {
    const res = await fetch(ILEP_PAGE)
    const html = await res.text()
    const match = html.match(/href="(https:\/\/www\.irishimmigration\.ie\/wp-content\/uploads\/\d{4}\/\d{2}\/ILEP[^"]+\.xlsx)"/i)
    if (match) {
      console.log(`Found ILEP URL: ${match[1]}`)
      return match[1]
    }
  } catch (e) {
    console.warn('Could not fetch ILEP page, using fallback URL')
  }
  console.log(`Using fallback URL: ${ILEP_FALLBACK}`)
  return ILEP_FALLBACK
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function extractCounty(address: string): string {
  if (!address) return 'Unknown'
  const counties = [
    'Carlow','Cavan','Clare','Cork','Donegal','Dublin',
    'Galway','Kerry','Kildare','Kilkenny','Laois','Leitrim',
    'Limerick','Longford','Louth','Mayo','Meath','Monaghan',
    'Offaly','Roscommon','Sligo','Tipperary','Waterford',
    'Westmeath','Wexford','Wicklow',
  ]
  const upper = address.toUpperCase()
  for (const c of counties) {
    if (upper.includes(c.toUpperCase())) return c
  }
  // Dublin postal districts → Dublin
  if (/\bD\d{1,2}\b|\bDUBLIN\s*\d/i.test(address)) return 'Dublin'
  return 'Unknown'
}

function normalizeNfq(raw: string): string {
  if (!raw || raw.trim() === '' || raw.toLowerCase() === 'n/a') return 'N/A'
  const n = raw.toString().trim()
  // Could be "6", "7", "8", "9", "6/7" etc.
  return n
}

function normalizeProgrammeType(raw: string): string {
  const t = raw?.trim() ?? ''
  if (t.toLowerCase().includes('english language')) return 'English Language'
  if (t.toLowerCase().includes('higher education')) return 'Higher Education'
  if (t.toLowerCase().includes('professional')) return 'Professional'
  if (t.toLowerCase().includes('foundation')) return 'Foundation'
  return t || 'Other'
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  // ── Download ILEP Excel ───────────────────────────────────────────────────
  const ilepUrl = await findIlepUrl()
  console.log(`Downloading ILEP Excel...`)
  const res = await fetch(ilepUrl)
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ILEP`)
  const buffer = await res.arrayBuffer()

  // ── Parse Excel ───────────────────────────────────────────────────────────
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  console.log(`Sheets: ${workbook.SheetNames.join(', ')}`)

  // The Excel has a title row first, then real headers in row index 0 as values,
  // and actual data from row index 1 onwards. Re-parse with row 0 as headers.
  const rawArray = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as string[][]

  // Find the header row (the one containing "Programme Reference No")
  const headerRowIdx = rawArray.findIndex(row =>
    row.some(cell => String(cell).includes('Programme Reference'))
  )
  if (headerRowIdx === -1) throw new Error('Could not find header row in Excel')

  const headers = rawArray[headerRowIdx].map(h => String(h ?? '').trim())
  const dataRows = rawArray.slice(headerRowIdx + 1)

  // Build clean row objects using real headers
  const rows: Record<string, string>[] = dataRows
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => {
        if (h) obj[h] = String(row[i] ?? '').trim()
      })
      return obj
    })

  // ── Build programme objects ───────────────────────────────────────────────
  const programmes = rows
    .filter(r => r['Programme Title'] && r['Provider'])
    .map((r, i) => {
      // Handle column name variants (Address has a typo "Addresss" in the source)
      const address = r['Addresss'] ?? r['Address'] ?? ''
      const county = extractCounty(address)
      const type = normalizeProgrammeType(r['Programme Type'] ?? '')
      const nfqLevel = normalizeNfq(r['NFQ Level'] ?? '')
      // Duration column name has different spacing in source
      const durationRaw = r['Duration (ECTS /Weeks per year)'] ?? r['Duration (ECTS / Weeks per year)'] ?? r['Duration'] ?? ''
      const hoursRaw = r['Hours per week'] ?? ''

      return {
        id: i + 1,
        ref: r['Programme Reference No'] ?? '',
        type,
        provider: r['Provider'] ?? '',
        providerSlug: slugify(r['Provider'] ?? ''),
        county,
        programmeTitle: r['Programme Title'] ?? '',
        awardingBody: r['Awarding Body'] ?? '',
        awardTitle: r['Award Title'] ?? '',
        duration: durationRaw,
        hoursPerWeek: hoursRaw,
        nfqLevel,
        entryLevel: r['Entry Level'] ?? '',
        exitLevel: r['Exit Level'] ?? '',
        address,
      }
    })

  console.log(`Built ${programmes.length} valid programme entries`)

  // ── Stats ─────────────────────────────────────────────────────────────────
  const byType: Record<string, number> = {}
  const byCounty: Record<string, number> = {}
  const byNfq: Record<string, number> = {}
  const providerSet = new Set<string>()

  for (const p of programmes) {
    byType[p.type] = (byType[p.type] ?? 0) + 1
    byCounty[p.county] = (byCounty[p.county] ?? 0) + 1
    byNfq[p.nfqLevel] = (byNfq[p.nfqLevel] ?? 0) + 1
    providerSet.add(p.provider)
  }

  const stats = {
    totalProgrammes: programmes.length,
    totalProviders: providerSet.size,
    byType: Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => ({ type, count })),
    byCounty: Object.entries(byCounty).sort((a, b) => b[1] - a[1]).map(([county, count]) => ({ county, count })),
    byNfq: Object.entries(byNfq).sort((a, b) => {
      const na = parseInt(a[0]) || 0
      const nb = parseInt(b[0]) || 0
      return nb - na
    }).map(([nfqLevel, count]) => ({ nfqLevel, count })),
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary = {
    lastUpdated: new Date().toISOString().split('T')[0],
    sourceUrl: ilepUrl,
    ...stats,
  }

  // ── Write files ───────────────────────────────────────────────────────────
  writeFileSync(join(OUT_DIR, 'programmes.json'), JSON.stringify(programmes, null, 2))
  writeFileSync(join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2))

  console.log(`\n✅ Done!`)
  console.log(`   ${programmes.length} programmes → programmes.json`)
  console.log(`   ${providerSet.size} unique providers`)
  console.log(`   Top counties: ${stats.byCounty.slice(0, 3).map(c => `${c.county} (${c.count})`).join(', ')}`)
  console.log(`   Types: ${stats.byType.map(t => `${t.type} (${t.count})`).join(', ')}`)
}

main().catch(err => { console.error('❌', err); process.exit(1) })
