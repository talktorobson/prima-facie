// =====================================================
// DataJud CNJ API Service
// Brazilian National Judiciary Database Integration
// =====================================================

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'

// Rate limiting configuration
interface RateLimitConfig {
  requests_per_minute: number
  current_requests: number
  window_start: number
  queue: Array<() => void>
}

// DataJud API response types
export interface DataJudMovement {
  id: string
  dataHora: string
  codigo: number
  nome: string
  complemento?: string
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
  principal: boolean
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
    tipo: 'F' | 'J' // Física ou Jurídica
  }
  polo: 'ativo' | 'passivo'
  participacao?: string
}

export interface DataJudProcesso {
  id: string
  numeroProcesso: string
  tribunal: string
  grau: number
  dataAjuizamento?: string
  dataUltimaAtualizacao?: string
  orgaoJulgador: DataJudOrgaoJulgador
  classe: DataJudClasse
  sistema: DataJudSistema
  formato: DataJudFormato
  assuntos: DataJudAssunto[]
  participantes?: DataJudParticipante[]
  movimentos?: DataJudMovement[]
  valorCausa?: number
  segredoJustica: boolean
}

export interface DataJudApiResponse {
  processos: DataJudProcesso[]
  paginacao?: {
    total: number
    pagina: number
    tamanhoPagina: number
    totalPaginas: number
  }
}

export interface DataJudSearchParams {
  numeroProcesso?: string
  tribunal?: string
  dataInicio?: string
  dataFim?: string
  classe?: number[]
  assunto?: number[]
  orgaoJulgador?: number[]
  pagina?: number
  tamanhoPagina?: number
}

class DataJudApiService {
  private client: AxiosInstance
  private baseUrl: string
  private apiKey: string
  private rateLimit: RateLimitConfig

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl || 'https://datajud-api.cnj.jus.br'
    
    // Initialize rate limiting (120 requests per minute as per CNJ documentation)
    this.rateLimit = {
      requests_per_minute: 120,
      current_requests: 0,
      window_start: Date.now(),
      queue: []
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Prima-Facie-Legal-System/1.0'
      }
    })

    // Request interceptor for rate limiting
    this.client.interceptors.request.use(
      async (config) => {
        await this.enforceRateLimit()
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('DataJud API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            params: error.config?.params
          }
        })
        return Promise.reject(error)
      }
    )
  }

  /**
   * Enforce rate limiting (120 requests per minute)
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now()
    const windowDuration = 60 * 1000 // 1 minute in milliseconds

    // Reset window if needed
    if (now - this.rateLimit.window_start >= windowDuration) {
      this.rateLimit.current_requests = 0
      this.rateLimit.window_start = now
    }

    // Check if we're at the limit
    if (this.rateLimit.current_requests >= this.rateLimit.requests_per_minute) {
      const waitTime = windowDuration - (now - this.rateLimit.window_start)
      console.warn(`DataJud API rate limit reached. Waiting ${waitTime}ms`)
      
      await new Promise(resolve => setTimeout(resolve, waitTime))
      
      // Reset after waiting
      this.rateLimit.current_requests = 0
      this.rateLimit.window_start = Date.now()
    }

    this.rateLimit.current_requests++
  }

  /**
   * Search for processes by case number
   */
  async searchByProcessNumber(numeroProcesso: string, tribunal?: string): Promise<DataJudProcesso[]> {
    try {
      const params: DataJudSearchParams = {
        numeroProcesso: this.sanitizeProcessNumber(numeroProcesso)
      }

      if (tribunal) {
        params.tribunal = tribunal
      }

      const response = await this.client.get<DataJudApiResponse>('/api/v1/processos', { params })
      
      return response.data.processos || []
    } catch (error) {
      console.error('Error searching by process number:', error)
      throw new Error(`Failed to search DataJud for process ${numeroProcesso}`)
    }
  }

  /**
   * Get detailed process information including movements
   */
  async getProcessDetails(processId: string, includeMovements: boolean = true): Promise<DataJudProcesso | null> {
    try {
      const url = `/api/v1/processos/${processId}`
      const params = includeMovements ? { incluirMovimentos: true } : {}

      const response = await this.client.get<DataJudProcesso>(url, { params })
      
      return response.data
    } catch (error) {
      console.error('Error getting process details:', error)
      return null
    }
  }

  /**
   * Get process movements (timeline events)
   */
  async getProcessMovements(processId: string, dataInicio?: string, dataFim?: string): Promise<DataJudMovement[]> {
    try {
      const params: any = {}
      
      if (dataInicio) params.dataInicio = dataInicio
      if (dataFim) params.dataFim = dataFim

      const response = await this.client.get<{ movimentos: DataJudMovement[] }>(
        `/api/v1/processos/${processId}/movimentos`,
        { params }
      )
      
      return response.data.movimentos || []
    } catch (error) {
      console.error('Error getting process movements:', error)
      return []
    }
  }

  /**
   * Search processes by multiple criteria
   */
  async searchProcesses(params: DataJudSearchParams): Promise<DataJudApiResponse> {
    try {
      // Sanitize process number if provided
      if (params.numeroProcesso) {
        params.numeroProcesso = this.sanitizeProcessNumber(params.numeroProcesso)
      }

      const response = await this.client.get<DataJudApiResponse>('/api/v1/processos', { params })
      
      return response.data
    } catch (error) {
      console.error('Error searching processes:', error)
      throw new Error('Failed to search DataJud processes')
    }
  }

  /**
   * Get available tribunals
   */
  async getTribunals(): Promise<Array<{ codigo: string; nome: string; sigla: string }>> {
    try {
      const response = await this.client.get('/api/v1/tribunais')
      return response.data.tribunais || []
    } catch (error) {
      console.error('Error getting tribunals:', error)
      return []
    }
  }

  /**
   * Get process classes (tipos de processo)
   */
  async getProcessClasses(): Promise<DataJudClasse[]> {
    try {
      const response = await this.client.get('/api/v1/classes')
      return response.data.classes || []
    } catch (error) {
      console.error('Error getting process classes:', error)
      return []
    }
  }

  /**
   * Get legal subjects (assuntos jurídicos)
   */
  async getLegalSubjects(): Promise<DataJudAssunto[]> {
    try {
      const response = await this.client.get('/api/v1/assuntos')
      return response.data.assuntos || []
    } catch (error) {
      console.error('Error getting legal subjects:', error)
      return []
    }
  }

  /**
   * Test API connectivity and authentication
   */
  async testConnection(): Promise<{ success: boolean; message: string; rateLimit?: RateLimitConfig }> {
    try {
      const response = await this.client.get('/api/v1/status')
      
      return {
        success: true,
        message: 'DataJud API connection successful',
        rateLimit: this.rateLimit
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to connect to DataJud API',
        rateLimit: this.rateLimit
      }
    }
  }

  /**
   * Sanitize CNJ process number format
   */
  private sanitizeProcessNumber(processNumber: string): string {
    // Remove all non-numeric characters
    const cleaned = processNumber.replace(/\D/g, '')
    
    // CNJ format: NNNNNNN-DD.AAAA.J.TR.OOOO (20 digits)
    if (cleaned.length === 20) {
      return `${cleaned.substring(0, 7)}-${cleaned.substring(7, 9)}.${cleaned.substring(9, 13)}.${cleaned.substring(13, 14)}.${cleaned.substring(14, 16)}.${cleaned.substring(16, 20)}`
    }
    
    // Return as-is if not standard format
    return processNumber
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): RateLimitConfig {
    return { ...this.rateLimit }
  }

  /**
   * Reset rate limit (for testing purposes)
   */
  resetRateLimit(): void {
    this.rateLimit.current_requests = 0
    this.rateLimit.window_start = Date.now()
    this.rateLimit.queue = []
  }
}

// Export singleton instance
let dataJudApiInstance: DataJudApiService | null = null

export const getDataJudApi = (): DataJudApiService => {
  if (!dataJudApiInstance) {
    const apiKey = process.env.DATAJUD_API_KEY
    if (!apiKey) {
      throw new Error('DATAJUD_API_KEY environment variable is required')
    }
    
    dataJudApiInstance = new DataJudApiService(apiKey)
  }
  
  return dataJudApiInstance
}

export default DataJudApiService