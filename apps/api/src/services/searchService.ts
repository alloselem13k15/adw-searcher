import { logger } from '../lib/logger'

// ── ADW Search Parameters (all 40+ fields) ────────────────────────────────────
// This service calls the ADW API server-side only.
// The underlying provider is never mentioned in any client-facing code or response.

export interface AdwSearchParams {
  // Identite
  nom_famille?: string
  prenom?: string
  nom_naissance?: string
  nom_affichage?: string
  nom_utilisateur?: string
  genre?: string
  civilite?: string
  date_naissance?: string
  annee_naissance?: string
  jour_naissance?: string
  mois_naissance?: string
  // Contact
  email?: string
  telephone?: string
  mobile?: string
  adresse_ip?: string
  discord_id?: string
  // Localisation
  adresse?: string
  complement_adresse?: string
  ville?: string
  code_postal?: string
  departement?: string
  region?: string
  pays?: string
  ville_naissance?: string
  lieu_naissance?: string
  // Professionnel
  societe?: string
  profession?: string
  fonction?: string
  siret?: string
  siren?: string
  marque?: string
  modele?: string
  vin_plaque?: string
  immatriculation?: string
  numero_serie?: string
  // Bancaire / Gaming
  iban?: string
  bic?: string
  steam_id?: string
  fivem_license?: string
  fivem_license2?: string
  fivem_id?: string
  xbox_live_id?: string
  live_id?: string
  // Pagination
  page?: number
  per_page?: number
  flexible?: boolean
}

export interface AdwApiMeta {
  total: number
  page: number
  pages: number
  per_page: number
}

export interface AdwApiResponse {
  status: string
  message?: string
  data: {
    results: Record<string, unknown>[]
  }
  meta: AdwApiMeta
  timestamp: string
}

// ── ADW Search Service ────────────────────────────────────────────────────────
// Server-side only. The external data provider is configured via environment
// variables and must never appear in any client-facing code, error messages,
// or API responses.

class AdwSearchService {
  private readonly apiUrl: string
  private readonly apiKey: string
  private readonly timeout: number

  constructor() {
    this.apiUrl = process.env.ADW_API_URL || ''
    this.apiKey = process.env.ADW_API_KEY || ''
    this.timeout = parseInt(process.env.ADW_API_TIMEOUT || '30000', 10)
  }

  async search(params: AdwSearchParams): Promise<AdwApiResponse> {
    if (!this.apiUrl) {
      throw new Error('SERVICE_NOT_CONFIGURED')
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      return await this.withRetry(() => this.callApi(params, controller.signal))
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private async callApi(
    params: AdwSearchParams,
    signal: AbortSignal,
  ): Promise<AdwApiResponse> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'X-Client': 'ADW-Searcher/1.0',
      },
      body: JSON.stringify(params),
      signal,
    })

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60'
        throw new Error(`RATE_LIMITED:${retryAfter}`)
      }
      if (response.status === 503) {
        throw new Error('SERVICE_UNAVAILABLE')
      }
      throw new Error(`API_ERROR_${response.status}`)
    }

    const json = await response.json()
    return json as AdwApiResponse
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        const msg = error instanceof Error ? error.message : ''

        // Do not retry on rate limit or service unavailable — escalate immediately
        if (msg.startsWith('RATE_LIMITED') || msg === 'SERVICE_UNAVAILABLE') {
          throw error
        }

        if (attempt === maxAttempts) throw error

        const delay = Math.pow(2, attempt) * 500
        logger.warn(`ADW API tentative ${attempt}/${maxAttempts} echouee. Retry dans ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    throw new Error('MAX_RETRIES_EXCEEDED')
  }
}

export const adwSearchService = new AdwSearchService()

// Named export for direct import in routes
export const adwSearch = (params: AdwSearchParams): Promise<AdwApiResponse> =>
  adwSearchService.search(params)
