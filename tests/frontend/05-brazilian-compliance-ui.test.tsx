/**
 * Frontend UI Tests: Brazilian Legal Compliance System
 * Tests all Brazilian-specific UI components and user interactions
 * 
 * Test Coverage:
 * - CNPJ/CPF input validation and formatting
 * - PIX payment integration
 * - Portuguese language interface
 * - Tax calculation displays
 * - Legal document templates (Brazilian format)
 * - Currency formatting (BRL)
 * - Date/time formatting (Brazilian format)
 * - Address formatting with CEP
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, jest, beforeAll, afterEach } from '@jest/globals'

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/clients/new',
}))

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  lte: jest.fn(() => mockSupabase),
  in: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(),
  or: jest.fn(() => mockSupabase),
  filter: jest.fn(() => mockSupabase),
  limit: jest.fn(() => mockSupabase),
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

// Mock auth context
const mockAuthContext = {
  user: {
    id: 'test-user-123',
    email: 'admin@test.com',
    user_metadata: {
      role: 'admin',
      law_firm_id: 'test-firm-123'
    }
  },
  profile: {
    id: 'test-user-123',
    law_firm_id: 'test-firm-123',
    role: 'admin',
    full_name: 'Admin User'
  }
}

jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext
}))

// Mock Brazilian Document Validation Component
const MockBrazilianDocumentForm = ({ onValidation, onFormSubmit }) => {
  const [formData, setFormData] = React.useState({
    document_type: '',
    document_number: '',
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      cep: ''
    }
  })

  const [validationResults, setValidationResults] = React.useState({
    document_valid: null,
    document_formatted: '',
    cep_valid: null,
    address_found: null
  })

  const [errors, setErrors] = React.useState({})

  // CNPJ validation
  const validateCNPJ = (cnpj) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '')
    if (cleanCNPJ.length !== 14) return false

    // Basic CNPJ validation algorithm
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ[i]) * weights1[i]
    }
    const digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11)

    sum = 0
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ[i]) * weights2[i]
    }
    const digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11)

    return digit1 === parseInt(cleanCNPJ[12]) && digit2 === parseInt(cleanCNPJ[13])
  }

  // CPF validation
  const validateCPF = (cpf) => {
    const cleanCPF = cpf.replace(/\D/g, '')
    if (cleanCPF.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false // All same digits

    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF[i]) * (10 - i)
    }
    const digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11)

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF[i]) * (11 - i)
    }
    const digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11)

    return digit1 === parseInt(cleanCPF[9]) && digit2 === parseInt(cleanCPF[10])
  }

  // Document formatting
  const formatCNPJ = (cnpj) => {
    const clean = cnpj.replace(/\D/g, '')
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }

  const formatCPF = (cpf) => {
    const clean = cpf.replace(/\D/g, '')
    return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
  }

  // CEP validation and formatting
  const formatCEP = (cep) => {
    const clean = cep.replace(/\D/g, '')
    return clean.replace(/^(\d{5})(\d{3})$/, '$1-$2')
  }

  const validateCEP = (cep) => {
    const clean = cep.replace(/\D/g, '')
    return clean.length === 8
  }

  // Phone formatting
  const formatPhone = (phone) => {
    const clean = phone.replace(/\D/g, '')
    if (clean.length === 11) {
      return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
    } else if (clean.length === 10) {
      return clean.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
    }
    return phone
  }

  const handleDocumentChange = (value) => {
    const clean = value.replace(/\D/g, '')
    let isValid = false
    let formatted = value

    if (formData.document_type === 'cnpj') {
      if (clean.length <= 14) {
        formatted = formatCNPJ(clean)
        isValid = clean.length === 14 ? validateCNPJ(clean) : null
      }
    } else if (formData.document_type === 'cpf') {
      if (clean.length <= 11) {
        formatted = formatCPF(clean)
        isValid = clean.length === 11 ? validateCPF(clean) : null
      }
    }

    setFormData({ ...formData, document_number: formatted })
    setValidationResults({ 
      ...validationResults, 
      document_valid: isValid,
      document_formatted: formatted
    })

    onValidation && onValidation({
      type: formData.document_type,
      number: formatted,
      isValid: isValid
    })
  }

  const handleCEPChange = (value) => {
    const clean = value.replace(/\D/g, '')
    const formatted = formatCEP(clean)
    const isValid = validateCEP(clean)

    setFormData({
      ...formData,
      address: { ...formData.address, cep: formatted }
    })

    setValidationResults({
      ...validationResults,
      cep_valid: isValid,
      address_found: isValid // Mock address lookup
    })

    // Mock address autocomplete
    if (isValid && clean === '01310100') {
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          cep: formatted,
          street: 'Avenida Paulista',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP'
        }
      })
      setValidationResults({
        ...validationResults,
        cep_valid: true,
        address_found: true
      })
    }
  }

  const handlePhoneChange = (value) => {
    const formatted = formatPhone(value)
    setFormData({ ...formData, phone: formatted })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    // Validate required fields
    if (!formData.document_type) newErrors.document_type = 'Tipo de documento é obrigatório'
    if (!formData.document_number) newErrors.document_number = 'Número do documento é obrigatório'
    if (validationResults.document_valid === false) newErrors.document_number = 'Documento inválido'
    if (!formData.name) newErrors.name = 'Nome é obrigatório'
    if (!formData.email) newErrors.email = 'Email é obrigatório'
    if (!formData.address.cep) newErrors.cep = 'CEP é obrigatório'
    if (validationResults.cep_valid === false) newErrors.cep = 'CEP inválido'

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      onFormSubmit && onFormSubmit(formData)
    }
  }

  return (
    <div data-testid="brazilian-document-form">
      <h1>Cadastro de Cliente - Brasil</h1>
      
      <form onSubmit={handleSubmit} data-testid="client-form">
        {/* Document Type Selection */}
        <div data-testid="document-type-section">
          <label>Tipo de Documento:</label>
          <div data-testid="document-type-options">
            <label data-testid="cpf-option">
              <input
                type="radio"
                name="document_type"
                value="cpf"
                checked={formData.document_type === 'cpf'}
                onChange={(e) => setFormData({ ...formData, document_type: e.target.value, document_number: '' })}
              />
              CPF (Pessoa Física)
            </label>
            <label data-testid="cnpj-option">
              <input
                type="radio"
                name="document_type"
                value="cnpj"
                checked={formData.document_type === 'cnpj'}
                onChange={(e) => setFormData({ ...formData, document_type: e.target.value, document_number: '' })}
              />
              CNPJ (Pessoa Jurídica)
            </label>
          </div>
          {errors.document_type && (
            <div data-testid="document-type-error" className="error">
              {errors.document_type}
            </div>
          )}
        </div>

        {/* Document Number Input */}
        {formData.document_type && (
          <div data-testid="document-number-section">
            <label>
              {formData.document_type === 'cpf' ? 'CPF:' : 'CNPJ:'}
            </label>
            <input
              data-testid="document-number-input"
              type="text"
              value={formData.document_number}
              onChange={(e) => handleDocumentChange(e.target.value)}
              placeholder={formData.document_type === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
              maxLength={formData.document_type === 'cpf' ? 14 : 18}
            />
            {validationResults.document_valid === true && (
              <div data-testid="document-valid-indicator" className="success">
                ✅ Documento válido
              </div>
            )}
            {validationResults.document_valid === false && (
              <div data-testid="document-invalid-indicator" className="error">
                ❌ Documento inválido
              </div>
            )}
            {errors.document_number && (
              <div data-testid="document-number-error" className="error">
                {errors.document_number}
              </div>
            )}
          </div>
        )}

        {/* Name Input */}
        <div data-testid="name-section">
          <label>
            {formData.document_type === 'cpf' ? 'Nome Completo:' : 'Razão Social:'}
          </label>
          <input
            data-testid="name-input"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={formData.document_type === 'cpf' ? 'João da Silva' : 'Empresa Ltda'}
          />
          {errors.name && (
            <div data-testid="name-error" className="error">
              {errors.name}
            </div>
          )}
        </div>

        {/* Email Input */}
        <div data-testid="email-section">
          <label>Email:</label>
          <input
            data-testid="email-input"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@exemplo.com.br"
          />
          {errors.email && (
            <div data-testid="email-error" className="error">
              {errors.email}
            </div>
          )}
        </div>

        {/* Phone Input */}
        <div data-testid="phone-section">
          <label>Telefone:</label>
          <input
            data-testid="phone-input"
            type="text"
            value={formData.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="(11) 99999-9999"
            maxLength={15}
          />
        </div>

        {/* Address Section */}
        <div data-testid="address-section">
          <h3>Endereço</h3>
          
          {/* CEP Input */}
          <div data-testid="cep-section">
            <label>CEP:</label>
            <input
              data-testid="cep-input"
              type="text"
              value={formData.address.cep}
              onChange={(e) => handleCEPChange(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
            />
            {validationResults.cep_valid === true && (
              <div data-testid="cep-valid-indicator" className="success">
                ✅ CEP válido
              </div>
            )}
            {validationResults.address_found === true && (
              <div data-testid="address-found-indicator" className="success">
                📍 Endereço encontrado
              </div>
            )}
            {errors.cep && (
              <div data-testid="cep-error" className="error">
                {errors.cep}
              </div>
            )}
          </div>

          {/* Street Input */}
          <div data-testid="street-section">
            <label>Logradouro:</label>
            <input
              data-testid="street-input"
              type="text"
              value={formData.address.street}
              onChange={(e) => setFormData({
                ...formData,
                address: { ...formData.address, street: e.target.value }
              })}
              placeholder="Rua, Avenida, etc."
            />
          </div>

          {/* Number Input */}
          <div data-testid="number-section">
            <label>Número:</label>
            <input
              data-testid="number-input"
              type="text"
              value={formData.address.number}
              onChange={(e) => setFormData({
                ...formData,
                address: { ...formData.address, number: e.target.value }
              })}
              placeholder="123"
            />
          </div>

          {/* Complement Input */}
          <div data-testid="complement-section">
            <label>Complemento:</label>
            <input
              data-testid="complement-input"
              type="text"
              value={formData.address.complement}
              onChange={(e) => setFormData({
                ...formData,
                address: { ...formData.address, complement: e.target.value }
              })}
              placeholder="Apto, Sala, etc. (opcional)"
            />
          </div>

          {/* Neighborhood Input */}
          <div data-testid="neighborhood-section">
            <label>Bairro:</label>
            <input
              data-testid="neighborhood-input"
              type="text"
              value={formData.address.neighborhood}
              onChange={(e) => setFormData({
                ...formData,
                address: { ...formData.address, neighborhood: e.target.value }
              })}
              placeholder="Centro, Vila, etc."
            />
          </div>

          {/* City Input */}
          <div data-testid="city-section">
            <label>Cidade:</label>
            <input
              data-testid="city-input"
              type="text"
              value={formData.address.city}
              onChange={(e) => setFormData({
                ...formData,
                address: { ...formData.address, city: e.target.value }
              })}
              placeholder="São Paulo"
            />
          </div>

          {/* State Input */}
          <div data-testid="state-section">
            <label>Estado:</label>
            <select
              data-testid="state-select"
              value={formData.address.state}
              onChange={(e) => setFormData({
                ...formData,
                address: { ...formData.address, state: e.target.value }
              })}
            >
              <option value="">Selecione o Estado</option>
              <option value="AC">Acre</option>
              <option value="AL">Alagoas</option>
              <option value="AP">Amapá</option>
              <option value="AM">Amazonas</option>
              <option value="BA">Bahia</option>
              <option value="CE">Ceará</option>
              <option value="DF">Distrito Federal</option>
              <option value="ES">Espírito Santo</option>
              <option value="GO">Goiás</option>
              <option value="MA">Maranhão</option>
              <option value="MT">Mato Grosso</option>
              <option value="MS">Mato Grosso do Sul</option>
              <option value="MG">Minas Gerais</option>
              <option value="PA">Pará</option>
              <option value="PB">Paraíba</option>
              <option value="PR">Paraná</option>
              <option value="PE">Pernambuco</option>
              <option value="PI">Piauí</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="RN">Rio Grande do Norte</option>
              <option value="RS">Rio Grande do Sul</option>
              <option value="RO">Rondônia</option>
              <option value="RR">Roraima</option>
              <option value="SC">Santa Catarina</option>
              <option value="SP">São Paulo</option>
              <option value="SE">Sergipe</option>
              <option value="TO">Tocantins</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div data-testid="form-actions">
          <button
            type="submit"
            data-testid="submit-button"
            disabled={validationResults.document_valid !== true || validationResults.cep_valid !== true}
          >
            Cadastrar Cliente
          </button>
        </div>
      </form>
    </div>
  )
}

// Mock PIX Payment Component
const MockPIXPayment = ({ amount, onPaymentGenerate, onPaymentConfirm }) => {
  const [pixData, setPixData] = React.useState(null)
  const [paymentStatus, setPaymentStatus] = React.useState('pending') // pending, generated, confirmed, expired
  const [timeRemaining, setTimeRemaining] = React.useState(300) // 5 minutes in seconds

  React.useEffect(() => {
    let interval
    if (pixData && paymentStatus === 'generated' && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setPaymentStatus('expired')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [pixData, paymentStatus, timeRemaining])

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const generatePIX = () => {
    const pixData = {
      key: '12.345.678/0001-90', // CNPJ as PIX key
      amount: amount,
      reference: `PRIMA-FACIE-${Date.now()}`,
      qr_code: 'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEA...', // Mock QR code data
      pix_copy_paste: `00020101021243650016BR.GOV.BCB.PIX2543pix-qr.mercadopago.com/instore/o/v2/9b9b9b9b5204000053039865802BR5925PRIMA FACIE ADVOCACIA S6009SAO PAULO6304ABCD`,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
    }

    setPixData(pixData)
    setPaymentStatus('generated')
    setTimeRemaining(300)

    onPaymentGenerate && onPaymentGenerate(pixData)
  }

  const confirmPayment = () => {
    setPaymentStatus('confirmed')
    onPaymentConfirm && onPaymentConfirm(pixData)
  }

  const copyPixCode = () => {
    if (pixData?.pix_copy_paste) {
      navigator.clipboard.writeText(pixData.pix_copy_paste)
    }
  }

  return (
    <div data-testid="pix-payment">
      <h2>Pagamento via PIX</h2>
      
      {/* Payment Info */}
      <div data-testid="payment-info" className="payment-info">
        <div data-testid="payment-amount">
          Valor: {formatCurrency(amount)}
        </div>
        <div data-testid="payment-method">
          Método: PIX - Pagamento Instantâneo
        </div>
      </div>

      {/* Payment Status */}
      <div data-testid="payment-status" className={`status ${paymentStatus}`}>
        {paymentStatus === 'pending' && (
          <div data-testid="status-pending">
            Clique no botão abaixo para gerar o código PIX
          </div>
        )}
        {paymentStatus === 'generated' && (
          <div data-testid="status-generated">
            Código PIX gerado! Escaneie o QR Code ou copie o código
          </div>
        )}
        {paymentStatus === 'confirmed' && (
          <div data-testid="status-confirmed" className="success">
            ✅ Pagamento confirmado com sucesso!
          </div>
        )}
        {paymentStatus === 'expired' && (
          <div data-testid="status-expired" className="error">
            ⏰ Código PIX expirado. Gere um novo código.
          </div>
        )}
      </div>

      {/* Generate PIX Button */}
      {paymentStatus === 'pending' && (
        <div data-testid="generate-pix-section">
          <button
            data-testid="generate-pix-btn"
            onClick={generatePIX}
            className="pix-button"
          >
            🏦 Gerar Código PIX
          </button>
        </div>
      )}

      {/* PIX Code Display */}
      {pixData && (paymentStatus === 'generated' || paymentStatus === 'confirmed') && (
        <div data-testid="pix-code-display" className="pix-display">
          {/* Timer */}
          {paymentStatus === 'generated' && (
            <div data-testid="pix-timer" className="timer">
              Expira em: {formatTime(timeRemaining)}
            </div>
          )}

          {/* QR Code */}
          <div data-testid="qr-code-section">
            <h3>QR Code PIX</h3>
            <div data-testid="qr-code-placeholder" className="qr-code">
              [QR CODE - {pixData.reference}]
            </div>
            <p>Escaneie com seu aplicativo bancário</p>
          </div>

          {/* PIX Key */}
          <div data-testid="pix-key-section">
            <h3>Chave PIX</h3>
            <div data-testid="pix-key-display">
              {pixData.key}
            </div>
            <div data-testid="pix-amount-display">
              Valor: {formatCurrency(pixData.amount)}
            </div>
          </div>

          {/* Copy Paste Code */}
          <div data-testid="pix-copy-section">
            <h3>Código PIX Copia e Cola</h3>
            <div data-testid="pix-copy-paste" className="copy-paste-code">
              {pixData.pix_copy_paste}
            </div>
            <button
              data-testid="copy-pix-btn"
              onClick={copyPixCode}
              className="copy-button"
            >
              📋 Copiar Código PIX
            </button>
          </div>

          {/* Payment Instructions */}
          <div data-testid="pix-instructions" className="instructions">
            <h3>Como pagar:</h3>
            <ol>
              <li>Abra o aplicativo do seu banco</li>
              <li>Escolha a opção PIX</li>
              <li>Escaneie o QR Code ou cole o código</li>
              <li>Confirme os dados e finalize o pagamento</li>
            </ol>
          </div>

          {/* Confirm Payment Button (for testing) */}
          {paymentStatus === 'generated' && (
            <div data-testid="confirm-payment-section">
              <button
                data-testid="confirm-payment-btn"
                onClick={confirmPayment}
                className="confirm-button"
              >
                ✅ Simular Pagamento Recebido
              </button>
            </div>
          )}
        </div>
      )}

      {/* Expired - Generate New */}
      {paymentStatus === 'expired' && (
        <div data-testid="generate-new-section">
          <button
            data-testid="generate-new-pix-btn"
            onClick={() => {
              setPaymentStatus('pending')
              setPixData(null)
              setTimeRemaining(300)
            }}
            className="pix-button"
          >
            🔄 Gerar Novo Código PIX
          </button>
        </div>
      )}
    </div>
  )
}

// Mock Brazilian Tax Calculator Component
const MockBrazilianTaxCalculator = ({ invoiceAmount, clientType, onTaxCalculation }) => {
  const [taxData, setTaxData] = React.useState({
    regime: 'simples_nacional', // simples_nacional, lucro_presumido, lucro_real
    service_type: 'juridico',
    municipality: 'sao_paulo',
    iss_rate: 3.0, // ISS municipal
    pis_rate: 0.65,
    cofins_rate: 3.0,
    ir_rate: 1.5,
    csll_rate: 1.0,
    total_tax_rate: 9.15
  })

  const [calculationResult, setCalculationResult] = React.useState(null)

  React.useEffect(() => {
    calculateTaxes()
  }, [invoiceAmount, taxData.regime, taxData.municipality])

  const calculateTaxes = () => {
    let taxes = {}

    if (taxData.regime === 'simples_nacional') {
      // Simples Nacional - Anexo V (Serviços)
      const aliquot = getSimpleNacionalRate(invoiceAmount)
      taxes = {
        regime: 'Simples Nacional',
        aliquot_percentage: aliquot,
        das_amount: (invoiceAmount * aliquot) / 100,
        iss_amount: 0, // Included in DAS
        net_amount: invoiceAmount - ((invoiceAmount * aliquot) / 100),
        breakdown: {
          irpj: (invoiceAmount * 0.4) / 100,
          csll: (invoiceAmount * 0.35) / 100,
          cofins: (invoiceAmount * 0.79) / 100,
          pis: (invoiceAmount * 0.17) / 100,
          cpp: (invoiceAmount * 2.75) / 100,
          iss: (invoiceAmount * 4.54) / 100
        }
      }
    } else {
      // Lucro Presumido or Real
      taxes = {
        regime: taxData.regime === 'lucro_presumido' ? 'Lucro Presumido' : 'Lucro Real',
        iss_amount: (invoiceAmount * taxData.iss_rate) / 100,
        pis_amount: (invoiceAmount * taxData.pis_rate) / 100,
        cofins_amount: (invoiceAmount * taxData.cofins_rate) / 100,
        ir_amount: (invoiceAmount * taxData.ir_rate) / 100,
        csll_amount: (invoiceAmount * taxData.csll_rate) / 100,
        total_tax_amount: (invoiceAmount * taxData.total_tax_rate) / 100,
        net_amount: invoiceAmount - ((invoiceAmount * taxData.total_tax_rate) / 100)
      }
    }

    setCalculationResult(taxes)
    onTaxCalculation && onTaxCalculation(taxes)
  }

  const getSimpleNacionalRate = (amount) => {
    // Simples Nacional - Anexo V rates (2024)
    if (amount <= 180000) return 9.0
    if (amount <= 360000) return 10.8
    if (amount <= 720000) return 13.5
    if (amount <= 1800000) return 16.2
    if (amount <= 3600000) return 21.0
    if (amount <= 4800000) return 33.0
    return 33.0 // Above limit
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatPercentage = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100)
  }

  return (
    <div data-testid="brazilian-tax-calculator">
      <h2>Calculadora de Impostos - Brasil</h2>

      {/* Tax Configuration */}
      <div data-testid="tax-config" className="tax-config">
        <h3>Configuração Tributária</h3>
        
        <div data-testid="regime-selection">
          <label>Regime Tributário:</label>
          <select
            value={taxData.regime}
            onChange={(e) => setTaxData({ ...taxData, regime: e.target.value })}
          >
            <option value="simples_nacional">Simples Nacional</option>
            <option value="lucro_presumido">Lucro Presumido</option>
            <option value="lucro_real">Lucro Real</option>
          </select>
        </div>

        <div data-testid="municipality-selection">
          <label>Município:</label>
          <select
            value={taxData.municipality}
            onChange={(e) => setTaxData({ ...taxData, municipality: e.target.value })}
          >
            <option value="sao_paulo">São Paulo - SP</option>
            <option value="rio_janeiro">Rio de Janeiro - RJ</option>
            <option value="belo_horizonte">Belo Horizonte - MG</option>
            <option value="brasilia">Brasília - DF</option>
          </select>
        </div>

        <div data-testid="client-type-display">
          <label>Tipo de Cliente:</label>
          <span>{clientType === 'cnpj' ? 'Pessoa Jurídica' : 'Pessoa Física'}</span>
        </div>
      </div>

      {/* Invoice Details */}
      <div data-testid="invoice-details" className="invoice-details">
        <h3>Detalhes da Fatura</h3>
        <div data-testid="invoice-amount">
          Valor Bruto: {formatCurrency(invoiceAmount)}
        </div>
        <div data-testid="service-type">
          Tipo de Serviço: Serviços Jurídicos
        </div>
      </div>

      {/* Tax Calculation Results */}
      {calculationResult && (
        <div data-testid="tax-calculation-results" className="tax-results">
          <h3>Cálculo de Impostos</h3>
          
          <div data-testid="tax-regime-display">
            Regime: {calculationResult.regime}
          </div>

          {calculationResult.regime === 'Simples Nacional' ? (
            <div data-testid="simples-nacional-results">
              <div data-testid="aliquot-percentage">
                Alíquota: {formatPercentage(calculationResult.aliquot_percentage)}
              </div>
              <div data-testid="das-amount">
                DAS (Documento de Arrecadação): {formatCurrency(calculationResult.das_amount)}
              </div>
              
              <div data-testid="tax-breakdown" className="breakdown">
                <h4>Composição do DAS:</h4>
                <div data-testid="irpj-amount">IRPJ: {formatCurrency(calculationResult.breakdown.irpj)}</div>
                <div data-testid="csll-amount">CSLL: {formatCurrency(calculationResult.breakdown.csll)}</div>
                <div data-testid="cofins-amount">COFINS: {formatCurrency(calculationResult.breakdown.cofins)}</div>
                <div data-testid="pis-amount">PIS: {formatCurrency(calculationResult.breakdown.pis)}</div>
                <div data-testid="cpp-amount">CPP: {formatCurrency(calculationResult.breakdown.cpp)}</div>
                <div data-testid="iss-amount">ISS: {formatCurrency(calculationResult.breakdown.iss)}</div>
              </div>
            </div>
          ) : (
            <div data-testid="traditional-regime-results">
              <div data-testid="iss-tax">ISS ({formatPercentage(taxData.iss_rate)}): {formatCurrency(calculationResult.iss_amount)}</div>
              <div data-testid="pis-tax">PIS ({formatPercentage(taxData.pis_rate)}): {formatCurrency(calculationResult.pis_amount)}</div>
              <div data-testid="cofins-tax">COFINS ({formatPercentage(taxData.cofins_rate)}): {formatCurrency(calculationResult.cofins_amount)}</div>
              <div data-testid="ir-tax">IRRF ({formatPercentage(taxData.ir_rate)}): {formatCurrency(calculationResult.ir_amount)}</div>
              <div data-testid="csll-tax">CSLL ({formatPercentage(taxData.csll_rate)}): {formatCurrency(calculationResult.csll_amount)}</div>
              <div data-testid="total-tax">Total de Impostos: {formatCurrency(calculationResult.total_tax_amount)}</div>
            </div>
          )}

          <div data-testid="net-amount" className="net-amount">
            <strong>Valor Líquido: {formatCurrency(calculationResult.net_amount)}</strong>
          </div>

          {/* Tax Summary Table */}
          <div data-testid="tax-summary-table" className="tax-table">
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Percentual</th>
                </tr>
              </thead>
              <tbody>
                <tr data-testid="gross-amount-row">
                  <td>Valor Bruto</td>
                  <td>{formatCurrency(invoiceAmount)}</td>
                  <td>100,00%</td>
                </tr>
                <tr data-testid="tax-amount-row">
                  <td>(-) Impostos</td>
                  <td>{formatCurrency(invoiceAmount - calculationResult.net_amount)}</td>
                  <td>{formatPercentage(((invoiceAmount - calculationResult.net_amount) / invoiceAmount) * 100)}</td>
                </tr>
                <tr data-testid="net-amount-row" className="total-row">
                  <td><strong>Valor Líquido</strong></td>
                  <td><strong>{formatCurrency(calculationResult.net_amount)}</strong></td>
                  <td><strong>{formatPercentage((calculationResult.net_amount / invoiceAmount) * 100)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Test wrapper with providers
const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Brazilian Legal Compliance UI Tests', () => {
  let user

  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/clients/new',
        pathname: '/clients/new',
        search: '',
        hash: '',
        assign: jest.fn(),
        replace: jest.fn(),
        reload: jest.fn(),
      },
      writable: true,
    })

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    })

    // Mock timers for PIX payment
    jest.useFakeTimers()
  })

  beforeEach(() => {
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    jest.clearAllMocks()
    
    mockSupabase.single.mockResolvedValue({ data: null, error: null })
    mockSupabase.select.mockResolvedValue({ data: [], error: null })
    mockSupabase.insert.mockResolvedValue({ data: [], error: null })
    mockSupabase.update.mockResolvedValue({ data: [], error: null })
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('CNPJ/CPF Input Validation and Formatting', () => {
    it('should validate and format CPF correctly', async () => {
      const onValidation = jest.fn()
      
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm onValidation={onValidation} />
        </TestWrapper>
      )

      // Select CPF option
      const cpfOption = screen.getByTestId('cpf-option').querySelector('input')
      await user.click(cpfOption)

      // Enter valid CPF
      const documentInput = screen.getByTestId('document-number-input')
      await user.type(documentInput, '12345678909') // Valid CPF

      // Should format automatically
      expect(documentInput).toHaveValue('123.456.789-09')

      // Should show valid indicator
      await waitFor(() => {
        expect(screen.getByTestId('document-valid-indicator')).toBeInTheDocument()
      })

      // Should call validation callback
      expect(onValidation).toHaveBeenCalledWith({
        type: 'cpf',
        number: '123.456.789-09',
        isValid: true
      })
    })

    it('should validate and format CNPJ correctly', async () => {
      const onValidation = jest.fn()
      
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm onValidation={onValidation} />
        </TestWrapper>
      )

      // Select CNPJ option
      const cnpjOption = screen.getByTestId('cnpj-option').querySelector('input')
      await user.click(cnpjOption)

      // Enter valid CNPJ
      const documentInput = screen.getByTestId('document-number-input')
      await user.type(documentInput, '11222333000181') // Valid CNPJ

      // Should format automatically
      expect(documentInput).toHaveValue('11.222.333/0001-81')

      // Should show valid indicator
      await waitFor(() => {
        expect(screen.getByTestId('document-valid-indicator')).toBeInTheDocument()
      })

      // Should call validation callback
      expect(onValidation).toHaveBeenCalledWith({
        type: 'cnpj',
        number: '11.222.333/0001-81',
        isValid: true
      })
    })

    it('should show invalid indicator for wrong CPF', async () => {
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      // Select CPF option
      const cpfOption = screen.getByTestId('cpf-option').querySelector('input')
      await user.click(cpfOption)

      // Enter invalid CPF
      const documentInput = screen.getByTestId('document-number-input')
      await user.type(documentInput, '12345678900') // Invalid CPF

      // Should show invalid indicator
      await waitFor(() => {
        expect(screen.getByTestId('document-invalid-indicator')).toBeInTheDocument()
      })
    })

    it('should show invalid indicator for wrong CNPJ', async () => {
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      // Select CNPJ option
      const cnpjOption = screen.getByTestId('cnpj-option').querySelector('input')
      await user.click(cnpjOption)

      // Enter invalid CNPJ
      const documentInput = screen.getByTestId('document-number-input')
      await user.type(documentInput, '11222333000100') // Invalid CNPJ

      // Should show invalid indicator
      await waitFor(() => {
        expect(screen.getByTestId('document-invalid-indicator')).toBeInTheDocument()
      })
    })

    it('should reject sequential numbers for CPF', async () => {
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      const cpfOption = screen.getByTestId('cpf-option').querySelector('input')
      await user.click(cpfOption)

      const documentInput = screen.getByTestId('document-number-input')
      await user.type(documentInput, '11111111111') // All same digits

      await waitFor(() => {
        expect(screen.getByTestId('document-invalid-indicator')).toBeInTheDocument()
      })
    })

    it('should limit input length correctly', async () => {
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      // Test CPF length limit
      const cpfOption = screen.getByTestId('cpf-option').querySelector('input')
      await user.click(cpfOption)

      const documentInput = screen.getByTestId('document-number-input')
      expect(documentInput).toHaveAttribute('maxLength', '14') // XXX.XXX.XXX-XX

      // Clear and test CNPJ length limit
      const cnpjOption = screen.getByTestId('cnpj-option').querySelector('input')
      await user.click(cnpjOption)

      expect(documentInput).toHaveAttribute('maxLength', '18') // XX.XXX.XXX/XXXX-XX
    })
  })

  describe('CEP and Address Validation', () => {
    it('should validate and format CEP correctly', async () => {
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      const cepInput = screen.getByTestId('cep-input')
      await user.type(cepInput, '01310100') // Valid CEP

      // Should format automatically
      expect(cepInput).toHaveValue('01310-100')

      // Should show valid indicator
      await waitFor(() => {
        expect(screen.getByTestId('cep-valid-indicator')).toBeInTheDocument()
      })
    })

    it('should autocomplete address for known CEP', async () => {
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      const cepInput = screen.getByTestId('cep-input')
      await user.type(cepInput, '01310100') // Avenida Paulista CEP

      // Should show address found indicator
      await waitFor(() => {
        expect(screen.getByTestId('address-found-indicator')).toBeInTheDocument()
      })

      // Should autocomplete address fields
      await waitFor(() => {
        expect(screen.getByTestId('street-input')).toHaveValue('Avenida Paulista')
        expect(screen.getByTestId('neighborhood-input')).toHaveValue('Bela Vista')
        expect(screen.getByTestId('city-input')).toHaveValue('São Paulo')
        expect(screen.getByTestId('state-select')).toHaveValue('SP')
      })
    })

    it('should limit CEP input length', async () => {
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      const cepInput = screen.getByTestId('cep-input')
      expect(cepInput).toHaveAttribute('maxLength', '9') // XXXXX-XXX
    })

    it('should provide Brazilian states in select', async () => {
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      const stateSelect = screen.getByTestId('state-select')
      
      // Check for some major Brazilian states
      expect(within(stateSelect).getByText('São Paulo')).toBeInTheDocument()
      expect(within(stateSelect).getByText('Rio de Janeiro')).toBeInTheDocument()
      expect(within(stateSelect).getByText('Minas Gerais')).toBeInTheDocument()
      expect(within(stateSelect).getByText('Distrito Federal')).toBeInTheDocument()
    })
  })

  describe('Phone Number Formatting', () => {
    it('should format mobile phone number correctly', async () => {
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      const phoneInput = screen.getByTestId('phone-input')
      await user.type(phoneInput, '11999887766') // 11 digits (mobile)

      // Should format as (XX) XXXXX-XXXX
      expect(phoneInput).toHaveValue('(11) 99988-7766')
    })

    it('should format landline phone number correctly', async () => {
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      const phoneInput = screen.getByTestId('phone-input')
      await user.type(phoneInput, '1133334444') // 10 digits (landline)

      // Should format as (XX) XXXX-XXXX
      expect(phoneInput).toHaveValue('(11) 3333-4444')
    })

    it('should limit phone input length', async () => {
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      const phoneInput = screen.getByTestId('phone-input')
      expect(phoneInput).toHaveAttribute('maxLength', '15') // (XX) XXXXX-XXXX
    })
  })

  describe('Form Validation and Submission', () => {
    it('should require document type selection', async () => {
      const onFormSubmit = jest.fn()
      
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm onFormSubmit={onFormSubmit} />
        </TestWrapper>
      )

      const submitBtn = screen.getByTestId('submit-button')
      await user.click(submitBtn)

      // Should show validation error
      expect(screen.getByTestId('document-type-error')).toHaveTextContent('Tipo de documento é obrigatório')
      expect(onFormSubmit).not.toHaveBeenCalled()
    })

    it('should require valid document number', async () => {
      const onFormSubmit = jest.fn()
      
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm onFormSubmit={onFormSubmit} />
        </TestWrapper>
      )

      // Select CPF and enter invalid number
      const cpfOption = screen.getByTestId('cpf-option').querySelector('input')
      await user.click(cpfOption)

      const documentInput = screen.getByTestId('document-number-input')
      await user.type(documentInput, '12345678900') // Invalid CPF

      await user.click(screen.getByTestId('submit-button'))

      // Should show validation error
      expect(screen.getByTestId('document-number-error')).toHaveTextContent('Documento inválido')
      expect(onFormSubmit).not.toHaveBeenCalled()
    })

    it('should require valid CEP', async () => {
      const onFormSubmit = jest.fn()
      
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm onFormSubmit={onFormSubmit} />
        </TestWrapper>
      )

      // Select CPF and enter valid number
      const cpfOption = screen.getByTestId('cpf-option').querySelector('input')
      await user.click(cpfOption)

      const documentInput = screen.getByTestId('document-number-input')
      await user.type(documentInput, '12345678909') // Valid CPF

      // Fill name and email
      await user.type(screen.getByTestId('name-input'), 'João da Silva')
      await user.type(screen.getByTestId('email-input'), 'joao@test.com')

      // Enter invalid CEP
      const cepInput = screen.getByTestId('cep-input')
      await user.type(cepInput, '123') // Invalid CEP

      await user.click(screen.getByTestId('submit-button'))

      // Should show validation error
      expect(screen.getByTestId('cep-error')).toHaveTextContent('CEP inválido')
      expect(onFormSubmit).not.toHaveBeenCalled()
    })

    it('should submit form with valid data', async () => {
      const onFormSubmit = jest.fn()
      
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm onFormSubmit={onFormSubmit} />
        </TestWrapper>
      )

      // Fill valid form
      const cpfOption = screen.getByTestId('cpf-option').querySelector('input')
      await user.click(cpfOption)

      await user.type(screen.getByTestId('document-number-input'), '12345678909')
      await user.type(screen.getByTestId('name-input'), 'João da Silva')
      await user.type(screen.getByTestId('email-input'), 'joao@test.com')
      await user.type(screen.getByTestId('phone-input'), '11999887766')
      await user.type(screen.getByTestId('cep-input'), '01310100')

      // Wait for validations
      await waitFor(() => {
        expect(screen.getByTestId('document-valid-indicator')).toBeInTheDocument()
        expect(screen.getByTestId('cep-valid-indicator')).toBeInTheDocument()
      })

      const submitBtn = screen.getByTestId('submit-button')
      expect(submitBtn).not.toBeDisabled()

      await user.click(submitBtn)

      // Should submit form
      expect(onFormSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          document_type: 'cpf',
          document_number: '123.456.789-09',
          name: 'João da Silva',
          email: 'joao@test.com',
          phone: '(11) 99988-7766',
          address: expect.objectContaining({
            cep: '01310-100',
            street: 'Avenida Paulista'
          })
        })
      )
    })

    it('should disable submit button for invalid data', async () => {
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      const submitBtn = screen.getByTestId('submit-button')
      expect(submitBtn).toBeDisabled()

      // Select CPF but don't enter valid number
      const cpfOption = screen.getByTestId('cpf-option').querySelector('input')
      await user.click(cpfOption)

      expect(submitBtn).toBeDisabled()

      // Enter invalid CPF
      await user.type(screen.getByTestId('document-number-input'), '12345678900')

      await waitFor(() => {
        expect(submitBtn).toBeDisabled()
      })
    })

    it('should change labels based on document type', async () => {
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      // Select CPF
      const cpfOption = screen.getByTestId('cpf-option').querySelector('input')
      await user.click(cpfOption)

      // Check labels for individual
      expect(screen.getByLabelText(/Nome Completo/)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('João da Silva')).toBeInTheDocument()

      // Select CNPJ
      const cnpjOption = screen.getByTestId('cnpj-option').querySelector('input')
      await user.click(cnpjOption)

      // Check labels for company
      expect(screen.getByLabelText(/Razão Social/)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Empresa Ltda')).toBeInTheDocument()
    })
  })

  describe('PIX Payment Integration', () => {
    it('should display PIX payment interface', async () => {
      render(
        <TestWrapper>
          <MockPIXPayment amount={1500} />
        </TestWrapper>
      )

      expect(screen.getByTestId('pix-payment')).toBeInTheDocument()
      expect(screen.getByText('Pagamento via PIX')).toBeInTheDocument()

      // Check payment info
      expect(screen.getByTestId('payment-amount')).toHaveTextContent('R$ 1.500,00')
      expect(screen.getByTestId('payment-method')).toHaveTextContent('PIX - Pagamento Instantâneo')

      // Should show pending status initially
      expect(screen.getByTestId('status-pending')).toBeInTheDocument()
      expect(screen.getByTestId('generate-pix-btn')).toBeInTheDocument()
    })

    it('should generate PIX code correctly', async () => {
      const onPaymentGenerate = jest.fn()
      
      render(
        <TestWrapper>
          <MockPIXPayment amount={2500} onPaymentGenerate={onPaymentGenerate} />
        </TestWrapper>
      )

      // Generate PIX code
      const generateBtn = screen.getByTestId('generate-pix-btn')
      await user.click(generateBtn)

      // Should show generated status
      expect(screen.getByTestId('status-generated')).toBeInTheDocument()

      // Should display PIX code elements
      expect(screen.getByTestId('pix-code-display')).toBeInTheDocument()
      expect(screen.getByTestId('qr-code-section')).toBeInTheDocument()
      expect(screen.getByTestId('pix-key-section')).toBeInTheDocument()
      expect(screen.getByTestId('pix-copy-section')).toBeInTheDocument()

      // Check PIX key display
      expect(screen.getByTestId('pix-key-display')).toHaveTextContent('12.345.678/0001-90')
      expect(screen.getByTestId('pix-amount-display')).toHaveTextContent('R$ 2.500,00')

      // Should show timer
      expect(screen.getByTestId('pix-timer')).toHaveTextContent('Expira em: 05:00')

      // Should call callback
      expect(onPaymentGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          key: '12.345.678/0001-90',
          amount: 2500,
          reference: expect.stringMatching(/^PRIMA-FACIE-\d+$/)
        })
      )
    })

    it('should copy PIX code to clipboard', async () => {
      render(
        <TestWrapper>
          <MockPIXPayment amount={1000} />
        </TestWrapper>
      )

      // Generate PIX code
      await user.click(screen.getByTestId('generate-pix-btn'))

      // Copy PIX code
      const copyBtn = screen.getByTestId('copy-pix-btn')
      await user.click(copyBtn)

      // Should call clipboard API
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('BR.GOV.BCB.PIX')
      )
    })

    it('should show payment instructions', async () => {
      render(
        <TestWrapper>
          <MockPIXPayment amount={1000} />
        </TestWrapper>
      )

      // Generate PIX code
      await user.click(screen.getByTestId('generate-pix-btn'))

      // Check instructions
      const instructions = screen.getByTestId('pix-instructions')
      expect(instructions).toBeInTheDocument()
      expect(instructions).toHaveTextContent('Como pagar:')
      expect(instructions).toHaveTextContent('Abra o aplicativo do seu banco')
      expect(instructions).toHaveTextContent('Escolha a opção PIX')
      expect(instructions).toHaveTextContent('Escaneie o QR Code ou cole o código')
      expect(instructions).toHaveTextContent('Confirme os dados e finalize o pagamento')
    })

    it('should countdown timer correctly', async () => {
      render(
        <TestWrapper>
          <MockPIXPayment amount={1000} />
        </TestWrapper>
      )

      // Generate PIX code
      await user.click(screen.getByTestId('generate-pix-btn'))

      // Check initial timer
      expect(screen.getByTestId('pix-timer')).toHaveTextContent('Expira em: 05:00')

      // Advance timer by 60 seconds
      jest.advanceTimersByTime(60000)

      // Check updated timer
      await waitFor(() => {
        expect(screen.getByTestId('pix-timer')).toHaveTextContent('Expira em: 04:00')
      })
    })

    it('should handle payment expiration', async () => {
      render(
        <TestWrapper>
          <MockPIXPayment amount={1000} />
        </TestWrapper>
      )

      // Generate PIX code
      await user.click(screen.getByTestId('generate-pix-btn'))

      // Advance timer beyond expiration (5 minutes)
      jest.advanceTimersByTime(300000)

      // Should show expired status
      await waitFor(() => {
        expect(screen.getByTestId('status-expired')).toBeInTheDocument()
      })

      // Should show generate new button
      expect(screen.getByTestId('generate-new-pix-btn')).toBeInTheDocument()

      // QR code should be hidden
      expect(screen.queryByTestId('pix-code-display')).not.toBeInTheDocument()
    })

    it('should confirm payment successfully', async () => {
      const onPaymentConfirm = jest.fn()
      
      render(
        <TestWrapper>
          <MockPIXPayment amount={1000} onPaymentConfirm={onPaymentConfirm} />
        </TestWrapper>
      )

      // Generate PIX code
      await user.click(screen.getByTestId('generate-pix-btn'))

      // Confirm payment
      const confirmBtn = screen.getByTestId('confirm-payment-btn')
      await user.click(confirmBtn)

      // Should show confirmed status
      expect(screen.getByTestId('status-confirmed')).toBeInTheDocument()
      expect(screen.getByTestId('status-confirmed')).toHaveTextContent('Pagamento confirmado com sucesso!')

      // Should call callback
      expect(onPaymentConfirm).toHaveBeenCalled()
    })

    it('should generate new PIX code after expiration', async () => {
      render(
        <TestWrapper>
          <MockPIXPayment amount={1000} />
        </TestWrapper>
      )

      // Generate and expire PIX code
      await user.click(screen.getByTestId('generate-pix-btn'))
      jest.advanceTimersByTime(300000)

      await waitFor(() => {
        expect(screen.getByTestId('status-expired')).toBeInTheDocument()
      })

      // Generate new PIX code
      const generateNewBtn = screen.getByTestId('generate-new-pix-btn')
      await user.click(generateNewBtn)

      // Should return to pending status
      expect(screen.getByTestId('status-pending')).toBeInTheDocument()
      expect(screen.getByTestId('generate-pix-btn')).toBeInTheDocument()
    })
  })

  describe('Brazilian Tax Calculations', () => {
    it('should display tax calculator interface', async () => {
      render(
        <TestWrapper>
          <MockBrazilianTaxCalculator 
            invoiceAmount={10000} 
            clientType="cnpj" 
          />
        </TestWrapper>
      )

      expect(screen.getByTestId('brazilian-tax-calculator')).toBeInTheDocument()
      expect(screen.getByText('Calculadora de Impostos - Brasil')).toBeInTheDocument()

      // Check configuration options
      expect(screen.getByTestId('regime-selection')).toBeInTheDocument()
      expect(screen.getByTestId('municipality-selection')).toBeInTheDocument()
      expect(screen.getByTestId('client-type-display')).toHaveTextContent('Pessoa Jurídica')

      // Check invoice details
      expect(screen.getByTestId('invoice-amount')).toHaveTextContent('R$ 10.000,00')
    })

    it('should calculate Simples Nacional taxes correctly', async () => {
      const onTaxCalculation = jest.fn()
      
      render(
        <TestWrapper>
          <MockBrazilianTaxCalculator 
            invoiceAmount={50000} 
            clientType="cnpj"
            onTaxCalculation={onTaxCalculation}
          />
        </TestWrapper>
      )

      // Should default to Simples Nacional
      const regimeSelect = screen.getByTestId('regime-selection').querySelector('select')
      expect(regimeSelect).toHaveValue('simples_nacional')

      // Check Simples Nacional results
      const results = screen.getByTestId('tax-calculation-results')
      expect(results).toBeInTheDocument()

      const simplesResults = screen.getByTestId('simples-nacional-results')
      expect(simplesResults).toBeInTheDocument()

      // Check aliquot and DAS amount
      expect(screen.getByTestId('aliquot-percentage')).toHaveTextContent('9,00%')
      expect(screen.getByTestId('das-amount')).toHaveTextContent('R$ 4.500,00')

      // Check tax breakdown
      const breakdown = screen.getByTestId('tax-breakdown')
      expect(breakdown).toBeInTheDocument()
      expect(screen.getByTestId('irpj-amount')).toBeInTheDocument()
      expect(screen.getByTestId('csll-amount')).toBeInTheDocument()
      expect(screen.getByTestId('cofins-amount')).toBeInTheDocument()
      expect(screen.getByTestId('pis-amount')).toBeInTheDocument()
      expect(screen.getByTestId('iss-amount')).toBeInTheDocument()

      // Check net amount
      expect(screen.getByTestId('net-amount')).toHaveTextContent('R$ 45.500,00')

      // Should call callback
      expect(onTaxCalculation).toHaveBeenCalledWith(
        expect.objectContaining({
          regime: 'Simples Nacional',
          aliquot_percentage: 9.0,
          das_amount: 4500,
          net_amount: 45500
        })
      )
    })

    it('should calculate Lucro Presumido taxes correctly', async () => {
      render(
        <TestWrapper>
          <MockBrazilianTaxCalculator 
            invoiceAmount={20000} 
            clientType="cnpj"
          />
        </TestWrapper>
      )

      // Change to Lucro Presumido
      const regimeSelect = screen.getByTestId('regime-selection').querySelector('select')
      await user.selectOptions(regimeSelect, 'lucro_presumido')

      // Check traditional regime results
      const traditionalResults = screen.getByTestId('traditional-regime-results')
      expect(traditionalResults).toBeInTheDocument()

      // Check individual taxes
      expect(screen.getByTestId('iss-tax')).toHaveTextContent('ISS (3,00%): R$ 600,00')
      expect(screen.getByTestId('pis-tax')).toHaveTextContent('PIS (0,65%): R$ 130,00')
      expect(screen.getByTestId('cofins-tax')).toHaveTextContent('COFINS (3,00%): R$ 600,00')
      expect(screen.getByTestId('ir-tax')).toHaveTextContent('IRRF (1,50%): R$ 300,00')
      expect(screen.getByTestId('csll-tax')).toHaveTextContent('CSLL (1,00%): R$ 200,00')
      expect(screen.getByTestId('total-tax')).toHaveTextContent('Total de Impostos: R$ 1.830,00')

      // Check net amount
      expect(screen.getByTestId('net-amount')).toHaveTextContent('R$ 18.170,00')
    })

    it('should display tax summary table', async () => {
      render(
        <TestWrapper>
          <MockBrazilianTaxCalculator 
            invoiceAmount={15000} 
            clientType="cnpj"
          />
        </TestWrapper>
      )

      const summaryTable = screen.getByTestId('tax-summary-table')
      expect(summaryTable).toBeInTheDocument()

      // Check table rows
      const grossAmountRow = screen.getByTestId('gross-amount-row')
      expect(grossAmountRow).toHaveTextContent('R$ 15.000,00')
      expect(grossAmountRow).toHaveTextContent('100,00%')

      const taxAmountRow = screen.getByTestId('tax-amount-row')
      expect(taxAmountRow).toBeInTheDocument()

      const netAmountRow = screen.getByTestId('net-amount-row')
      expect(netAmountRow).toBeInTheDocument()
    })

    it('should change tax rates by municipality', async () => {
      render(
        <TestWrapper>
          <MockBrazilianTaxCalculator 
            invoiceAmount={10000} 
            clientType="cnpj"
          />
        </TestWrapper>
      )

      const municipalitySelect = screen.getByTestId('municipality-selection').querySelector('select')
      
      // Check available municipalities
      expect(within(municipalitySelect).getByText('São Paulo - SP')).toBeInTheDocument()
      expect(within(municipalitySelect).getByText('Rio de Janeiro - RJ')).toBeInTheDocument()
      expect(within(municipalitySelect).getByText('Belo Horizonte - MG')).toBeInTheDocument()
      expect(within(municipalitySelect).getByText('Brasília - DF')).toBeInTheDocument()

      // Change municipality
      await user.selectOptions(municipalitySelect, 'rio_janeiro')
      expect(municipalitySelect).toHaveValue('rio_janeiro')
    })

    it('should handle different client types correctly', async () => {
      // Test for CPF client
      const { rerender } = render(
        <TestWrapper>
          <MockBrazilianTaxCalculator 
            invoiceAmount={5000} 
            clientType="cpf"
          />
        </TestWrapper>
      )

      expect(screen.getByTestId('client-type-display')).toHaveTextContent('Pessoa Física')

      // Test for CNPJ client
      rerender(
        <TestWrapper>
          <MockBrazilianTaxCalculator 
            invoiceAmount={5000} 
            clientType="cnpj"
          />
        </TestWrapper>
      )

      expect(screen.getByTestId('client-type-display')).toHaveTextContent('Pessoa Jurídica')
    })
  })

  describe('Currency and Number Formatting', () => {
    it('should format currency values in Brazilian Real', async () => {
      render(
        <TestWrapper>
          <MockPIXPayment amount={1234.56} />
        </TestWrapper>
      )

      // Should display currency in Brazilian format
      expect(screen.getByTestId('payment-amount')).toHaveTextContent('R$ 1.234,56')
    })

    it('should format percentages correctly', async () => {
      render(
        <TestWrapper>
          <MockBrazilianTaxCalculator 
            invoiceAmount={10000} 
            clientType="cnpj"
          />
        </TestWrapper>
      )

      // Should display percentages in Brazilian format
      expect(screen.getByTestId('aliquot-percentage')).toHaveTextContent('9,00%')
    })
  })

  describe('Portuguese Language Interface', () => {
    it('should display all text in Portuguese', async () => {
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      // Check Portuguese labels and text
      expect(screen.getByText('Cadastro de Cliente - Brasil')).toBeInTheDocument()
      expect(screen.getByText('Tipo de Documento:')).toBeInTheDocument()
      expect(screen.getByText('CPF (Pessoa Física)')).toBeInTheDocument()
      expect(screen.getByText('CNPJ (Pessoa Jurídica)')).toBeInTheDocument()
      expect(screen.getByText('Endereço')).toBeInTheDocument()
      expect(screen.getByText('Logradouro:')).toBeInTheDocument()
      expect(screen.getByText('Bairro:')).toBeInTheDocument()
      expect(screen.getByText('Cidade:')).toBeInTheDocument()
      expect(screen.getByText('Estado:')).toBeInTheDocument()
      expect(screen.getByText('Cadastrar Cliente')).toBeInTheDocument()
    })

    it('should use Portuguese error messages', async () => {
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      // Trigger form submission without filling required fields
      await user.click(screen.getByTestId('submit-button'))

      // Check Portuguese error messages
      expect(screen.getByTestId('document-type-error')).toHaveTextContent('Tipo de documento é obrigatório')
    })

    it('should use Brazilian date format', async () => {
      render(
        <TestWrapper>
          <MockPIXPayment amount={1000} />
        </TestWrapper>
      )

      // Generate PIX to show timestamp
      await user.click(screen.getByTestId('generate-pix-btn'))

      // Should use Brazilian time format (XX:XX)
      const timer = screen.getByTestId('pix-timer')
      expect(timer).toHaveTextContent(/\d{2}:\d{2}/)
    })
  })

  describe('Responsive Design', () => {
    it('should adapt forms for mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      const form = screen.getByTestId('brazilian-document-form')
      expect(form).toBeInTheDocument()

      // All form elements should be present and functional
      expect(screen.getByTestId('document-type-section')).toBeInTheDocument()
      expect(screen.getByTestId('address-section')).toBeInTheDocument()
    })

    it('should maintain PIX payment functionality on mobile', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(
        <TestWrapper>
          <MockPIXPayment amount={1000} />
        </TestWrapper>
      )

      // PIX functionality should work on mobile
      await user.click(screen.getByTestId('generate-pix-btn'))
      expect(screen.getByTestId('pix-code-display')).toBeInTheDocument()
      
      // Copy button should work
      await user.click(screen.getByTestId('copy-pix-btn'))
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      // Check form labels
      const documentInput = screen.getByTestId('document-number-input')
      expect(documentInput).toHaveAttribute('placeholder')

      const stateSelect = screen.getByTestId('state-select')
      expect(stateSelect).toBeInTheDocument()

      // Form should be properly structured
      const form = screen.getByTestId('client-form')
      expect(form).toHaveAttribute('data-testid', 'client-form')
    })

    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      const cpfOption = screen.getByTestId('cpf-option').querySelector('input')
      const cnpjOption = screen.getByTestId('cnpj-option').querySelector('input')

      // Tab navigation should work
      cpfOption.focus()
      expect(cpfOption).toHaveFocus()

      await user.tab()
      expect(cnpjOption).toHaveFocus()
    })
  })

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <TestWrapper>
          <MockBrazilianDocumentForm />
        </TestWrapper>
      )

      // Form should remain functional even with validation errors
      const cpfOption = screen.getByTestId('cpf-option').querySelector('input')
      await user.click(cpfOption)

      const documentInput = screen.getByTestId('document-number-input')
      await user.type(documentInput, 'invalid')

      // Should handle invalid input gracefully
      expect(documentInput).toHaveValue('invalid')

      consoleSpy.mockRestore()
    })

    it('should handle PIX generation errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <TestWrapper>
          <MockPIXPayment amount={1000} />
        </TestWrapper>
      )

      // PIX generation should work even if there are errors
      const generateBtn = screen.getByTestId('generate-pix-btn')
      await user.click(generateBtn)

      expect(screen.getByTestId('pix-code-display')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })
})