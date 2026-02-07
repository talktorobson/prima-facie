// =====================================================
// DataJud CNJ Public API Service
// Brazilian National Judiciary Database Integration
// Uses the real CNJ public Elasticsearch API
// Docs: https://datajud-wiki.cnj.jus.br/api-publica/acesso
// =====================================================

import axios, { AxiosInstance } from 'axios'

// Rate limiting configuration
interface RateLimitConfig {
  requests_per_minute: number
  current_requests: number
  window_start: number
}

// --- Court mapping tables ---

// Court number → state abbreviation (for segment 8, Justiça Estadual)
const COURT_TO_STATE: Record<string, string> = {
  '01': 'ac', '02': 'al', '03': 'ap', '04': 'am', '05': 'ba',
  '06': 'ce', '07': 'df', '08': 'es', '09': 'go', '10': 'ma',
  '11': 'mt', '12': 'ms', '13': 'mg', '14': 'pa', '15': 'pb',
  '16': 'pe', '17': 'pi', '18': 'pr', '19': 'rj', '20': 'rn',
  '21': 'rs', '22': 'ro', '23': 'rr', '24': 'sc', '25': 'se',
  '26': 'sp', '27': 'to',
}

// Superior courts by court number
const SUPERIOR_COURTS: Record<string, string> = {
  '90': 'stj', '91': 'tst', '92': 'tse', '93': 'stm',
}

// --- DataJud API response types (field names match _source) ---

export interface DataJudMovement {
  codigo: number
  nome: string
  dataHora: string
  complemento?: string
  complementosTabelados?: Array<{
    codigo: number
    nome: string
    descricao?: string
  }>
  tipoResponsavelMovimento?: {
    codigo: number
    nome: string
  }
  responsavelMovimento?: {
    codigo: number
    nome: string
  }
}

export interface DataJudAssunto {
  codigo: number
  nome: string
  principal?: boolean
}

export interface DataJudClasse {
  codigo: number
  nome: string
}

export interface DataJudOrgaoJulgador {
  codigo: number
  nome: string
  codigoMunicipioIBGE?: number
  municipio?: string
  uf?: string
  competencia?: string
}

export interface DataJudSistema {
  codigo: number
  nome: string
}

export interface DataJudFormato {
  codigo: number
  nome: string
}

export interface DataJudParticipante {
  pessoa: {
    nome: string
    cpfCnpj?: string
    tipo: 'F' | 'J'
  }
  polo: 'ativo' | 'passivo'
  participacao?: string
}

export interface DataJudProcesso {
  id?: string
  numeroProcesso: string
  tribunal: string
  grau: string
  dataAjuizamento?: string
  dataHoraUltimaAtualizacao?: string
  nivelSigilo: number
  orgaoJulgador: DataJudOrgaoJulgador
  classe: DataJudClasse
  sistema: DataJudSistema
  formato: DataJudFormato
  assuntos: DataJudAssunto[]
  participantes?: DataJudParticipante[]
  movimentos?: DataJudMovement[]
  valorCausa?: number
}

// Elasticsearch response wrapper
interface ElasticsearchHit {
  _index: string
  _id: string
  _score: number
  _source: DataJudProcesso
}

interface ElasticsearchResponse {
  took: number
  timed_out: boolean
  _shards: { total: number; successful: number; skipped: number; failed: number }
  hits: {
    total: { value: number; relation: string }
    max_score: number | null
    hits: ElasticsearchHit[]
  }
}

// Public API key (published on CNJ wiki, same for everyone)
const DEFAULT_API_KEY = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=='
const BASE_URL = 'https://api-publica.datajud.cnj.jus.br'

/**
 * Extract digits from a CNJ number string, stripping all formatting.
 * CNJ format: NNNNNNN-DD.AAAA.J.TR.OOOO → 20 raw digits
 */
function stripCnjFormatting(cnj: string): string {
  return cnj.replace(/\D/g, '')
}

/**
 * Resolve the court endpoint code from a CNJ process number.
 *
 * CNJ format: NNNNNNN-DD.AAAA.J.TR.OOOO (20 digits)
 *   Position 13 (0-indexed) = J (segment/justiça)
 *   Positions 14-15 = TR (court/tribunal)
 *
 * Returns the endpoint suffix, e.g. "tjsp", "trt1", "stj"
 */
export function resolveCourtEndpoint(cnj: string): string {
  const digits = stripCnjFormatting(cnj)

  if (digits.length !== 20) {
    throw new Error(`Invalid CNJ number: expected 20 digits, got ${digits.length} from "${cnj}"`)
  }

  const segment = digits[13]    // J — type of justice
  const courtCode = digits.substring(14, 16)  // TR — court number

  // Superior courts (segment 9 or specific court codes)
  if (SUPERIOR_COURTS[courtCode]) {
    return SUPERIOR_COURTS[courtCode]
  }

  switch (segment) {
    case '8': { // Justiça Estadual
      const state = COURT_TO_STATE[courtCode]
      if (!state) throw new Error(`Unknown state court code: ${courtCode}`)
      return `tj${state}`
    }
    case '5': // Justiça do Trabalho
      return `trt${parseInt(courtCode, 10)}`
    case '4': // Justiça Federal
      return `trf${parseInt(courtCode, 10)}`
    case '6': { // Justiça Eleitoral
      const state = COURT_TO_STATE[courtCode]
      if (!state) throw new Error(`Unknown electoral court code: ${courtCode}`)
      return `tre-${state}`
    }
    case '7': { // Justiça Militar Estadual
      const state = COURT_TO_STATE[courtCode]
      if (!state) throw new Error(`Unknown military court code: ${courtCode}`)
      return `tjm${state}`
    }
    default:
      throw new Error(`Unsupported justice segment: ${segment} (court ${courtCode})`)
  }
}

class DataJudApiService {
  private client: AxiosInstance
  private rateLimit: RateLimitConfig

  constructor(apiKey?: string) {
    const key = apiKey || DEFAULT_API_KEY

    this.rateLimit = {
      requests_per_minute: 120,
      current_requests: 0,
      window_start: Date.now(),
    }

    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Authorization': `APIKey ${key}`,
        'Content-Type': 'application/json',
      },
    })

    // Rate limiting interceptor
    this.client.interceptors.request.use(
      async (config) => {
        await this.enforceRateLimit()
        return config
      },
      (error) => Promise.reject(error)
    )

    // Error logging interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('DataJud API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
        })
        return Promise.reject(error)
      }
    )
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now()
    const windowDuration = 60_000

    if (now - this.rateLimit.window_start >= windowDuration) {
      this.rateLimit.current_requests = 0
      this.rateLimit.window_start = now
    }

    if (this.rateLimit.current_requests >= this.rateLimit.requests_per_minute) {
      const waitTime = windowDuration - (now - this.rateLimit.window_start)
      console.warn(`DataJud API rate limit reached. Waiting ${waitTime}ms`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      this.rateLimit.current_requests = 0
      this.rateLimit.window_start = Date.now()
    }

    this.rateLimit.current_requests++
  }

  /**
   * Search for a process by its CNJ number.
   * Automatically resolves the court endpoint from the number.
   *
   * Returns all matching DataJudProcesso entries (movements included).
   */
  async searchByProcessNumber(numeroProcesso: string): Promise<DataJudProcesso[]> {
    const digits = stripCnjFormatting(numeroProcesso)
    const courtEndpoint = resolveCourtEndpoint(numeroProcesso)
    const url = `/api_publica_${courtEndpoint}/_search`

    try {
      const response = await this.client.post<ElasticsearchResponse>(url, {
        query: {
          match: {
            numeroProcesso: digits,
          },
        },
      })

      return response.data.hits.hits.map(hit => ({
        ...hit._source,
        id: hit._id,
      }))
    } catch (error) {
      console.error('Error searching by process number:', error)
      throw new Error(`Failed to search DataJud for process ${numeroProcesso}`)
    }
  }

  /**
   * Test API connectivity by performing a lightweight search against STJ.
   */
  async testConnection(): Promise<{ success: boolean; message: string; responseTimeMs: number }> {
    const startTime = Date.now()

    try {
      const response = await this.client.post<ElasticsearchResponse>(
        '/api_publica_stj/_search',
        {
          query: { match_all: {} },
          size: 1,
        }
      )

      const responseTimeMs = Date.now() - startTime
      const hitCount = response.data.hits.total.value

      return {
        success: true,
        message: `DataJud API reachable. STJ index has ${hitCount} records. Response in ${responseTimeMs}ms.`,
        responseTimeMs,
      }
    } catch (error: unknown) {
      const responseTimeMs = Date.now() - startTime
      const message = error instanceof Error ? error.message : 'Unknown error'

      return {
        success: false,
        message: `Failed to connect to DataJud API: ${message}`,
        responseTimeMs,
      }
    }
  }

  getRateLimitStatus(): RateLimitConfig {
    return { ...this.rateLimit }
  }

  resetRateLimit(): void {
    this.rateLimit.current_requests = 0
    this.rateLimit.window_start = Date.now()
  }
}

// Singleton
let dataJudApiInstance: DataJudApiService | null = null

export const getDataJudApi = (): DataJudApiService => {
  if (!dataJudApiInstance) {
    // Use env var as optional override; the public key is the default
    const apiKey = process.env.DATAJUD_API_KEY || undefined
    dataJudApiInstance = new DataJudApiService(apiKey)
  }
  return dataJudApiInstance
}

export default DataJudApiService
