// API service for connecting frontend to backend
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post("/auth/login", credentials),
  register: (userData: any) => api.post("/auth/register", userData),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data: any) => api.put("/auth/profile", data),
};

// Invoice API
export const invoiceAPI = {
  upload: (formData: FormData) =>
    api.post("/invoices/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getMyInvoices: (params?: any) => api.get("/invoices/my-invoices", { params }),
  getInvoice: (id: string) => api.get(`/invoices/${id}`),
  updateStatus: (id: string, data: any) =>
    api.patch(`/invoices/${id}/status`, data),
  getAnalytics: () => api.get("/invoices/analytics/overview"),
};

// Marketplace API
export const marketplaceAPI = {
  getListings: (params?: any) => api.get("/marketplace/listings", { params }),
  getListing: (id: string) => api.get(`/marketplace/listings/${id}`),
  placeBid: (listingId: string, data: any) =>
    api.post(`/marketplace/listings/${listingId}/bid`, data),
  acceptBid: (listingId: string, bidId: string) =>
    api.post(`/marketplace/listings/${listingId}/accept-bid/${bidId}`),
  buyListing: (listingId: string, data: any) =>
    api.post(`/marketplace/listings/${listingId}/buy`, data),
  getMyBids: (params?: any) => api.get("/marketplace/my-bids", { params }),
  getAnalytics: (params?: any) => api.get("/marketplace/analytics", { params }),
  cancelListing: (listingId: string) =>
    api.delete(`/marketplace/listings/${listingId}`),
};

// Trading API
export const tradingAPI = {
  getOrderBook: (pair: string, depth?: number) =>
    api.get(`/trading/orderbook/${pair}`, { params: { depth } }),
  placeOrder: (orderData: any) => api.post("/trading/orders", orderData),
  cancelOrder: (orderId: string) => api.delete(`/trading/orders/${orderId}`),
  getMyOrders: () => api.get("/trading/orders"),
  getTrades: (pair: string, limit?: number) =>
    api.get(`/trading/trades/${pair}`, { params: { limit } }),
  getMarketStats: () => api.get("/trading/markets/stats"),
  getTradingPairs: () => api.get("/trading/pairs"),
};

// Credit Scoring API
export const creditAPI = {
  getScore: () => api.get("/credit-scoring/score"),
  updateData: (data: any) => api.post("/credit-scoring/update", data),
  getRecommendations: () => api.get("/credit-scoring/recommendations"),
};

// KYC API
export const kycAPI = {
  submit: (data: any) => api.post("/kyc/submit", data),
  getStatus: () => api.get("/kyc/status"),
  getDocuments: () => api.get("/kyc/documents"),
  uploadDocument: (formData: FormData) =>
    api.post("/kyc/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// Documents API
export const documentsAPI = {
  upload: (formData: FormData) =>
    api.post("/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getDocument: (id: string) => api.get(`/documents/${id}`),
  shareDocument: (id: string, data: any) =>
    api.post(`/documents/${id}/share`, data),
};

// Finternet Integration APIs
export const finternetAPI = {
  // SSO
  createIdentity: (data: any) => api.post("/finternet-sso/identity", data),
  authenticate: (data: any) => api.post("/finternet-sso/authenticate", data),
  createChallenge: (data: any) => api.post("/finternet-sso/challenge", data),
  verifyChallenge: (data: any) =>
    api.post("/finternet-sso/verify-challenge", data),

  // Compliance
  checkCompliance: (data: any) => api.post("/compliance/check", data),
  getJurisdictions: () => api.get("/compliance/jurisdictions"),
  getDashboard: () => api.get("/compliance/dashboard"),

  // Cross-Border
  createSettlement: (data: any) => api.post("/cross-border/settlement", data),
  getSettlement: (id: string) => api.get(`/cross-border/settlement/${id}`),
  convertCurrency: (data: any) => api.post("/cross-border/convert", data),
  getCurrencies: () => api.get("/cross-border/currencies"),

  // Bridge
  createPaymentIntent: (data: any) =>
    api.post("/finternet-bridge/payment-intent", data),
  executeTransfer: (data: any) =>
    api.post("/finternet-bridge/cross-chain-transfer", data),
  getCreditScore: (data: any) =>
    api.post("/finternet-bridge/credit-score", data),

  // Universal Assets
  createAsset: (data: any) => api.post("/universal-assets/create", data),
  getAsset: (id: string) => api.get(`/universal-assets/${id}`),
  transferAsset: (id: string, data: any) =>
    api.post(`/universal-assets/${id}/transfer`, data),
};

// Analytics API
export const analyticsAPI = {
  getOverview: () => api.get("/analytics/overview"),
  getPerformance: (params?: any) =>
    api.get("/analytics/performance", { params }),
  getMarketData: (params?: any) =>
    api.get("/analytics/market-data", { params }),
};

export default api;
