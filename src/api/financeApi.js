import axios from 'axios';

const authTokenKey = 'finanzas_auth_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const unwrap = (request) => request.then((response) => response.data);

export function getStoredAuthToken() {
  return window.localStorage.getItem(authTokenKey);
}

export function setStoredAuthToken(token) {
  if (token) {
    window.localStorage.setItem(authTokenKey, token);
  } else {
    window.localStorage.removeItem(authTokenKey);
  }
}

export const authApi = {
  login: (credentials) => unwrap(api.post('/auth/login', credentials)),
  register: (account) => unwrap(api.post('/auth/register', account)),
  me: () => unwrap(api.get('/auth/me')),
  updateProfile: (profile) => unwrap(api.patch('/auth/profile', profile)),
  changePassword: (passwords) => unwrap(api.patch('/auth/password', passwords)),
  requestPasswordReset: (request) => unwrap(api.post('/auth/forgot-password', request)),
};

export const financeApi = {
  health: () => unwrap(api.get('/health')),

  getAccounts: () => unwrap(api.get('/accounts')),
  createAccount: (account) => unwrap(api.post('/accounts', account)),
  updateAccount: (id, account) => unwrap(api.patch(`/accounts/${id}`, account)),
  deleteAccount: (id) => api.delete(`/accounts/${id}`),
  addAccountMember: (id, member) => unwrap(api.post(`/accounts/${id}/members`, member)),
  updateAccountMember: (id, userId, member) => unwrap(api.patch(`/accounts/${id}/members/${userId}`, member)),
  removeAccountMember: (id, userId) => api.delete(`/accounts/${id}/members/${userId}`),

  getCategories: () => unwrap(api.get('/categories')),
  createCategory: (category) => unwrap(api.post('/categories', category)),
  updateCategory: (id, category) => unwrap(api.patch(`/categories/${id}`, category)),
  deleteCategory: (id) => api.delete(`/categories/${id}`),

  getDashboard: (month) => unwrap(api.get('/dashboard', { params: { month } })),
  getBudgets: (month) => unwrap(api.get('/budgets', { params: { month } })),
  createBudget: (budget) => unwrap(api.post('/budgets', budget)),
  updateBudget: (id, budget) => unwrap(api.patch(`/budgets/${id}`, budget)),
  deleteBudget: (id) => api.delete(`/budgets/${id}`),

  getTransactions: (params) => unwrap(api.get('/transactions', { params })),
  createTransaction: (transaction) => unwrap(api.post('/transactions', transaction)),
  updateTransaction: (id, transaction) => unwrap(api.patch(`/transactions/${id}`, transaction)),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),

  getAlerts: (params) => unwrap(api.get('/alerts', { params })),
  createAlert: (alert) => unwrap(api.post('/alerts', alert)),
  updateAlert: (id, alert) => unwrap(api.patch(`/alerts/${id}`, alert)),
  deleteAlert: (id) => api.delete(`/alerts/${id}`),
};

export function getApiErrorMessage(error) {
  return error?.response?.data?.error?.message || error?.message || 'Unexpected API error';
}
