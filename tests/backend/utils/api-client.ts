/**
 * API Test Client
 * Provides a unified interface for testing API endpoints with proper authentication
 */

import request from 'supertest'
import { createServer } from 'http'
import { NextApiHandler } from 'next'

export class APITestClient {
  private baseURL: string
  private authToken?: string
  private headers: Record<string, string> = {}

  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }

  setAuthToken(token: string) {
    this.authToken = token
    this.headers['Authorization'] = `Bearer ${token}`
    return this
  }

  setHeader(key: string, value: string) {
    this.headers[key] = value
    return this
  }

  // Invoice API methods
  async createInvoice(data: any) {
    return request(this.baseURL)
      .post('/api/invoices')
      .set(this.headers)
      .send(data)
  }

  async getInvoices(params?: Record<string, any>) {
    let req = request(this.baseURL)
      .get('/api/invoices')
      .set(this.headers)

    if (params) {
      req = req.query(params)
    }

    return req
  }

  async getInvoice(id: string) {
    return request(this.baseURL)
      .get(`/api/invoices/${id}`)
      .set(this.headers)
  }

  async updateInvoice(id: string, data: any) {
    return request(this.baseURL)
      .put(`/api/invoices/${id}`)
      .set(this.headers)
      .send(data)
  }

  async deleteInvoice(id: string) {
    return request(this.baseURL)
      .delete(`/api/invoices/${id}`)
      .set(this.headers)
  }

  async sendInvoice(id: string) {
    return request(this.baseURL)
      .post(`/api/invoices/${id}/send`)
      .set(this.headers)
  }

  async payInvoice(id: string, paymentData: any) {
    return request(this.baseURL)
      .post(`/api/invoices/${id}/payments`)
      .set(this.headers)
      .send(paymentData)
  }

  async generateInvoice(data: any) {
    return request(this.baseURL)
      .post('/api/invoices/generate')
      .set(this.headers)
      .send(data)
  }

  // Time Tracking API methods
  async createTimeEntry(data: any) {
    return request(this.baseURL)
      .post('/api/time-tracking/entries')
      .set(this.headers)
      .send(data)
  }

  async getTimeEntries(params?: Record<string, any>) {
    let req = request(this.baseURL)
      .get('/api/time-tracking/entries')
      .set(this.headers)

    if (params) {
      req = req.query(params)
    }

    return req
  }

  async getTimeEntry(id: string) {
    return request(this.baseURL)
      .get(`/api/time-tracking/entries/${id}`)
      .set(this.headers)
  }

  async updateTimeEntry(id: string, data: any) {
    return request(this.baseURL)
      .put(`/api/time-tracking/entries/${id}`)
      .set(this.headers)
      .send(data)
  }

  async deleteTimeEntry(id: string) {
    return request(this.baseURL)
      .delete(`/api/time-tracking/entries/${id}`)
      .set(this.headers)
  }

  async startTimer(data: any) {
    return request(this.baseURL)
      .post('/api/time-tracking/timer/start')
      .set(this.headers)
      .send(data)
  }

  async pauseTimer(sessionId: string) {
    return request(this.baseURL)
      .post(`/api/time-tracking/timer/${sessionId}/pause`)
      .set(this.headers)
  }

  async resumeTimer(sessionId: string) {
    return request(this.baseURL)
      .post(`/api/time-tracking/timer/${sessionId}/resume`)
      .set(this.headers)
  }

  async stopTimer(sessionId: string, saveEntry = true) {
    return request(this.baseURL)
      .post(`/api/time-tracking/timer/${sessionId}/stop`)
      .set(this.headers)
      .send({ saveEntry })
  }

  async getCurrentSession() {
    return request(this.baseURL)
      .get('/api/time-tracking/timer/current')
      .set(this.headers)
  }

  async getTimeTrackingDashboard(params?: Record<string, any>) {
    let req = request(this.baseURL)
      .get('/api/time-tracking/dashboard')
      .set(this.headers)

    if (params) {
      req = req.query(params)
    }

    return req
  }

  // Financial Management API methods
  async createVendor(data: any) {
    return request(this.baseURL)
      .post('/api/financial/vendors')
      .set(this.headers)
      .send(data)
  }

  async getVendors(params?: Record<string, any>) {
    let req = request(this.baseURL)
      .get('/api/financial/vendors')
      .set(this.headers)

    if (params) {
      req = req.query(params)
    }

    return req
  }

  async getVendor(id: string) {
    return request(this.baseURL)
      .get(`/api/financial/vendors/${id}`)
      .set(this.headers)
  }

  async updateVendor(id: string, data: any) {
    return request(this.baseURL)
      .put(`/api/financial/vendors/${id}`)
      .set(this.headers)
      .send(data)
  }

  async deleteVendor(id: string) {
    return request(this.baseURL)
      .delete(`/api/financial/vendors/${id}`)
      .set(this.headers)
  }

  async createBill(data: any) {
    return request(this.baseURL)
      .post('/api/financial/bills')
      .set(this.headers)
      .send(data)
  }

  async getBills(params?: Record<string, any>) {
    let req = request(this.baseURL)
      .get('/api/financial/bills')
      .set(this.headers)

    if (params) {
      req = req.query(params)
    }

    return req
  }

  async getBill(id: string) {
    return request(this.baseURL)
      .get(`/api/financial/bills/${id}`)
      .set(this.headers)
  }

  async updateBill(id: string, data: any) {
    return request(this.baseURL)
      .put(`/api/financial/bills/${id}`)
      .set(this.headers)
      .send(data)
  }

  async approveBill(id: string, notes?: string) {
    return request(this.baseURL)
      .post(`/api/financial/bills/${id}/approve`)
      .set(this.headers)
      .send({ notes })
  }

  async rejectBill(id: string, notes: string) {
    return request(this.baseURL)
      .post(`/api/financial/bills/${id}/reject`)
      .set(this.headers)
      .send({ notes })
  }

  async payBill(id: string, paymentData: any) {
    return request(this.baseURL)
      .post(`/api/financial/bills/${id}/payments`)
      .set(this.headers)
      .send(paymentData)
  }

  async getCashFlowSummary(period = 'current_month') {
    return request(this.baseURL)
      .get('/api/financial/cash-flow')
      .set(this.headers)
      .query({ period })
  }

  async getAgingReport() {
    return request(this.baseURL)
      .get('/api/financial/aging-report')
      .set(this.headers)
  }

  // Client Management API methods
  async createClient(data: any) {
    return request(this.baseURL)
      .post('/api/clients')
      .set(this.headers)
      .send(data)
  }

  async getClients(params?: Record<string, any>) {
    let req = request(this.baseURL)
      .get('/api/clients')
      .set(this.headers)

    if (params) {
      req = req.query(params)
    }

    return req
  }

  async getClient(id: string) {
    return request(this.baseURL)
      .get(`/api/clients/${id}`)
      .set(this.headers)
  }

  async updateClient(id: string, data: any) {
    return request(this.baseURL)
      .put(`/api/clients/${id}`)
      .set(this.headers)
      .send(data)
  }

  async deleteClient(id: string) {
    return request(this.baseURL)
      .delete(`/api/clients/${id}`)
      .set(this.headers)
  }

  // Matter Management API methods
  async createMatter(data: any) {
    return request(this.baseURL)
      .post('/api/matters')
      .set(this.headers)
      .send(data)
  }

  async getMatters(params?: Record<string, any>) {
    let req = request(this.baseURL)
      .get('/api/matters')
      .set(this.headers)

    if (params) {
      req = req.query(params)
    }

    return req
  }

  async getMatter(id: string) {
    return request(this.baseURL)
      .get(`/api/matters/${id}`)
      .set(this.headers)
  }

  async updateMatter(id: string, data: any) {
    return request(this.baseURL)
      .put(`/api/matters/${id}`)
      .set(this.headers)
      .send(data)
  }

  async deleteMatter(id: string) {
    return request(this.baseURL)
      .delete(`/api/matters/${id}`)
      .set(this.headers)
  }

  // Subscription Management API methods
  async createSubscription(data: any) {
    return request(this.baseURL)
      .post('/api/subscriptions')
      .set(this.headers)
      .send(data)
  }

  async getSubscriptions(params?: Record<string, any>) {
    let req = request(this.baseURL)
      .get('/api/subscriptions')
      .set(this.headers)

    if (params) {
      req = req.query(params)
    }

    return req
  }

  async getSubscription(id: string) {
    return request(this.baseURL)
      .get(`/api/subscriptions/${id}`)
      .set(this.headers)
  }

  async updateSubscription(id: string, data: any) {
    return request(this.baseURL)
      .put(`/api/subscriptions/${id}`)
      .set(this.headers)
      .send(data)
  }

  async cancelSubscription(id: string, reason?: string) {
    return request(this.baseURL)
      .post(`/api/subscriptions/${id}/cancel`)
      .set(this.headers)
      .send({ reason })
  }

  // Authentication API methods
  async login(email: string, password: string) {
    return request(this.baseURL)
      .post('/api/auth/login')
      .send({ email, password })
  }

  async logout() {
    return request(this.baseURL)
      .post('/api/auth/logout')
      .set(this.headers)
  }

  async refreshToken(refreshToken: string) {
    return request(this.baseURL)
      .post('/api/auth/refresh')
      .send({ refresh_token: refreshToken })
  }

  async getProfile() {
    return request(this.baseURL)
      .get('/api/auth/profile')
      .set(this.headers)
  }

  async updateProfile(data: any) {
    return request(this.baseURL)
      .put('/api/auth/profile')
      .set(this.headers)
      .send(data)
  }

  // File Upload API methods
  async uploadFile(file: Buffer, filename: string, metadata?: any) {
    return request(this.baseURL)
      .post('/api/files/upload')
      .set({
        ...this.headers,
        'Content-Type': 'multipart/form-data'
      })
      .attach('file', file, filename)
      .field('metadata', JSON.stringify(metadata || {}))
  }

  async downloadFile(fileId: string) {
    return request(this.baseURL)
      .get(`/api/files/${fileId}/download`)
      .set(this.headers)
  }

  async deleteFile(fileId: string) {
    return request(this.baseURL)
      .delete(`/api/files/${fileId}`)
      .set(this.headers)
  }

  // Reporting API methods
  async getReports(type: string, params?: Record<string, any>) {
    let req = request(this.baseURL)
      .get(`/api/reports/${type}`)
      .set(this.headers)

    if (params) {
      req = req.query(params)
    }

    return req
  }

  async exportReport(type: string, format: string, params?: Record<string, any>) {
    let req = request(this.baseURL)
      .get(`/api/reports/${type}/export`)
      .set(this.headers)
      .query({ format })

    if (params) {
      req = req.query(params)
    }

    return req
  }

  // Webhook API methods
  async createWebhook(data: any) {
    return request(this.baseURL)
      .post('/api/webhooks')
      .set(this.headers)
      .send(data)
  }

  async getWebhooks() {
    return request(this.baseURL)
      .get('/api/webhooks')
      .set(this.headers)
  }

  async updateWebhook(id: string, data: any) {
    return request(this.baseURL)
      .put(`/api/webhooks/${id}`)
      .set(this.headers)
      .send(data)
  }

  async deleteWebhook(id: string) {
    return request(this.baseURL)
      .delete(`/api/webhooks/${id}`)
      .set(this.headers)
  }

  async testWebhook(id: string) {
    return request(this.baseURL)
      .post(`/api/webhooks/${id}/test`)
      .set(this.headers)
  }

  // Payment Processing API methods
  async processPayment(data: any) {
    return request(this.baseURL)
      .post('/api/payments/process')
      .set(this.headers)
      .send(data)
  }

  async generatePixPayment(data: any) {
    return request(this.baseURL)
      .post('/api/payments/pix/generate')
      .set(this.headers)
      .send(data)
  }

  async processCreditCardPayment(data: any) {
    return request(this.baseURL)
      .post('/api/payments/credit-card')
      .set(this.headers)
      .send(data)
  }

  async processBankTransfer(data: any) {
    return request(this.baseURL)
      .post('/api/payments/bank-transfer')
      .set(this.headers)
      .send(data)
  }

  async getPaymentStatus(paymentId: string) {
    return request(this.baseURL)
      .get(`/api/payments/${paymentId}/status`)
      .set(this.headers)
  }

  // Validation API methods
  async validateCPF(cpf: string) {
    return request(this.baseURL)
      .post('/api/validation/cpf')
      .set(this.headers)
      .send({ cpf })
  }

  async validateCNPJ(cnpj: string) {
    return request(this.baseURL)
      .post('/api/validation/cnpj')
      .set(this.headers)
      .send({ cnpj })
  }

  async calculateTaxes(data: any) {
    return request(this.baseURL)
      .post('/api/validation/calculate-taxes')
      .set(this.headers)
      .send(data)
  }

  // Health check and utility methods
  async healthCheck() {
    return request(this.baseURL)
      .get('/api/health')
  }

  async getApiVersion() {
    return request(this.baseURL)
      .get('/api/version')
  }
}

// Export singleton instance
export const apiClient = new APITestClient()

// Helper function to create authenticated client
export const createAuthenticatedClient = (token: string) => {
  return new APITestClient().setAuthToken(token)
}