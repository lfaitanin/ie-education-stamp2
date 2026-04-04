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

export type FilterType = 'All' | 'English Language' | 'Higher Education' | 'Professional' | 'Foundation'
export type FilterNfq = 'All' | '6' | '7' | '8' | '9' | 'N/A'
