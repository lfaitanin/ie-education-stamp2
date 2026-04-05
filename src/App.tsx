import { useState, useMemo, useRef } from 'react'
import { Analytics } from '@vercel/analytics/react'
import {
  Search, ExternalLink, MapPin, Clock, ChevronDown, ChevronUp,
  ArrowRight, Building2, X, ArrowLeft, CheckCircle,
} from 'lucide-react'
import programmesData from './data/programmes.json'
import summaryData from './data/summary.json'
import careerPathsData from './data/careerPaths.json'
import providersData from './data/providers.json'
import type { Programme, Summary, CareerPath, Provider } from './types'
import './index.css'

const programmes = programmesData as Programme[]
const summary = summaryData as Summary
const careerPaths = careerPathsData as CareerPath[]
const providers = providersData as Provider[]

// ─── helpers ─────────────────────────────────────────────────────────────────

function matchPath(p: Programme, path: CareerPath): boolean {
  if (path.id === 'language') return p.type === 'English Language'
  const text = `${p.programmeTitle} ${p.awardTitle}`.toLowerCase()
  return path.keywords.some(kw => text.includes(kw.toLowerCase()))
}

const TYPE_COLOR: Record<string, string> = {
  'English Language': 'bg-sky-100 text-sky-700',
  'Higher Education': 'bg-emerald-100 text-emerald-700',
  'Professional':     'bg-violet-100 text-violet-700',
  'Foundation':       'bg-orange-100 text-orange-700',
  'Other':            'bg-gray-100 text-gray-500',
}

const PAGE = 15

// ─── micro components ─────────────────────────────────────────────────────────

function Chip({ label, color }: { label: string; color: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{label}</span>
}

function FeeTag({ amount }: { amount: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-lg">
      €{amount.toLocaleString()}<span className="font-normal text-gray-500">/yr</span>
    </span>
  )
}

// ─── pathway stepper (hero visual) ───────────────────────────────────────────

function Pathway() {
  const steps = [
    { emoji: '📚', label: 'Pick a course' },
    { emoji: '✈️', label: 'Stamp 2 visa' },
    { emoji: '🎓', label: 'Graduate' },
    { emoji: '💼', label: 'Stamp 1G' },
    { emoji: '🏢', label: 'Sponsor' },
    { emoji: '🍀', label: 'Stamp 4' },
  ]
  return (
    <div className="flex items-center gap-1 flex-wrap justify-center">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="flex flex-col items-center">
            <span className="text-xl">{s.emoji}</span>
            <span className="text-[10px] text-gray-500 mt-0.5 whitespace-nowrap">{s.label}</span>
          </div>
          {i < steps.length - 1 && <ArrowRight size={12} className="text-gray-300 mb-3 flex-shrink-0" />}
        </div>
      ))}
    </div>
  )
}

// ─── career path selector grid ────────────────────────────────────────────────

function PathGrid({ onSelect }: { onSelect: (p: CareerPath) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {careerPaths.map(path => {
        const courseCount = programmes.filter(p => matchPath(p, path)).length
        const provCount = providers.filter(pv => pv.sectors.includes(path.id)).length
        return (
          <button
            key={path.id}
            onClick={() => onSelect(path)}
            className="group bg-white rounded-2xl border border-gray-200 p-4 text-left hover:border-green-400 hover:shadow-md transition-all active:scale-95"
          >
            <span className="text-3xl block mb-2">{path.icon}</span>
            <p className="font-bold text-gray-900 text-sm leading-snug mb-1">{path.label}</p>
            {path.permitsPerYear && (
              <p className="text-xs text-green-600 font-semibold mb-2">
                {path.permitsPerYear.toLocaleString()} permits/yr
              </p>
            )}
            <div className="flex gap-2 text-xs text-gray-400">
              <span>{provCount} unis</span>
              <span>·</span>
              <span>{courseCount} courses</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── provider card (in path results) ─────────────────────────────────────────

function ProviderRow({ pv, pathId, onOpen }: { pv: Provider; pathId: string; onOpen: () => void }) {
  const relevant = pv.topCourses.filter(c => c.sector === pathId)
  const minFee = relevant.length ? Math.min(...relevant.map(c => c.fee)) : pv.feesUG.min

  return (
    <button
      onClick={onOpen}
      className="w-full bg-white rounded-2xl border border-gray-200 p-4 text-left hover:border-green-400 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{pv.logo}</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">{pv.name}</p>
            <p className="text-xs text-gray-400">{pv.type} · <span className="flex items-center gap-0.5 inline-flex"><MapPin size={10} />{pv.city}</span></p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {pv.trustedIreland && <Chip label="TrustEd ✓" color="bg-blue-100 text-blue-700" />}
          {pv.ilep && <Chip label="ILEP ✓" color="bg-emerald-100 text-emerald-700" />}
        </div>
      </div>

      {/* Key info chips */}
      <div className="flex gap-2 flex-wrap mb-3">
        <span className="text-xs bg-green-50 text-green-700 font-semibold px-2.5 py-1 rounded-lg">
          From €{minFee.toLocaleString()}/yr
        </span>
        <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-lg">
          IELTS {pv.ielts.split(' ')[0]}
        </span>
        {pv.ranking && (
          <span className="text-xs bg-gray-50 text-gray-500 px-2.5 py-1 rounded-lg truncate max-w-[160px]">
            {pv.ranking.split(',')[0]}
          </span>
        )}
      </div>

      {/* Relevant courses inline */}
      {relevant.length > 0 && (
        <div className="border-t border-gray-50 pt-2 space-y-1.5">
          {relevant.slice(0, 2).map((c, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-xs text-gray-600 truncate pr-2">{c.title}</span>
              <FeeTag amount={c.fee} />
            </div>
          ))}
          {relevant.length > 2 && (
            <p className="text-xs text-gray-400">+{relevant.length - 2} more courses →</p>
          )}
        </div>
      )}
    </button>
  )
}

// ─── provider full detail ──────────────────────────────────────────────────────

function ProviderDetail({ pv, onBack }: { pv: Provider; onBack: () => void }) {
  const ilepCourses = programmes.filter(p => p.provider === pv.name)

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 font-medium">
        <ArrowLeft size={15} /> Back
      </button>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 px-5 py-6">
          <div className="flex items-start justify-between mb-3">
            <span className="text-5xl">{pv.logo}</span>
            <div className="flex gap-1.5 flex-wrap justify-end">
              {pv.trustedIreland && <Chip label="TrustEd Ireland ✓" color="bg-white text-blue-700 shadow-sm" />}
              {pv.ilep && <Chip label="ILEP Approved ✓" color="bg-white text-emerald-700 shadow-sm" />}
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{pv.name}</h2>
          <p className="text-sm text-gray-600">{pv.type} · {pv.city}</p>
          <p className="text-xs text-gray-500 mt-1">{pv.ranking}</p>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-600 mb-5">{pv.description}</p>

          {/* Fee cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-green-50 p-3">
              <p className="text-xs font-semibold text-green-600 mb-1">🎓 Undergrad (non-EU)</p>
              <p className="text-lg font-black text-green-800">
                €{pv.feesUG.min.toLocaleString()}
                {pv.feesUG.max !== pv.feesUG.min && `–${pv.feesUG.max.toLocaleString()}`}
              </p>
              <p className="text-xs text-green-600 mt-0.5">per year</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3">
              <p className="text-xs font-semibold text-blue-600 mb-1">🏫 Masters (non-EU)</p>
              <p className="text-lg font-black text-blue-800">
                €{pv.feePG.min.toLocaleString()}
                {pv.feePG.max !== pv.feePG.min && `–${pv.feePG.max.toLocaleString()}`}
              </p>
              <p className="text-xs text-blue-600 mt-0.5">per year</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-600 mb-1">🗣️ English Req.</p>
              <p className="text-lg font-black text-amber-800">
                IELTS {pv.ielts.split(' ')[0]}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">{pv.ielts}</p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex gap-2 flex-wrap">
            <a href={pv.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors">
              Apply / Visit <ExternalLink size={13} />
            </a>
            <a href={pv.feesUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:border-green-300 transition-colors">
              Full Fee Schedule <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* All courses at this uni */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-4">📋 Available Courses & Fees</h3>
        <div className="divide-y divide-gray-50">
          {pv.topCourses.map((c, i) => {
            const path = careerPaths.find(cp => cp.id === c.sector)
            return (
              <div key={i} className="py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    {path && <span>{path.icon}</span>}
                    <span className="font-semibold text-gray-900 text-sm">{c.title}</span>
                    {c.nfq && <Chip label={`NFQ ${c.nfq}`} color="bg-gray-100 text-gray-500" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock size={10} /><span>{c.duration}</span>
                    {path && <span>· {path.label}</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-gray-900">€{c.fee.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">per year</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Journey */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-green-800 uppercase tracking-wide mb-3">Your journey from {pv.shortName}</p>
        <Pathway />
      </div>

      {/* ILEP courses */}
      {ilepCourses.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-3">📜 ILEP Approved Courses ({ilepCourses.length})</h3>
          <div className="space-y-2">
            {ilepCourses.slice(0, 8).map(p => (
              <div key={p.id} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                <Chip label={p.type} color={TYPE_COLOR[p.type] ?? TYPE_COLOR['Other']} />
                {p.nfqLevel !== 'N/A' && p.nfqLevel && <Chip label={`NFQ ${p.nfqLevel}`} color="bg-gray-100 text-gray-500" />}
                <span className="text-sm text-gray-700 flex-1">{p.programmeTitle}</span>
                {p.duration && <span className="text-xs text-gray-400 flex-shrink-0">{p.duration}</span>}
              </div>
            ))}
            {ilepCourses.length > 8 && (
              <p className="text-xs text-gray-400 pt-1">+{ilepCourses.length - 8} more ILEP courses at this provider</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── career path results page ─────────────────────────────────────────────────

function PathResults({
  path, onBack, onOpenProvider,
}: {
  path: CareerPath
  onBack: () => void
  onOpenProvider: (pv: Provider) => void
}) {
  const pathProviders = providers.filter(pv => pv.sectors.includes(path.id))
  const courses = programmes.filter(p => matchPath(p, path))
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const coursesRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return q
      ? courses.filter(p => p.programmeTitle.toLowerCase().includes(q) || p.provider.toLowerCase().includes(q))
      : courses
  }, [courses, search])

  const totalPages = Math.ceil(filtered.length / PAGE)
  const paged = filtered.slice((page - 1) * PAGE, page * PAGE)

  return (
    <div className="space-y-5">
      {/* Back + title */}
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 font-medium mb-3">
          <ArrowLeft size={15} /> All career paths
        </button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{path.icon}</span>
          <div>
            <h2 className="text-xl font-black text-gray-900">{path.label}</h2>
            <p className="text-sm text-gray-500">{path.sectorName}</p>
          </div>
          {path.permitsPerYear && (
            <div className="ml-auto bg-green-100 rounded-xl px-3 py-1.5 text-center">
              <p className="text-xl font-black text-green-700">{path.permitsPerYear.toLocaleString()}</p>
              <p className="text-xs text-green-600">permits/yr</p>
            </div>
          )}
        </div>
      </div>

      {/* Journey strip */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-4">
        <Pathway />
      </div>

      {/* Top sponsors */}
      {path.topSponsors.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Building2 size={13} /> Who's hiring? Top work permit sponsors
          </p>
          <div className="flex flex-wrap gap-2">
            {path.topSponsors.map(s => (
              <a key={s.slug}
                href={`https://ie-work-permits.com/companies/${s.slug}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-xl text-sm text-gray-700 font-medium hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-colors">
                {s.name} <ExternalLink size={10} className="text-gray-400" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Universities */}
      {pathProviders.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            🏛️ Where to study
            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{pathProviders.length} institutions</span>
          </h3>
          <div className="space-y-3">
            {pathProviders.map(pv => (
              <ProviderRow key={pv.slug} pv={pv} pathId={path.id} onOpen={() => onOpenProvider(pv)} />
            ))}
          </div>
        </div>
      )}

      {/* ILEP courses */}
      <div ref={coursesRef}>
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          📋 ILEP Approved Courses
          <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{courses.length} courses</span>
        </h3>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            No ILEP courses found for this career path yet.
          </div>
        ) : (
          <>
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Filter courses..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-white" />
            </div>

            <div className="space-y-2">
              {paged.map(p => (
                <div key={p.id}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <button className="w-full text-left px-4 py-3.5 flex items-start gap-3"
                    onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        <Chip label={p.type} color={TYPE_COLOR[p.type] ?? TYPE_COLOR['Other']} />
                        {p.nfqLevel !== 'N/A' && p.nfqLevel && <Chip label={`NFQ ${p.nfqLevel}`} color="bg-gray-100 text-gray-500" />}
                        <Chip label="✓ Stamp 2" color="bg-emerald-100 text-emerald-700" />
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">{p.programmeTitle}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.provider}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-400">
                        {p.county !== 'Unknown' && <span className="flex items-center gap-0.5"><MapPin size={10} />{p.county}</span>}
                        {p.duration && <span className="flex items-center gap-0.5"><Clock size={10} />{p.duration}</span>}
                      </div>
                    </div>
                    {expanded === p.id ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0 mt-1" />}
                  </button>

                  {expanded === p.id && (
                    <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-1.5 text-xs">
                      {p.awardTitle && <p><span className="text-gray-400">Award: </span><span className="text-gray-700">{p.awardTitle}</span></p>}
                      {p.hoursPerWeek && p.hoursPerWeek !== 'n/a' && <p><span className="text-gray-400">Hours/week: </span><span className="text-gray-700">{p.hoursPerWeek}</span></p>}
                      {p.entryLevel !== 'n/a' && <p><span className="text-gray-400">Entry level: </span><span className="text-gray-700">{p.entryLevel}</span></p>}
                      {p.exitLevel !== 'n/a' && <p><span className="text-gray-400">Exit level: </span><span className="text-gray-700">{p.exitLevel}</span></p>}
                      {p.address && <p><span className="text-gray-400">Address: </span><span className="text-gray-700">{p.address}</span></p>}
                      <p className="text-gray-300 pt-1">Ref: {p.ref}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-4">
                <button onClick={() => { setPage(p => Math.max(1, p - 1)); coursesRef.current?.scrollIntoView() }}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50">← Prev</button>
                <span className="text-sm text-gray-500">{page} / {totalPages}</span>
                <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); coursesRef.current?.scrollIntoView() }}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── all courses search view ──────────────────────────────────────────────────

function AllCourses() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [filterCounty, setFilterCounty] = useState('All')
  const [filterNfq, setFilterNfq] = useState('All')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const topRef = useRef<HTMLDivElement>(null)

  const allTypes = ['All', ...summary.byType.map(t => t.type)]
  const allCounties = ['All', ...summary.byCounty.slice(0, 12).map(c => c.county)]
  const hasFilters = search || filterType !== 'All' || filterCounty !== 'All' || filterNfq !== 'All'

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return programmes.filter(p => {
      if (filterType !== 'All' && p.type !== filterType) return false
      if (filterCounty !== 'All' && p.county !== filterCounty) return false
      if (filterNfq !== 'All' && p.nfqLevel !== filterNfq) return false
      if (q && !p.programmeTitle.toLowerCase().includes(q) && !p.provider.toLowerCase().includes(q)) return false
      return true
    })
  }, [search, filterType, filterCounty, filterNfq])

  const totalPages = Math.ceil(filtered.length / PAGE)
  const paged = filtered.slice((page - 1) * PAGE, page * PAGE)

  return (
    <div ref={topRef}>
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search any course or college..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400 bg-white" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { val: filterType, set: setFilterType, opts: allTypes, def: 'All Types' },
            { val: filterCounty, set: setFilterCounty, opts: allCounties, def: 'All Counties' },
            { val: filterNfq, set: (v: string) => setFilterNfq(v), opts: ['All', '9', '8', '7', '6', 'N/A'], def: 'All NFQ' },
          ].map((f, i) => (
            <select key={i} value={f.val}
              onChange={e => { f.set(e.target.value); setPage(1) }}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-green-400 bg-white font-medium text-gray-700">
              {f.opts.map(o => <option key={o} value={o}>{o === 'All' ? f.def : o === 'N/A' ? 'No NFQ' : /^\d$/.test(o) ? `NFQ ${o}` : o}</option>)}
            </select>
          ))}
          {hasFilters && (
            <button onClick={() => { setSearch(''); setFilterType('All'); setFilterCounty('All'); setFilterNfq('All'); setPage(1) }}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2">
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-sm font-medium text-gray-600">{filtered.length.toLocaleString()} programmes</p>
        {totalPages > 1 && <p className="text-xs text-gray-400">Page {page}/{totalPages}</p>}
      </div>

      <div className="space-y-2 mb-4">
        {paged.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-gray-400 text-sm">No results. Try different filters.</p>
          </div>
        ) : paged.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button className="w-full text-left px-4 py-3.5 flex items-start gap-3"
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1.5 mb-1">
                  <Chip label={p.type} color={TYPE_COLOR[p.type] ?? TYPE_COLOR['Other']} />
                  {p.nfqLevel !== 'N/A' && p.nfqLevel && <Chip label={`NFQ ${p.nfqLevel}`} color="bg-gray-100 text-gray-500" />}
                </div>
                <p className="font-semibold text-gray-900 text-sm">{p.programmeTitle}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.provider}{p.county !== 'Unknown' ? ` · ${p.county}` : ''}</p>
              </div>
              {expanded === p.id ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown size={15} className="text-gray-400 flex-shrink-0 mt-1" />}
            </button>
            {expanded === p.id && (
              <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-1.5 text-xs">
                {p.awardTitle && <p><span className="text-gray-400">Award: </span><span className="text-gray-700">{p.awardTitle}</span></p>}
                {p.awardingBody && <p><span className="text-gray-400">Awarded by: </span><span className="text-gray-700">{p.awardingBody}</span></p>}
                {p.duration && <p><span className="text-gray-400">Duration: </span><span className="text-gray-700">{p.duration}</span></p>}
                {p.hoursPerWeek && p.hoursPerWeek !== 'n/a' && <p><span className="text-gray-400">Hours/week: </span><span className="text-gray-700">{p.hoursPerWeek}</span></p>}
                {(p.entryLevel && p.entryLevel !== 'n/a') || (p.exitLevel && p.exitLevel !== 'n/a') ? (
                  <p><span className="text-gray-400">Level: </span>
                    <span className="text-gray-700">
                      {p.entryLevel !== 'n/a' ? `Entry ${p.entryLevel}` : ''}
                      {p.entryLevel !== 'n/a' && p.exitLevel !== 'n/a' ? ' → ' : ''}
                      {p.exitLevel !== 'n/a' ? `Exit ${p.exitLevel}` : ''}
                    </span>
                  </p>
                ) : null}
                {p.address && <p><span className="text-gray-400">Address: </span><span className="text-gray-700">{p.address}</span></p>}
                <div className="mt-2 bg-green-50 rounded-lg px-3 py-2 flex items-center gap-1.5 flex-wrap font-medium text-green-800">
                  <CheckCircle size={12} className="text-green-500" />
                  <span>Stamp 2 eligible</span>
                  <ArrowRight size={10} className="text-green-300" />
                  <span>Stamp 1G</span>
                  <ArrowRight size={10} className="text-green-300" />
                  <span>Work Permit</span>
                  <ArrowRight size={10} className="text-green-300" />
                  <span>Stamp 4 🍀</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button onClick={() => { setPage(p => Math.max(1, p - 1)); topRef.current?.scrollIntoView() }}
            disabled={page === 1} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50">← Prev</button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button onClick={() => { setPage(p => Math.min(totalPages, p + 1)); topRef.current?.scrollIntoView() }}
            disabled={page === totalPages} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 disabled:opacity-30 hover:bg-gray-50">Next →</button>
        </div>
      )}
    </div>
  )
}

// ─── root app ─────────────────────────────────────────────────────────────────

export default function App() {
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [showAllCourses, setShowAllCourses] = useState(false)

  // Scroll to top on navigation
  function goToPath(path: CareerPath) {
    setSelectedPath(path)
    setSelectedProvider(null)
    setShowAllCourses(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function goToProvider(pv: Provider) {
    setSelectedProvider(pv)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function goHome() {
    setSelectedPath(null)
    setSelectedProvider(null)
    setShowAllCourses(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function goBackFromProvider() {
    setSelectedProvider(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const inDeep = selectedPath || selectedProvider || showAllCourses

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={goHome} className="flex items-center gap-2 font-black text-gray-900 text-base">
            🎓 <span>IE Education</span>
          </button>
          <div className="flex items-center gap-2">
            {inDeep && (
              <button onClick={goHome}
                className="text-xs text-gray-500 hover:text-green-600 font-medium flex items-center gap-1">
                <ArrowLeft size={13} /> Home
              </button>
            )}
            <button
              onClick={() => { setShowAllCourses(true); setSelectedPath(null); setSelectedProvider(null) }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${showAllCourses ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              All ILEP
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-4 py-6 w-full">

        {/* ── HOME ── */}
        {!inDeep && (
          <>
            {/* Hero */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                🍀 {summary.totalProgrammes.toLocaleString()} Stamp 2 approved courses
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 leading-tight">
                Study in Ireland.<br />
                <span className="text-green-600">Land a sponsor.</span>
              </h1>
              <p className="text-gray-500 text-base mb-6 max-w-sm mx-auto">
                Find courses, compare universities, fees & requirements — all mapped to the companies that hire.
              </p>
              <Pathway />
            </div>

            {/* ILEP notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex gap-3 mb-7 text-left">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div>
                <p className="text-xs font-bold text-amber-900 mb-0.5">ILEP is transitioning to TrustEd Ireland (2026)</p>
                <p className="text-xs text-amber-800">
                  Public universities (TCD, UCD…) accept Stamp 2 students independently.
                  Private colleges & language schools use the ILEP list (last updated Feb 2026).{' '}
                  <a href="https://www.qqi.ie/what-we-do/quality-assurance-of-education-and-training/what-is-trusted-ireland/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">TrustEd Ireland →</a>
                </p>
              </div>
            </div>

            {/* THE main CTA */}
            <div className="mb-3">
              <p className="text-lg font-black text-gray-900 mb-1">
                What do you want to do in Ireland? 👇
              </p>
              <p className="text-sm text-gray-400 mb-4">Tap a career to see universities, fees and top employers</p>
              <PathGrid onSelect={goToPath} />
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => { setShowAllCourses(true) }}
                className="bg-white rounded-2xl border border-gray-200 p-4 text-left hover:border-green-300 transition-all">
                <span className="text-2xl block mb-2">📋</span>
                <p className="font-bold text-gray-900 text-sm">All ILEP Courses</p>
                <p className="text-xs text-gray-400 mt-0.5">Search all {summary.totalProgrammes.toLocaleString()} programmes</p>
              </button>
              <a href="https://ie-work-permits.com" target="_blank" rel="noopener noreferrer"
                className="bg-white rounded-2xl border border-gray-200 p-4 text-left hover:border-green-300 transition-all">
                <span className="text-2xl block mb-2">🏢</span>
                <p className="font-bold text-gray-900 text-sm">Sponsor Companies</p>
                <p className="text-xs text-gray-400 mt-0.5">18,000+ companies that hire</p>
              </a>
            </div>
          </>
        )}

        {/* ── PATH DETAIL ── */}
        {selectedPath && !selectedProvider && !showAllCourses && (
          <PathResults path={selectedPath} onBack={goHome} onOpenProvider={goToProvider} />
        )}

        {/* ── PROVIDER DETAIL ── */}
        {selectedProvider && (
          <ProviderDetail pv={selectedProvider} onBack={goBackFromProvider} />
        )}

        {/* ── ALL COURSES ── */}
        {showAllCourses && !selectedPath && !selectedProvider && (
          <>
            <div className="mb-5">
              <h2 className="text-xl font-black text-gray-900">All ILEP Courses</h2>
              <p className="text-sm text-gray-400">{summary.totalProgrammes.toLocaleString()} programmes · {summary.totalProviders} providers</p>
            </div>
            <AllCourses />
          </>
        )}

        {/* Source */}
        <p className="text-xs text-gray-300 mt-8 text-center">
          ILEP data:{' '}
          <a href={summary.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">irishimmigration.ie</a>
          {' '}· Sponsor data:{' '}
          <a href="https://ie-work-permits.com" target="_blank" rel="noopener noreferrer" className="underline">ie-work-permits.com</a>
          {' '}· Fees indicative · {summary.lastUpdated}
        </p>
      </main>

      <footer className="border-t border-gray-100 bg-white px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <span>Built by <span className="font-semibold text-gray-600">Luiz Faitanin</span></span>
          <a href="https://irishventures.ie" className="hover:text-gray-600">irishventures.ie →</a>
        </div>
      </footer>

      <Analytics />
    </div>
  )
}
