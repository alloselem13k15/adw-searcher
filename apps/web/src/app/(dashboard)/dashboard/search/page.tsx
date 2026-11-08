'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Search, ChevronDown, ChevronUp, Download, Printer, FileText,
  MapPin, ChevronLeft, ChevronRight, AlertCircle, Loader2, History,
} from 'lucide-react'
import { searchApi } from '@/lib/api'
import { isApiError } from '@/lib/api'
import type { AdwSearchParams, AdwSearchResult, AdwApiMeta, SearchHistoryEntry } from '@/types'
import useSWR from 'swr'

// ── Field definitions ─────────────────────────────────────────────────────────

interface FieldDef {
  key:         keyof AdwSearchParams
  label:       string
  placeholder?: string
  type?:        'text' | 'date' | 'number' | 'select'
  options?:     string[]
}

type FieldGroup = { id: string; label: string; fields: FieldDef[] }

const FIELD_GROUPS: FieldGroup[] = [
  {
    id: 'identite', label: 'Identite',
    fields: [
      { key: 'nom_famille',    label: 'Nom de famille',   placeholder: 'Dupont'   },
      { key: 'prenom',         label: 'Prenom',            placeholder: 'Jean'     },
      { key: 'nom_naissance',  label: 'Nom de naissance'  },
      { key: 'nom_affichage',  label: 'Nom d\'affichage'  },
      { key: 'nom_utilisateur',label: 'Nom d\'utilisateur'},
      { key: 'genre',          label: 'Genre',             type: 'select', options: ['', 'M', 'F', 'Autre'] },
      { key: 'civilite',       label: 'Civilite',          type: 'select', options: ['', 'M.', 'Mme', 'Dr', 'Pr'] },
      { key: 'date_naissance', label: 'Date de naissance', placeholder: 'JJ/MM/AAAA' },
      { key: 'annee_naissance',label: 'Annee de naissance',placeholder: '1990' },
      { key: 'mois_naissance', label: 'Mois de naissance', placeholder: '1-12' },
      { key: 'jour_naissance', label: 'Jour de naissance',  placeholder: '1-31' },
    ],
  },
  {
    id: 'contact', label: 'Contact',
    fields: [
      { key: 'email',      label: 'Email',       placeholder: 'jean.dupont@email.com' },
      { key: 'telephone',  label: 'Telephone',   placeholder: '+33 6 12 34 56 78'    },
      { key: 'mobile',     label: 'Mobile'       },
      { key: 'adresse_ip', label: 'Adresse IP',  placeholder: '192.168.1.1'          },
      { key: 'discord_id', label: 'Discord ID'   },
    ],
  },
  {
    id: 'localisation', label: 'Localisation',
    fields: [
      { key: 'adresse',            label: 'Adresse',            placeholder: '12 rue de la Paix' },
      { key: 'complement_adresse', label: 'Complement adresse'  },
      { key: 'ville',              label: 'Ville',              placeholder: 'Paris'             },
      { key: 'code_postal',        label: 'Code postal',        placeholder: '75001'             },
      { key: 'departement',        label: 'Departement',        placeholder: 'Paris'             },
      { key: 'region',             label: 'Region',             placeholder: 'Ile-de-France'     },
      { key: 'pays',               label: 'Pays',               placeholder: 'France'            },
      { key: 'ville_naissance',    label: 'Ville de naissance'  },
      { key: 'lieu_naissance',     label: 'Lieu de naissance'   },
    ],
  },
  {
    id: 'professionnel', label: 'Professionnel',
    fields: [
      { key: 'societe',         label: 'Societe'           },
      { key: 'profession',      label: 'Profession'        },
      { key: 'fonction',        label: 'Fonction'          },
      { key: 'siret',           label: 'SIRET',            placeholder: '12345678901234' },
      { key: 'siren',           label: 'SIREN',            placeholder: '123456789'      },
      { key: 'marque',          label: 'Marque vehicule'   },
      { key: 'modele',          label: 'Modele vehicule'   },
      { key: 'vin_plaque',      label: 'VIN / Plaque'      },
      { key: 'immatriculation', label: 'Immatriculation'   },
      { key: 'numero_serie',    label: 'Numero de serie'   },
    ],
  },
  {
    id: 'bancaire', label: 'Bancaire / Gaming',
    fields: [
      { key: 'iban',           label: 'IBAN'           },
      { key: 'bic',            label: 'BIC / SWIFT'    },
      { key: 'steam_id',       label: 'Steam ID'       },
      { key: 'fivem_license',  label: 'FiveM License'  },
      { key: 'fivem_license2', label: 'FiveM License 2'},
      { key: 'fivem_id',       label: 'FiveM ID'       },
      { key: 'xbox_live_id',   label: 'Xbox Live ID'   },
      { key: 'live_id',        label: 'Live ID'        },
    ],
  },
]

// French labels for displaying result fields
const FIELD_LABELS: Record<string, string> = {
  nom_famille: 'Nom', prenom: 'Prenom', nom_complet: 'Nom complet', nom_naissance: 'Nom de naissance',
  nom_affichage: 'Nom affichage', nom_utilisateur: 'Nom utilisateur', genre: 'Genre', civilite: 'Civilite',
  date_naissance: 'Date naissance', annee_naissance: 'Annee naissance', age: 'Age',
  email: 'Email', emails: 'Emails', telephone: 'Telephone', telephones: 'Telephones',
  mobile: 'Mobile', adresse_ip: 'Adresse IP', discord_id: 'Discord ID',
  adresse: 'Adresse', complement_adresse: 'Complement', ville: 'Ville', code_postal: 'Code postal',
  departement: 'Departement', region: 'Region', pays: 'Pays', pays_code: 'Code pays',
  ville_naissance: 'Ville naissance', lieu_naissance: 'Lieu naissance',
  societe: 'Societe', profession: 'Profession', fonction: 'Fonction',
  siret: 'SIRET', siren: 'SIREN', marque: 'Marque', modele: 'Modele',
  vin_plaque: 'VIN/Plaque', immatriculation: 'Immatriculation', numero_serie: 'N° serie',
  iban: 'IBAN', bic: 'BIC', steam_id: 'Steam ID', fivem_license: 'FiveM License',
  fivem_license2: 'FiveM License 2', fivem_id: 'FiveM ID', xbox_live_id: 'Xbox Live ID',
  live_id: 'Live ID', source: 'Source', score: 'Score', created_at: 'Cree le', updated_at: 'Modifie le',
}

// ── Google Maps embed ─────────────────────────────────────────────────────────

function buildMapUrl(r: AdwSearchResult): string | null {
  const parts = [r.adresse, r.complement_adresse, r.ville, r.code_postal, r.departement, r.region, r.pays]
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
  if (!parts.length) return null
  return `https://maps.google.com/maps?q=${encodeURIComponent(parts.join(', '))}&output=embed`
}

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({ result, index }: { result: AdwSearchResult; index: number }) {
  const mapUrl = buildMapUrl(result)

  // Gather all non-null fields in display order
  const displayFields = Object.entries(result)
    .filter(([k, v]) => {
      if (k === 'coordonnees') return false
      if (v === null || v === undefined || v === '') return false
      if (Array.isArray(v) && v.length === 0) return false
      return true
    })

  const formatValue = (v: unknown): string => {
    if (Array.isArray(v)) return v.join(', ')
    if (typeof v === 'object' && v !== null) return JSON.stringify(v)
    return String(v)
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.015]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-600">#{index + 1}</span>
          <span className="text-sm font-medium text-white">
            {[result.nom_complet, result.nom_famille && result.prenom
              ? `${result.prenom} ${result.nom_famille}`
              : result.nom_famille || result.prenom]
              .filter(Boolean)[0] || result.email || result.nom_utilisateur || 'Resultat'}
          </span>
        </div>
        {result.source && (
          <span className="text-xs text-gray-600 font-mono">{String(result.source)}</span>
        )}
      </div>

      <div className="p-5">
        {/* Fields grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 mb-5">
          {displayFields.map(([key, value]) => (
            <div key={key} className="min-w-0">
              <p className="text-[10px] text-gray-600 uppercase tracking-wide mb-0.5">
                {FIELD_LABELS[key] ?? key}
              </p>
              <p className="text-sm text-gray-200 truncate" title={formatValue(value)}>
                {formatValue(value)}
              </p>
            </div>
          ))}
        </div>

        {/* Google Maps embed */}
        {mapUrl && (
          <div className="mt-2">
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin size={12} className="text-gray-600" />
              <span className="text-xs text-gray-600">Localisation</span>
            </div>
            <div className="rounded-lg overflow-hidden border border-white/5 h-48">
              <iframe
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'grayscale(1) invert(0.9) contrast(0.9)' }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localisation"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Collapsible field group ───────────────────────────────────────────────────

function FieldGroup({
  group,
  values,
  onChange,
}: {
  group:    FieldGroup
  values:   Partial<Record<keyof AdwSearchParams, string>>
  onChange: (key: keyof AdwSearchParams, val: string) => void
}) {
  const [open, setOpen] = useState(group.id === 'identite')
  const filled = group.fields.filter(f => values[f.key]).length

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">{group.label}</span>
          {filled > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-white text-black rounded-full">
              {filled}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </button>

      {open && (
        <div className="p-5 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {group.fields.map(field => (
            <div key={String(field.key)}>
              <label className="block text-xs text-gray-500 mb-1.5">{field.label}</label>
              {field.type === 'select' ? (
                <select
                  value={values[field.key] ?? ''}
                  onChange={e => onChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-md text-gray-300 focus:outline-none focus:border-white/20 appearance-none"
                >
                  {field.options!.map(opt => (
                    <option key={opt} value={opt} className="bg-black">
                      {opt || '—'}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type ?? 'text'}
                  value={values[field.key] ?? ''}
                  onChange={e => onChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-md text-gray-300 placeholder-gray-700 focus:outline-none focus:border-white/20"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Export helpers ────────────────────────────────────────────────────────────

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function resultsToTxt(results: AdwSearchResult[]): string {
  return results.map((r, i) => {
    const lines = [`--- Resultat #${i + 1} ---`]
    for (const [k, v] of Object.entries(r)) {
      if (v !== null && v !== undefined && v !== '') {
        const label = FIELD_LABELS[k] ?? k
        const val   = Array.isArray(v) ? v.join(', ') : String(v)
        lines.push(`${label}: ${val}`)
      }
    }
    return lines.join('\n')
  }).join('\n\n')
}

// ── History tab ───────────────────────────────────────────────────────────────

function HistoryTab() {
  const { data, isLoading } = useSWR(
    'search-history-tab',
    () => searchApi.getHistory(1, 50),
    { revalidateOnFocus: false },
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-600">
        <Loader2 size={20} className="animate-spin mr-2" />
        Chargement...
      </div>
    )
  }

  if (!data?.data?.length) {
    return (
      <div className="py-16 text-center">
        <History size={28} className="text-gray-700 mx-auto mb-3" />
        <p className="text-sm text-gray-600">Aucune recherche effectuee</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {data.data.map((entry: SearchHistoryEntry) => {
        const params = entry.queryParams ?? {}
        const excluded = new Set(['page', 'per_page', 'flexible'])
        const summary = Object.entries(params)
          .filter(([k, v]) => !excluded.has(k) && typeof v === 'string' && (v as string).trim())
          .slice(0, 4)

        return (
          <div
            key={entry.id}
            className="rounded-lg border border-white/5 bg-white/[0.02] p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2 mb-1.5">
                  {summary.map(([k, v]) => (
                    <span key={k} className="inline-flex items-center gap-1 text-xs text-gray-400 bg-white/5 border border-white/5 rounded px-2 py-0.5">
                      <span className="text-gray-600">{FIELD_LABELS[k] ?? k}:</span> {String(v)}
                    </span>
                  ))}
                  {summary.length === 0 && (
                    <span className="text-xs text-gray-600">{entry.query}</span>
                  )}
                </div>
                <p className="text-xs text-gray-700">
                  {entry.resultsCount} resultat{entry.resultsCount !== 1 ? 's' : ''} &middot;{' '}
                  {new Date(entry.createdAt).toLocaleString('fr-FR', {
                    day: '2-digit', month: '2-digit', year: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type TabId = 'search' | 'history'

export default function SearchPage() {
  // Form state
  const [fields, setFields] = useState<Partial<Record<keyof AdwSearchParams, string>>>({})
  const [flexible, setFlexible] = useState(false)
  const [perPage,  setPerPage]  = useState(25)

  // Result state
  const [results,   setResults]   = useState<AdwSearchResult[]>([])
  const [meta,      setMeta]      = useState<AdwApiMeta | null>(null)
  const [page,      setPage]      = useState(1)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [searched,  setSearched]  = useState(false)

  const [tab, setTab] = useState<TabId>('search')

  const resultsRef = useRef<HTMLDivElement>(null)

  const setField = useCallback((key: keyof AdwSearchParams, val: string) => {
    setFields(prev => ({ ...prev, [key]: val }))
  }, [])

  const hasFields = Object.values(fields).some(v => typeof v === 'string' && v.trim())

  const doSearch = useCallback(async (targetPage: number) => {
    if (!hasFields) return

    setLoading(true)
    setError(null)

    try {
      const params: AdwSearchParams = {}
      for (const [k, v] of Object.entries(fields)) {
        if (typeof v === 'string' && v.trim()) {
          (params as Record<string, unknown>)[k] = v.trim()
        }
      }
      params.page     = targetPage
      params.per_page = perPage
      params.flexible = flexible

      const res = await searchApi.search(params)
      setResults(res.data?.results ?? [])
      setMeta(res.meta ?? null)
      setPage(targetPage)
      setSearched(true)

      // Scroll to results
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (err) {
      if (isApiError(err) && err.status === 429) {
        setError('Limite journaliere atteinte. Revenez demain ou contactez le support.')
      } else if (isApiError(err)) {
        setError(err.message || 'Erreur lors de la recherche.')
      } else {
        setError('Erreur inattendue. Veuillez reessayer.')
      }
    } finally {
      setLoading(false)
    }
  }, [fields, flexible, perPage, hasFields])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(1)
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  const handleExportJSON = () => {
    downloadBlob(
      JSON.stringify(results, null, 2),
      `adw-results-${Date.now()}.json`,
      'application/json',
    )
  }

  const handleExportTXT = () => {
    downloadBlob(
      resultsToTxt(results),
      `adw-results-${Date.now()}.txt`,
      'text/plain; charset=utf-8',
    )
  }

  const handleExportPDF = () => {
    window.print()
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Recherche</h1>
        <p className="text-sm text-gray-500">
          Combinez plusieurs champs pour affiner votre recherche — 40+ criteres disponibles
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg border border-white/10 w-fit mb-6">
        {(['search', 'history'] as TabId[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              tab === t ? 'bg-white text-black font-medium' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'search' ? 'Recherche' : 'Historique'}
          </button>
        ))}
      </div>

      {tab === 'history' ? (
        <HistoryTab />
      ) : (
        <>
          {/* ── Search form ── */}
          <form onSubmit={handleSubmit} className="space-y-3 mb-8 print:hidden">

            {FIELD_GROUPS.map(group => (
              <FieldGroup
                key={group.id}
                group={group}
                values={fields}
                onChange={setField}
              />
            ))}

            {/* Options row */}
            <div className="flex flex-wrap items-center gap-6 px-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={flexible}
                  onChange={e => setFlexible(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 accent-white"
                />
                <span className="text-sm text-gray-400">Recherche flexible</span>
              </label>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">Resultats par page</label>
                <select
                  value={perPage}
                  onChange={e => setPerPage(Number(e.target.value))}
                  className="px-2 py-1 text-sm bg-white/5 border border-white/10 rounded text-gray-300 focus:outline-none"
                >
                  {[10, 25, 50, 100].map(n => (
                    <option key={n} value={n} className="bg-black">{n}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!hasFields || loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black text-sm font-medium rounded-md hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" /> Recherche en cours...</>
                ) : (
                  <><Search size={15} /> Lancer la recherche</>
                )}
              </button>

              {hasFields && (
                <button
                  type="button"
                  onClick={() => { setFields({}); setResults([]); setMeta(null); setSearched(false); setError(null) }}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Effacer
                </button>
              )}
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 mb-6">
              <AlertCircle size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          )}

          {/* ── Results ── */}
          {searched && (
            <div ref={resultsRef} className="space-y-4">

              {/* Results header */}
              <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
                <div>
                  <p className="text-sm font-medium text-white">
                    {meta ? `${meta.total} resultat${meta.total !== 1 ? 's' : ''}` : `${results.length} resultat${results.length !== 1 ? 's' : ''}`}
                    {meta && meta.pages > 1 && (
                      <span className="text-gray-500 font-normal"> — page {meta.page} / {meta.pages}</span>
                    )}
                  </p>
                </div>

                {/* Export buttons */}
                {results.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportJSON}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                    >
                      <Download size={12} /> JSON
                    </button>
                    <button
                      onClick={handleExportTXT}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                    >
                      <FileText size={12} /> TXT
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                    >
                      <Printer size={12} /> PDF
                    </button>
                  </div>
                )}
              </div>

              {/* Result cards */}
              {results.length === 0 ? (
                <div className="py-16 text-center rounded-xl border border-white/5">
                  <Search size={28} className="text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Aucun resultat pour ces criteres</p>
                  <p className="text-xs text-gray-700 mt-1">Essayez avec moins de champs ou activez la recherche flexible</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((r, i) => (
                    <ResultCard key={i} result={r} index={i} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {meta && meta.pages > 1 && (
                <div className="flex items-center justify-between pt-2 print:hidden">
                  <p className="text-xs text-gray-600">
                    Page {meta.page} / {meta.pages} &middot; {meta.total} resultats
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => doSearch(page - 1)}
                      disabled={page <= 1 || loading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={13} /> Precedent
                    </button>
                    <button
                      onClick={() => doSearch(page + 1)}
                      disabled={page >= meta.pages || loading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Suivant <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Print styles */}
          <style jsx global>{`
            @media print {
              header, nav, aside, .print\\:hidden { display: none !important; }
              body { background: white !important; color: black !important; }
              .rounded-xl { border: 1px solid #ddd !important; }
              iframe { display: none !important; }
            }
          `}</style>
        </>
      )}
    </div>
  )
}
