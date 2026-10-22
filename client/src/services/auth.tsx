import api  from '../lib/api';

// --- Authentication & Account ---
export const verifyEmail = async (code: string, email: string) => {
  const response = await api.post('/auth/verify-email', { code, email });
  return response.data;
};

export const login = async (credentials: { email: string; password: string }) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const verify2FA = async (code: string) => {
  const response = await api.post('/auth/verify-2fa', { code });
  return response.data;
};

export const resendCode = async (type: 'verification' | '2fa', email?: string) => {
  const endpoint = type === 'verification' ? '/auth/resend-verification' : '/auth/resend-2fa';
  const response = await api.post(endpoint, { email });
  return response.data;
};

export const forgotPassword = async (email: string) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (password: string, token: string) => {
  const response = await api.post('/auth/reset-password', { password, token });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const refreshToken = async () => {
  const response = await api.post('/auth/refresh');
  return response.data;
};


export interface AuthPayload {
  email?: string;
  password?: string;
  name?: string;
  code?: string;
}

export const authAPI = {
  login: (data: AuthPayload) => api.post('/api/auth/login', data),
  register: (data: AuthPayload) => api.post('/api/auth/register', data),
  verifyEmail: (data: AuthPayload) => api.post('/api/auth/verify-email', data),
  verify2FA: (data: AuthPayload) => api.post('/api/auth/verify-2fa', data),
  resendVerification: (data: AuthPayload) => api.post('/api/auth/resend-verification', data),
  resend2FA: (data: AuthPayload) => api.post('/api/auth/resend-2fa', data),
  forgotPassword: (data: AuthPayload) => api.post('/api/auth/forgot-password', data),
  resetPassword: (data: AuthPayload) => api.post('/api/auth/reset-password', data),
  me: () => api.get('/api/auth/me'),
  refresh: () => api.post('/api/auth/refresh'),
};