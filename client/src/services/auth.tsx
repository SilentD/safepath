import { api } from '@/lib/api-client';

export interface LoginCredentials {
  email: string;
  password: string;
}


export interface Verify2FAPayload {
  challengeId: string;
  code: string;
  trustedDevice?: boolean;
}

export interface AuthSessionResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
  sessionUser: {
    id: string;
    email: string;
    name?: string;
    [key: string]: any;
  };
}

export const authAPI = {
  login: (credentials: LoginCredentials) => {
    return api.post('/auth/login', credentials);
  },
  register: (credentials: {fullName:"",email:"",phoneNumber:"",password:""}) => {
    return api.post('/auth/signup', credentials);
  },
  verifyEmail: (challengeId: string, code: string) => {
    return api.post('/auth/verify-email', { challengeId, code });
  },

  verify2FA: (payload: Verify2FAPayload) => {
    return api.post<AuthSessionResponse>("/auth/verify-2fa", payload);
  },
  forgotPassword: (email:string) => {
    return api.post<AuthSessionResponse>("/auth/forgot-password", {email});
  },
  resendVerification: (email: string) => {
    return api.post('/auth/resend-verification', { email });
  },

  resend2FA: () => {
    return api.post('/auth/resend-2fa');
  },
  logout: () => {
    localStorage.removeItem('safepath-token')
    return api.post('/auth/logout');
  },  
  me: () => {
    return api.get('/auth/me');
  },
};