import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const TOKEN_KEY = "kalakriti_admin_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const t = tokenStore.get();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && !window.location.pathname.endsWith("/login")) {
      tokenStore.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ----- Auth -----
export const adminApi = {
  login: (email, password) => api.post("/admin/auth/login", { email, password }).then((r) => r.data),
  me: () => api.get("/admin/auth/me").then((r) => r.data),

  // dashboard
  dashboardStats: () => api.get("/admin/dashboard/stats").then((r) => r.data),
  revenueTimeseries: (days = 30) => api.get(`/admin/analytics/revenue-timeseries?days=${days}`).then((r) => r.data),
  ordersByStatus: () => api.get("/admin/analytics/orders-by-status").then((r) => r.data),
  ordersByMedium: () => api.get("/admin/analytics/orders-by-medium").then((r) => r.data),

  // orders
  listOrders: (params = {}) => api.get("/admin/orders", { params }).then((r) => r.data),
  getOrder: (id) => api.get(`/admin/orders/${id}`).then((r) => r.data),
  updateOrderStatus: (id, status, note) =>
    api.put(`/admin/orders/${id}/status`, { status, note }).then((r) => r.data),
  updateOrderNotes: (id, notes) => api.put(`/admin/orders/${id}/notes`, { notes }).then((r) => r.data),
  checkServiceability: (id) => api.post(`/admin/orders/${id}/check-serviceability`).then((r) => r.data),
  shipOrder: (id, body) => api.post(`/admin/orders/${id}/ship`, body).then((r) => r.data),
  trackOrder: (id) => api.get(`/admin/orders/${id}/track`).then((r) => r.data),

  // mediums
  listMediums: () => api.get("/admin/mediums").then((r) => r.data),
  getMedium: (id) => api.get(`/admin/mediums/${id}`).then((r) => r.data),
  createMedium: (body) => api.post("/admin/mediums", body).then((r) => r.data),
  updateMedium: (id, body) => api.put(`/admin/mediums/${id}`, body).then((r) => r.data),
  deleteMedium: (id) => api.delete(`/admin/mediums/${id}`).then((r) => r.data),

  // gallery
  listGallery: () => api.get("/admin/gallery").then((r) => r.data),
  createGallery: (body) => api.post("/admin/gallery", body).then((r) => r.data),
  updateGallery: (id, body) => api.put(`/admin/gallery/${id}`, body).then((r) => r.data),
  deleteGallery: (id) => api.delete(`/admin/gallery/${id}`).then((r) => r.data),

  // testimonials
  listTestimonials: () => api.get("/admin/testimonials").then((r) => r.data),
  createTestimonial: (body) => api.post("/admin/testimonials", body).then((r) => r.data),
  updateTestimonial: (id, body) => api.put(`/admin/testimonials/${id}`, body).then((r) => r.data),
  deleteTestimonial: (id) => api.delete(`/admin/testimonials/${id}`).then((r) => r.data),

  // content
  getHomepage: () => api.get("/admin/content/homepage").then((r) => r.data),
  updateHomepage: (body) => api.put("/admin/content/homepage", body).then((r) => r.data),

  // coupons
  listCoupons: () => api.get("/admin/coupons").then((r) => r.data),
  createCoupon: (body) => api.post("/admin/coupons", body).then((r) => r.data),
  updateCoupon: (id, body) => api.put(`/admin/coupons/${id}`, body).then((r) => r.data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`).then((r) => r.data),

  // settings
  getSettings: () => api.get("/admin/settings").then((r) => r.data),
  updateSettings: (body) => api.put("/admin/settings", body).then((r) => r.data),
};

export const publicApi = {
  mediums: () => api.get("/public/mediums").then((r) => r.data),
  gallery: () => api.get("/public/gallery").then((r) => r.data),
  testimonials: () => api.get("/public/testimonials").then((r) => r.data),
  homepage: () => api.get("/public/homepage").then((r) => r.data),
  settings: () => api.get("/public/site-settings").then((r) => r.data),
  calculatePricing: (body) => api.post("/public/pricing/calculate", body).then((r) => r.data),
  createOrder: (body) => api.post("/public/orders", body).then((r) => r.data),
  trackOrder: (body) => api.post("/public/orders/track", body).then((r) => r.data),
  createPayment: (body) => api.post("/public/payment/create-session", body).then((r) => r.data),
  validateCoupon: (body) => api.post("/public/coupons/validate", body).then((r) => r.data),
};
