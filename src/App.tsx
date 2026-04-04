import { useState, useMemo } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { GraduationCap, Search, ExternalLink, BookOpen, MapPin, Clock, Award, ChevronDown, ChevronUp, X } from 'lucide-react'
import programmesData from './data/programmes.json'
import summaryData from './data/summary.json'
import type { Programme, Summary } from './types'
import './index.css'

const programmes = programmesData as Programme[]
const summary = summaryData as Summary

const TYPE_COLORS: Record<string, string> = {
  'English Language': 'bg-blue-100 text-blue-700',
  'Higher Education': 'bg-green-100 text-green-700',
  'Professional':     'bg-purple-100 text-purple-700',
  'Foundation':       'bg-orange-100 text-orange-700',
  'Other':            'bg-gray-100 text-gray-600',
}

const NFQ_LABEL: Record<string, string> = {
  '6': 'NFQ 6 · Higher Certificate',
  '7': 'NFQ 7 · Ordinary Bachelor',
  '8': 'NFQ 8 · Honours Bachelor / Higher Diploma',
  '9': 'NFQ 9 · Master / Postgraduate Diploma',
  'N/A': 'No NFQ',
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

function ProgrammeCard({ p, expanded, onToggle }: { p: Programme; expanded: boolean; onToggle: () => void }) {
  const typeColor = TYPE_COLORS[p.type] ?? TYPE_COLORS['Other']
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-green-200 transition-colors">
      <button
        className="w-full text-left px-4 py-4 flex items-start gap-3"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge label={p.type} className={typeColor} />
            {p.nfqLevel !== 'N/A' && p.nfqLevel && (
              <Badge label={`NFQ ${p.nfqLevel}`} className="bg-gray-100 text-gray-600" />
            )}
            <Badge label="✓ Stamp 2 ILEP" className="bg-emerald-100 text-emerald-700" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{p.programmeTitle}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{p.provider}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {p.county && p.county !== 'Unknown' && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={11} />{p.county}
              </span>
            )}
            {p.duration && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={11} />{p.duration}
              </span>
            )}
            {p.awardingBody && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Award size={11} />{p.awardingBody}
              </span>
            )}
          </div>
        </div>
        <div className="text-gray-400 flex-shrink-0 mt-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-2">
          {p.awardTitle && (
            <div className="text-xs"><span className="text-gray-400">Award: </span><span className="text-gray-700">{p.awardTitle}</span></div>
          )}
          {p.hoursPerWeek && p.hoursPerWeek !== 'n/a' && (
            <div className="text-xs"><span className="text-gray-400">Hours/week: </span><span className="text-gray-700">{p.hoursPerWeek}</span></div>
          )}
          {p.nfqLevel !== 'N/A' && p.nfqLevel && (
            <div className="text-xs"><span className="text-gray-400">NFQ: </span><span className="text-gray-700">{NFQ_LABEL[p.nfqLevel] ?? p.nfqLevel}</span></div>
          )}
          {(p.entryLevel || p.exitLevel) && (p.entryLevel !== 'n/a' || p.exitLevel !== 'n/a') && (
            <div className="text-xs">
              <span className="text-gray-400">Level: </span>
              <span className="text-gray-700">
                {p.entryLevel && p.entryLevel !== 'n/a' ? `Entry ${p.entryLevel}` : ''}
                {p.entryLevel && p.entryLevel !== 'n/a' && p.exitLevel && p.exitLevel !== 'n/a' ? ' → ' : ''}
                {p.exitLevel && p.exitLevel !== 'n/a' ? `Exit ${p.exitLevel}` : ''}
              </span>
            </div>
          )}
          {p.address && (
            <div className="text-xs"><span className="text-gray-400">Address: </span><span className="text-gray-700">{p.address}</span></div>
          )}
          <div className="text-xs text-gray-400 pt-1">Ref: {p.ref}</div>

          {/* Pathway banner */}
          <div className="mt-3 bg-green-50 rounded-xl px-3 py-2 flex items-center gap-2 flex-wrap text-xs text-green-800 font-medium">
            <span>📚 Course</span>
            <span className="text-green-400">→</span>
            <span>🎓 Stamp 2</span>
            <span className="text-green-400">→</span>
            <span>💼 Stamp 1G</span>
            <span className="text-green-400">→</span>
            <span>🏢 Work Permit</span>
            <span className="text-green-400">→</span>
            <span>🍀 Stamp 4</span>
          </div>
        </div>
      )}
    </div>
  )
}

const PAGE_SIZE = 20

export default function App() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [filterCounty, setFilterCounty] = useState('All')
  const [filterNfq, setFilterNfq] = useState('All')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const allTypes = ['All', ...summary.byType.map(t => t.type)]
  const allCounties = ['All', ...summary.byCounty.slice(0, 15).map(c => c.county)]
  const allNfq = ['All', '9', '8', '7', '6', 'N/A']

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return programmes.filter(p => {
      if (filterType !== 'All' && p.type !== filterType) return false
      if (filterCounty !== 'All' && p.county !== filterCounty) return false
      if (filterNfq !== 'All' && p.nfqLevel !== filterNfq) return false
      if (q && !p.programmeTitle.toLowerCase().includes(q) &&
          !p.provider.toLowerCase().includes(q) &&
          !p.awardTitle.toLowerCase().includes(q)) return false
      return true
    })
  }, [search, filterType, filterCounty, filterNfq])

  // Reset page when filters change
  const resetPage = () => setPage(1)

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const hasFilters = search || filterType !== 'All' || filterCounty !== 'All' || filterNfq !== 'All'

  function clearFilters() {
    setSearch('')
    setFilterType('All')
    setFilterCounty('All')
    setFilterNfq('All')
    setPage(1)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="https://irishventures.ie" className="flex items-center gap-2 font-bold text-gray-900">
            <GraduationCap size={20} className="text-green-600" />
            <span>IE Education Explorer</span>
          </a>
          <span className="text-xs text-gray-400 hidden sm:block">
            ILEP · Updated {summary.lastUpdated}
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">

        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Ireland Education Explorer
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Official ILEP — all courses approved for Stamp 2 student visa · {summary.totalProgrammes.toLocaleString()} programmes · {summary.totalProviders} providers
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="text-xs text-gray-400 mb-1">Total Programmes</div>
              <div className="text-2xl font-bold text-gray-900">{summary.totalProgrammes.toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-1">Stamp 2 approved</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="text-xs text-gray-400 mb-1">Providers</div>
              <div className="text-2xl font-bold text-gray-900">{summary.totalProviders}</div>
              <div className="text-xs text-gray-400 mt-1">Colleges & schools</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="text-xs text-gray-400 mb-1">Top Location</div>
              <div className="text-xl font-bold text-gray-900">{summary.byCounty[0]?.county}</div>
              <div className="text-xs text-gray-400 mt-1">{summary.byCounty[0]?.count} programmes</div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="text-xs text-gray-400 mb-1">English Language</div>
              <div className="text-xl font-bold text-gray-900">{summary.byType.find(t => t.type === 'English Language')?.count ?? 0}</div>
              <div className="text-xs text-gray-400 mt-1">courses</div>
            </div>
          </div>

          {/* Stamp 2 pathway info */}
          <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 flex items-start gap-3 mb-2">
            <BookOpen size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">What is Stamp 2?</p>
              <p className="text-xs text-green-700 mt-0.5">
                Stamp 2 is a student visa for Ireland. To qualify, your course must be on the ILEP list below.
                After graduating, you can apply for Stamp 1G (job-seeking), then a Work Permit, and eventually Stamp 4 (long-term residency).
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search course or provider..."
                value={search}
                onChange={e => { setSearch(e.target.value); resetPage() }}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400"
              />
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                <X size={12} /> Clear
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <select
              value={filterType}
              onChange={e => { setFilterType(e.target.value); resetPage() }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-green-400 bg-white"
            >
              {allTypes.map(t => (
                <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>
              ))}
            </select>

            <select
              value={filterCounty}
              onChange={e => { setFilterCounty(e.target.value); resetPage() }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-green-400 bg-white"
            >
              {allCounties.map(c => (
                <option key={c} value={c}>{c === 'All' ? 'All Counties' : c}</option>
              ))}
            </select>

            <select
              value={filterNfq}
              onChange={e => { setFilterNfq(e.target.value); resetPage() }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-green-400 bg-white"
            >
              {allNfq.map(n => (
                <option key={n} value={n}>
                  {n === 'All' ? 'All NFQ Levels' : n === 'N/A' ? 'No NFQ' : `NFQ ${n}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-sm text-gray-500">
            {filtered.length.toLocaleString()} programme{filtered.length !== 1 ? 's' : ''} found
          </p>
          {totalPages > 1 && (
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
          )}
        </div>

        {/* Programme list */}
        <div className="space-y-2 mb-6">
          {paged.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
              No programmes match your filters.
            </div>
          ) : (
            paged.map(p => (
              <ProgrammeCard
                key={p.id}
                p={p}
                expanded={expandedId === p.id}
                onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              ← Prev
            </button>
            <span className="px-4 py-2 text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        )}

        {/* Source note */}
        <p className="text-xs text-gray-400 text-center">
          Data from{' '}
          <a href={summary.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 inline-flex items-center gap-0.5">
            ILEP — Irish Immigration Service <ExternalLink size={10} />
          </a>
          {' '}· Updated {summary.lastUpdated}
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-4 py-4 mt-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <span>Built by <span className="font-medium text-gray-600">Luiz Faitanin</span></span>
          <a href="https://irishventures.ie" className="hover:text-gray-600 transition-colors">
            irishventures.ie →
          </a>
        </div>
      </footer>

      <Analytics />
    </div>
  )
}
