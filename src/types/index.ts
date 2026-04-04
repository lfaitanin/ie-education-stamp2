export interface Programme {
  id: number
  ref: string
  type: string
  provider: string
  providerSlug: string
  county: string
  programmeTitle: string
  awardingBody: string
  awardTitle: string
  duration: string
  hoursPerWeek: string
  nfqLevel: string
  entryLevel: string
  exitLevel: string
  address: string
}

export interface Summary {
  lastUpdated: string
  sourceUrl: string
  totalProgrammes: number
  totalProviders: number
  byType: { type: string; count: number }[]
  byCounty: { county: string; count: number }[]
  byNfq: { nfqLevel: string; count: number }[]
}

export interface ProviderCourse {
  title: string
  nfq: string | null
  duration: string
  fee: number
  sector: string
}

export interface Provider {
  slug: string
  name: string
  shortName: string
  county: string
  city: string
  type: string
  ranking: string
  website: string
  feesUrl: string
  logo: string
  ilep: boolean
  trustedIreland: boolean
  description: string
  feesUG: { min: number; max: number; note: string }
  feePG: { min: number; max: number; note: string }
  ielts: string
  topCourses: ProviderCourse[]
  sectors: string[]
}

export interface Sponsor { name: string; slug: string }
export interface CareerPath {
  id: string
  sector: string
  icon: string
  label: string
  sectorName: string
  description: string
  permitsPerYear: number | null
  trendUp: boolean
  keywords: string[]
  nfqFocus: string[]
  topSponsors: Sponsor[]
}
