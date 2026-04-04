import { useState, useMemo } from 'react'
import { Analytics } from '@vercel/analytics/react'
import {
  GraduationCap, Search, ExternalLink, BookOpen,
  MapPin, Clock, Award, ChevronDown, ChevronUp,
  X, TrendingUp, Building2, ArrowRight, Briefcase,
  DollarSign, CheckCircle, University,
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<string, string> = {
  'English Language': 'bg-blue-100 text-blue-700',
  'Higher Education':  'bg-green-100 text-green-700',
  'Professional':      'bg-purple-100 text-purple-700',
  'Foundation':        'bg-orange-100 text-orange-700',
  'Other':             'bg-gray-100 text-gray-600',
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}

function matchesCareerPath(p: Programme, path: CareerPath): boolean {
  if (path.id === 'language') return p.type === 'English Language'
  const text = `${p.programmeTitle} ${p.awardTitle}`.toLowerCase()
  return path.keywords.some(kw => text.includes(kw.toLowerCase()))
}

function getMatchingCourses(path: CareerPath): Programme[] {
  return programmes.filter(p => matchesCareerPath(p, path))
}

function getProvidersForPath(path: CareerPath): Provider[] {
  return providers.filter(pv => pv.sectors.includes(path.id))
}

const PAGE_SIZE = 20

// ── Programme Card ────────────────────────────────────────────────────────────

function ProgrammeCard({ p, expanded, onToggle }: {
  p: Programme; expanded: boolean; onToggle: () => void
}) {
  const typeColor = TYPE_BADGE[p.type] ?? TYPE_BADGE['Other']
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-green-200 transition-colors">
      <button className="w-full text-left px-4 py-4 flex items-start gap-3" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <Badge label={p.type} className={typeColor} />
            {p.nfqLevel !== 'N/A' && p.nfqLevel && (
              <Badge label={`NFQ ${p.nfqLevel}`} className="bg-gray-100 text-gray-600" />
            )}
            <Badge label="✓ Stamp 2" className="bg-emerald-100 text-emerald-700" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{p.programmeTitle}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{p.provider}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {p.county && p.county !== 'Unknown' && (
              <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin size={11} />{p.county}</span>
            )}
            {p.duration && (
              <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={11} />{p.duration}</span>
            )}
            {p.awardingBody && (
              <span className="flex items-center gap-1 text-xs text-gray-400"><Award size={11} />{p.awardingBody}</span>
            )}
          </div>
        </div>
        <div className="text-gray-400 flex-shrink-0 mt-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-2">
          {p.awardTitle && <div className="text-xs"><span className="text-gray-400">Award: </span><span className="text-gray-700">{p.awardTitle}</span></div>}
          {p.hoursPerWeek && p.hoursPerWeek !== 'n/a' && <div className="text-xs"><span className="text-gray-400">Hours/week: </span><span className="text-gray-700">{p.hoursPerWeek}</span></div>}
          {p.nfqLevel !== 'N/A' && p.nfqLevel && <div className="text-xs"><span className="text-gray-400">NFQ Level: </span><span className="text-gray-700">{p.nfqLevel}</span></div>}
          {(p.entryLevel || p.exitLevel) && (p.entryLevel !== 'n/a' || p.exitLevel !== 'n/a') && (
            <div className="text-xs">
              <span className="text-gray-400">English Level: </span>
              <span className="text-gray-700">
                {p.entryLevel !== 'n/a' ? `Entry ${p.entryLevel}` : ''}
                {p.entryLevel !== 'n/a' && p.exitLevel !== 'n/a' ? ' → ' : ''}
                {p.exitLevel !== 'n/a' ? `Exit ${p.exitLevel}` : ''}
              </span>
            </div>
          )}
          {p.address && <div className="text-xs"><span className="text-gray-400">Address: </span><span className="text-gray-700">{p.address}</span></div>}
          <div className="text-xs text-gray-400 pt-1">ILEP Ref: {p.ref}</div>
          <div className="mt-3 bg-green-50 rounded-xl px-3 py-2 flex items-center gap-2 flex-wrap text-xs text-green-800 font-medium">
            <span>📚 Stamp 2</span>
            <ArrowRight size={12} className="text-green-400" />
            <span>💼 Stamp 1G</span>
            <ArrowRight size={12} className="text-green-400" />
            <span>🏢 Work Permit</span>
            <ArrowRight size={12} className="text-green-400" />
            <span>🍀 Stamp 4</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Provider Card (list) ──────────────────────────────────────────────────────

function ProviderCard({ pv, onClick }: { pv: Provider; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-4 text-left hover:border-green-300 hover:shadow-sm transition-all w-full"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{pv.logo}</span>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{pv.shortName}</h3>
            <p className="text-xs text-gray-500">{pv.type}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {pv.trustedIreland && <Badge label="TrustEd ✓" className="bg-blue-100 text-blue-700" />}
          {pv.ilep && <Badge label="ILEP ✓" className="bg-emerald-100 text-emerald-700" />}
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{pv.description}</p>
      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
        <span className="flex items-center gap-1"><MapPin size={10} />{pv.city}</span>
        <span className="flex items-center gap-1"><DollarSign size={10} />From €{pv.feesUG.min.toLocaleString()}/yr</span>
        <span className="flex items-center gap-1"><Award size={10} />IELTS {pv.ielts.split(' ')[0]}</span>
      </div>
    </button>
  )
}

// ── Provider Detail Page ──────────────────────────────────────────────────────

function ProviderDetail({ pv, onClose }: { pv: Provider; onClose: () => void }) {
  const ilep = programmes.filter(p => p.provider === pv.name)

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600">
        ← Back to universities
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{pv.logo}</span>
            <div>
              <h2 className="font-bold text-gray-900 text-xl">{pv.name}</h2>
              <p className="text-sm text-gray-500">{pv.type} · {pv.city}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {pv.trustedIreland && <Badge label="TrustEd Ireland ✓" className="bg-blue-100 text-blue-700" />}
            {pv.ilep && <Badge label="ILEP Approved ✓" className="bg-emerald-100 text-emerald-700" />}
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">{pv.description}</p>

        <div className="text-xs text-gray-500 mb-4 flex items-center gap-1">
          <Award size={12} />
          <span>{pv.ranking}</span>
        </div>

        {/* Fees grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-green-50 rounded-xl p-3">
            <div className="text-xs text-green-600 font-medium mb-1">Undergraduate Fees (non-EU)</div>
            <div className="text-lg font-bold text-green-700">
              €{pv.feesUG.min.toLocaleString()} – €{pv.feesUG.max.toLocaleString()}
            </div>
            <div className="text-xs text-green-600 mt-0.5">{pv.feesUG.note}</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="text-xs text-blue-600 font-medium mb-1">Postgrad / Masters Fees</div>
            <div className="text-lg font-bold text-blue-700">
              €{pv.feePG.min.toLocaleString()} – €{pv.feePG.max.toLocaleString()}
            </div>
            <div className="text-xs text-blue-600 mt-0.5">{pv.feePG.note}</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3">
            <div className="text-xs text-amber-600 font-medium mb-1">English Requirement</div>
            <div className="text-base font-bold text-amber-700">IELTS {pv.ielts.split(' ')[0]}</div>
            <div className="text-xs text-amber-600 mt-0.5">{pv.ielts}</div>
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-2 flex-wrap">
          <a href={pv.website} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 transition-colors">
            Visit Website <ExternalLink size={13} />
          </a>
          <a href={pv.feesUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-xl hover:bg-gray-50 transition-colors">
            Full Fee Schedule <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Top courses */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <GraduationCap size={16} className="text-green-600" />
          Popular Courses & Fees
        </h3>
        <div className="space-y-2">
          {pv.topCourses.map((c, i) => {
            const path = careerPaths.find(cp => cp.id === c.sector)
            return (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {path && <span className="text-sm">{path.icon}</span>}
                    <span className="font-medium text-gray-900 text-sm">{c.title}</span>
                    {c.nfq && <Badge label={`NFQ ${c.nfq}`} className="bg-gray-100 text-gray-600" />}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1"><Clock size={10} />{c.duration}</span>
                    {path && <span className="flex items-center gap-1"><Briefcase size={10} />{path.label}</span>}
                  </div>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <div className="font-bold text-gray-900 text-sm">€{c.fee.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">per year</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pathway */}
      <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3">
        <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-2">
          <BookOpen size={14} /> Your journey from here:
        </p>
        <div className="flex items-center gap-2 flex-wrap text-sm text-green-800 font-medium">
          <span>📚 Enrol at {pv.shortName}</span>
          <ArrowRight size={13} className="text-green-400" />
          <span>🎓 Stamp 2</span>
          <ArrowRight size={13} className="text-green-400" />
          <span>💼 Stamp 1G (1 yr job seeking)</span>
          <ArrowRight size={13} className="text-green-400" />
          <span>🏢 Work Permit Sponsor</span>
          <ArrowRight size={13} className="text-green-400" />
          <span>🍀 Stamp 4</span>
        </div>
      </div>

      {/* ILEP courses from this provider (if any) */}
      {ilep.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">
            ILEP Courses at {pv.shortName} ({ilep.length})
          </h3>
          <div className="space-y-2">
            {ilep.slice(0, 10).map(p => (
              <div key={p.id} className="py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge label={p.type} className={TYPE_BADGE[p.type] ?? TYPE_BADGE['Other']} />
                  {p.nfqLevel !== 'N/A' && p.nfqLevel && <Badge label={`NFQ ${p.nfqLevel}`} className="bg-gray-100 text-gray-600" />}
                </div>
                <p className="font-medium text-gray-900 text-sm mt-1">{p.programmeTitle}</p>
                {p.duration && <p className="text-xs text-gray-400 mt-0.5">{p.duration}</p>}
              </div>
            ))}
            {ilep.length > 10 && (
              <p className="text-xs text-gray-400 pt-2">+{ilep.length - 10} more courses on ILEP</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Career Path Card ──────────────────────────────────────────────────────────

function CareerPathCard({ path, onClick }: { path: CareerPath; onClick: () => void }) {
  const courses = getMatchingCourses(path)
  const pathProviders = getProvidersForPath(path)
  return (
    <button onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:border-green-300 hover:shadow-sm transition-all w-full">
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{path.icon}</span>
        {path.permitsPerYear !== null && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            <TrendingUp size={10} />
            {path.permitsPerYear.toLocaleString()} permits/yr
          </span>
        )}
      </div>
      <h3 className="font-bold text-gray-900 text-sm mb-0.5">{path.label}</h3>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{path.description}</p>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{courses.length} ILEP courses</span>
        <span>{pathProviders.length} universities</span>
      </div>
    </button>
  )
}

// ── Career Path Detail ────────────────────────────────────────────────────────

function CareerPathDetail({ path, onClose, onSelectProvider }: {
  path: CareerPath; onClose: () => void; onSelectProvider: (p: Provider) => void
}) {
  const courses = getMatchingCourses(path)
  const pathProviders = getProvidersForPath(path)
  const [activeTab, setActiveTab] = useState<'universities' | 'courses'>('universities')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const filteredCourses = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return courses
    return courses.filter(p => p.programmeTitle.toLowerCase().includes(q) || p.provider.toLowerCase().includes(q))
  }, [courses, search])

  const totalPages = Math.ceil(filteredCourses.length / PAGE_SIZE)
  const paged = filteredCourses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-4">
      <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600">
        ← Back to career paths
      </button>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl">{path.icon}</span>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 text-xl">{path.label}</h2>
            <p className="text-sm text-gray-500">{path.sectorName}</p>
          </div>
          {path.permitsPerYear !== null && (
            <div className="bg-green-50 rounded-xl px-3 py-2 text-center">
              <div className="text-lg font-bold text-green-700">{path.permitsPerYear.toLocaleString()}</div>
              <div className="text-xs text-green-600">permits/yr</div>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4">{path.description}</p>

        {/* Top Sponsors */}
        {path.topSponsors.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Building2 size={12} /> Top companies sponsoring work permits
            </p>
            <div className="flex flex-wrap gap-2">
              {path.topSponsors.map(s => (
                <a key={s.slug}
                  href={`https://ie-work-permits.com/companies/${s.slug}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 hover:border-green-300 hover:text-green-700 transition-colors">
                  {s.name} <ExternalLink size={9} className="text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pathway */}
      <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 flex items-center gap-2 flex-wrap text-sm text-green-800 font-medium">
        <span className="text-gray-500 text-xs mr-1">Your path:</span>
        <span>📚 ILEP Course</span>
        <ArrowRight size={13} className="text-green-400" />
        <span>🎓 Stamp 2</span>
        <ArrowRight size={13} className="text-green-400" />
        <span>💼 Stamp 1G</span>
        <ArrowRight size={13} className="text-green-400" />
        <span>🏢 Work Permit</span>
        <ArrowRight size={13} className="text-green-400" />
        <span>🍀 Stamp 4</span>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('universities')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'universities' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          🏛️ Universities ({pathProviders.length})
        </button>
        <button onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'courses' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
          📋 ILEP Courses ({courses.length})
        </button>
      </div>

      {/* Universities list */}
      {activeTab === 'universities' && (
        <div className="space-y-3">
          {pathProviders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
              No university data available for this path yet.
            </div>
          ) : (
            pathProviders.map(pv => (
              <div key={pv.slug} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-200 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{pv.logo}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base">{pv.name}</h3>
                        {pv.trustedIreland && <Badge label="TrustEd ✓" className="bg-blue-100 text-blue-700" />}
                        {pv.ilep && <Badge label="ILEP ✓" className="bg-emerald-100 text-emerald-700" />}
                      </div>
                      <p className="text-xs text-gray-500">{pv.type} · {pv.city}</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">{pv.description}</p>

                {/* Fee & requirement chips */}
                <div className="flex gap-2 flex-wrap mb-3">
                  <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-lg font-medium">
                    <DollarSign size={11} /> UG: €{pv.feesUG.min.toLocaleString()}–€{pv.feesUG.max.toLocaleString()}/yr
                  </span>
                  <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium">
                    <DollarSign size={11} /> PG: €{pv.feePG.min.toLocaleString()}–€{pv.feePG.max.toLocaleString()}/yr
                  </span>
                  <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-medium">
                    <CheckCircle size={11} /> IELTS {pv.ielts.split(' ')[0]}
                  </span>
                </div>

                {/* Relevant courses at this provider for this career path */}
                {pv.topCourses.filter(c => c.sector === path.id).length > 0 && (
                  <div className="border-t border-gray-50 pt-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Courses for {path.label}:</p>
                    <div className="space-y-1.5">
                      {pv.topCourses.filter(c => c.sector === path.id).map((c, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-gray-800">{c.title}</span>
                            <span className="text-xs text-gray-400 ml-2">{c.duration}</span>
                            {c.nfq && <Badge label={`NFQ ${c.nfq}`} className="bg-gray-100 text-gray-500 ml-1.5" />}
                          </div>
                          <span className="font-bold text-gray-900 text-sm ml-3 flex-shrink-0">€{c.fee.toLocaleString()}/yr</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => onSelectProvider(pv)}
                  className="mt-3 w-full text-center text-xs text-green-600 hover:text-green-700 font-medium py-1.5 border border-green-100 rounded-xl hover:bg-green-50 transition-colors">
                  View full profile & all courses →
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* ILEP Courses list */}
      {activeTab === 'courses' && (
        <div>
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Filter courses..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400" />
          </div>
          {courses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
              No ILEP courses matched for this career path yet.
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-3">
                {paged.map(p => (
                  <ProgrammeCard key={p.id} p={p} expanded={expandedId === p.id}
                    onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1.5 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                  <span className="px-3 py-1.5 text-sm text-gray-500">{page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

type Tab = 'pathways' | 'universities' | 'courses'

export default function App() {
  const [tab, setTab] = useState<Tab>('pathways')
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)

  // All courses tab state
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [filterCounty, setFilterCounty] = useState('All')
  const [filterNfq, setFilterNfq] = useState('All')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [page, setPage] = useState(1)

  const allTypes = ['All', ...summary.byType.map(t => t.type)]
  const allCounties = ['All', ...summary.byCounty.slice(0, 15).map(c => c.county)]

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

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = search || filterType !== 'All' || filterCounty !== 'All' || filterNfq !== 'All'
  const resetPage = () => setPage(1)

  function clearFilters() {
    setSearch(''); setFilterType('All'); setFilterCounty('All'); setFilterNfq('All'); setPage(1)
  }

  function handleSelectProvider(pv: Provider) {
    setSelectedProvider(pv)
    setTab('universities')
    window.scrollTo(0, 0)
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
          <span className="text-xs text-gray-400 hidden sm:block">ILEP · {summary.lastUpdated}</span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">

        {/* Hero */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Find Your Path to a Work Permit Sponsor 🍀
          </h1>
          <p className="text-gray-500 text-sm mb-5">
            Choose a career, find the right course, compare universities, fees & requirements — then land a sponsor.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'ILEP Courses', value: summary.totalProgrammes.toLocaleString(), sub: 'Stamp 2 approved' },
              { label: 'Universities', value: providers.length, sub: 'With fee data' },
              { label: 'Career Paths', value: careerPaths.length, sub: 'With sponsor data' },
              { label: 'Top Sponsors', value: careerPaths.reduce((s, p) => s + p.topSponsors.length, 0) + '+', sub: 'Hiring companies' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ILEP notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-start gap-3">
            <span className="text-base flex-shrink-0">⚠️</span>
            <p className="text-xs text-amber-800">
              <strong>ILEP is transitioning to TrustEd Ireland (2026).</strong> Public universities (TCD, UCD, etc.) operate under TrustEd Ireland and accept Stamp 2 students independently.
              The ILEP list (February 2026) covers private colleges and language schools.{' '}
              <a href="https://www.qqi.ie/what-we-do/quality-assurance-of-education-and-training/what-is-trusted-ireland/" target="_blank" rel="noopener noreferrer" className="underline font-medium">Learn more about TrustEd Ireland →</a>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit overflow-x-auto">
          {([
            { key: 'pathways', icon: <Briefcase size={14} />, label: 'Career Paths' },
            { key: 'universities', icon: <University size={14} />, label: 'Universities' },
            { key: 'courses', icon: <GraduationCap size={14} />, label: 'All ILEP Courses' },
          ] as const).map(t => (
            <button key={t.key}
              onClick={() => { setTab(t.key); setSelectedPath(null); setSelectedProvider(null) }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── CAREER PATHS TAB ── */}
        {tab === 'pathways' && (
          selectedPath ? (
            <CareerPathDetail path={selectedPath} onClose={() => setSelectedPath(null)} onSelectProvider={handleSelectProvider} />
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Select a career area to see courses, universities, fees and top sponsor companies.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {careerPaths.map(path => (
                  <CareerPathCard key={path.id} path={path} onClick={() => setSelectedPath(path)} />
                ))}
              </div>
            </>
          )
        )}

        {/* ── UNIVERSITIES TAB ── */}
        {tab === 'universities' && (
          selectedProvider ? (
            <ProviderDetail pv={selectedProvider} onClose={() => setSelectedProvider(null)} />
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-4">
                All major Irish universities and colleges that accept international students on Stamp 2.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {providers.map(pv => (
                  <ProviderCard key={pv.slug} pv={pv} onClick={() => setSelectedProvider(pv)} />
                ))}
              </div>
            </>
          )
        )}

        {/* ── ALL COURSES TAB ── */}
        {tab === 'courses' && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search course or provider..."
                    value={search} onChange={e => { setSearch(e.target.value); resetPage() }}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-green-400" />
                </div>
                {hasFilters && (
                  <button onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
                    <X size={12} /> Clear
                  </button>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <select value={filterType} onChange={e => { setFilterType(e.target.value); resetPage() }}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-green-400 bg-white">
                  {allTypes.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
                </select>
                <select value={filterCounty} onChange={e => { setFilterCounty(e.target.value); resetPage() }}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-green-400 bg-white">
                  {allCounties.map(c => <option key={c} value={c}>{c === 'All' ? 'All Counties' : c}</option>)}
                </select>
                <select value={filterNfq} onChange={e => { setFilterNfq(e.target.value); resetPage() }}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-green-400 bg-white">
                  {['All', '9', '8', '7', '6', 'N/A'].map(n => (
                    <option key={n} value={n}>{n === 'All' ? 'All NFQ Levels' : n === 'N/A' ? 'No NFQ' : `NFQ ${n}`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-sm text-gray-500">{filtered.length.toLocaleString()} programme{filtered.length !== 1 ? 's' : ''} found</p>
              {totalPages > 1 && <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>}
            </div>

            <div className="space-y-2 mb-6">
              {paged.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                  No programmes match your filters.
                </div>
              ) : paged.map(p => (
                <ProgrammeCard key={p.id} p={p} expanded={expandedId === p.id}
                  onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mb-6">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">← Prev</button>
                <span className="px-4 py-2 text-sm text-gray-500">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next →</button>
              </div>
            )}
          </>
        )}

        {/* Source */}
        <p className="text-xs text-gray-400 mt-6 text-center">
          ILEP data from{' '}
          <a href={summary.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600 inline-flex items-center gap-0.5">
            irishimmigration.ie <ExternalLink size={10} />
          </a>
          {' '}· Sponsor data via{' '}
          <a href="https://ie-work-permits.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">ie-work-permits.com</a>
          {' '}· Fees indicative, verify with institution · {summary.lastUpdated}
        </p>
      </main>

      <footer className="border-t border-gray-100 bg-white px-4 py-4 mt-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-400">
          <span>Built by <span className="font-medium text-gray-600">Luiz Faitanin</span></span>
          <a href="https://irishventures.ie" className="hover:text-gray-600 transition-colors">irishventures.ie →</a>
        </div>
      </footer>

      <Analytics />
    </div>
  )
}
