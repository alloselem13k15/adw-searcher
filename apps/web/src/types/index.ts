// ── ADW Search Parameters ─────────────────────────────────────────────────────
// All 40+ fields accepted by the ADW API (sent server-side only).

export interface AdwSearchParams {
  // Identite
  nom_famille?:    string
  prenom?:         string
  nom_naissance?:  string
  nom_affichage?:  string
  nom_utilisateur?: string
  genre?:          string
  civilite?:       string
  date_naissance?: string
  annee_naissance?: string
  jour_naissance?: string
  mois_naissance?: string
  // Contact
  email?:       string
  telephone?:   string
  mobile?:      string
  adresse_ip?:  string
  discord_id?:  string
  // Localisation
  adresse?:            string
  complement_adresse?: string
  ville?:              string
  code_postal?:        string
  departement?:        string
  region?:             string
  pays?:               string
  ville_naissance?:    string
  lieu_naissance?:     string
  // Professionnel
  societe?:         string
  profession?:      string
  fonction?:        string
  siret?:           string
  siren?:           string
  marque?:          string
  modele?:          string
  vin_plaque?:      string
  immatriculation?: string
  numero_serie?:    string
  // Bancaire / Gaming
  iban?:           string
  bic?:            string
  steam_id?:       string
  fivem_license?:  string
  fivem_license2?: string
  fivem_id?:       string
  xbox_live_id?:   string
  live_id?:        string
  // Pagination
  page?:     number
  per_page?: number
  flexible?: boolean
}

// ── ADW Search Result ─────────────────────────────────────────────────────────
// All fields that may appear in a result object from the ADW API.

export interface AdwSearchResult {
  // Identite
  nom_famille?:     string
  prenom?:          string
  nom_complet?:     string
  nom_naissance?:   string
  nom_affichage?:   string
  nom_utilisateur?: string
  genre?:           string
  civilite?:        string
  date_naissance?:  string
  annee_naissance?: string | number
  jour_naissance?:  string | number
  mois_naissance?:  string | number
  age?:             number | string
  // Contact
  email?:        string
  emails?:       string[]
  telephone?:    string
  telephones?:   string[]
  mobile?:       string
  adresse_ip?:   string
  discord_id?:   string
  // Localisation
  adresse?:            string
  complement_adresse?: string
  ville?:              string
  code_postal?:        string
  departement?:        string
  region?:             string
  pays?:               string
  pays_code?:          string
  ville_naissance?:    string
  lieu_naissance?:     string
  coordonnees?:        { lat?: number; lng?: number }
  // Professionnel
  societe?:         string
  profession?:      string
  fonction?:        string
  siret?:           string
  siren?:           string
  marque?:          string
  modele?:          string
  vin_plaque?:      string
  immatriculation?: string
  numero_serie?:    string
  // Bancaire / Gaming
  iban?:           string
  bic?:            string
  steam_id?:       string
  fivem_license?:  string
  fivem_license2?: string
  fivem_id?:       string
  xbox_live_id?:   string
  live_id?:        string
  // Metadata
  source?:     string
  score?:      number
  created_at?: string
  updated_at?: string
  // Allow extra fields returned by the API
  [key: string]: unknown
}

// ── ADW API Response ──────────────────────────────────────────────────────────

export interface AdwApiMeta {
  total:    number
  page:     number
  pages:    number
  per_page: number
}

export interface AdwApiResponse {
  data: {
    results: AdwSearchResult[]
  }
  meta:      AdwApiMeta
  timestamp: string
}

// ── IpLog ─────────────────────────────────────────────────────────────────────

export type IpLogAction = 'LOGIN' | 'REGISTER' | 'SEARCH' | 'LOGOUT' | 'FAILED_LOGIN'

export interface IpLogEntry {
  id:        string
  userId:    string | null
  ipAddress: string
  action:    IpLogAction
  details:   Record<string, unknown> | null
  createdAt: string
  user?:     {
    id:       string
    email:    string
    username: string
    role:     string
  }
  searchHistory?: SearchHistoryEntry | null
}

// ── Search History ────────────────────────────────────────────────────────────

export interface SearchHistoryEntry {
  id:           string
  userId:       string
  query:        string
  searchType:   string
  queryParams:  Record<string, unknown> | null
  resultsCount: number
  creditsUsed:  number
  createdAt:    string
  user?: {
    id:       string
    email:    string
    username: string
    role:     string
  }
}

// ── Users & Auth ──────────────────────────────────────────────────────────────

export type UserRole = 'USER' | 'ADMIN' | 'OWNER'

export interface Subscription {
  plan:               string
  status:             string
  currentPeriodEnd:   string | null
  searchesPerDay:     number
  searchesUsedToday:  number
  lastResetAt:        string | null
}

export interface User {
  id:               string
  email:            string
  username:         string
  role:             UserRole
  isActive:         boolean
  isEmailVerified:  boolean
  twoFactorEnabled: boolean
  createdAt:        string
  lastLoginAt:      string | null
  subscription:     Subscription | null
}

// ── Paginated Response ────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data:       T[]
  total:      number
  page:       number
  totalPages: number
}

// ── Admin stats ───────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers:       number
  activeUsers:      number
  searchesToday:    number
  searchesThisMonth:number
  openTickets:      number
  totalIpLogsToday: number
  uniqueIpsToday:   number
  MRR:              number
}
