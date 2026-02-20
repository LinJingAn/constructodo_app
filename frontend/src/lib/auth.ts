import axios, { AxiosInstance } from 'axios';
import { getAPIBaseURL } from './config';

const TOKEN_STORAGE_KEY = 'constructodo_token';
/** SDK (@metagptx/web-sdk) reads from 'token'; keep in sync so entity requests are authorized */
const SDK_TOKEN_KEY = 'token';

export function getStoredToken(): string | null {
  try {
    const sdk = localStorage.getItem(SDK_TOKEN_KEY);
    if (!sdk) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }
    return localStorage.getItem(TOKEN_STORAGE_KEY) || sdk;
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      localStorage.setItem(SDK_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(SDK_TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

class RPApi {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.applyStoredToken();
  }

  private getBaseURL() {
    return getAPIBaseURL();
  }

  private applyStoredToken() {
    const token = getStoredToken();
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  setToken(token: string) {
    setStoredToken(token);
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearToken() {
    setStoredToken(null);
    delete this.client.defaults.headers.common['Authorization'];
  }

  async getCurrentUser() {
    this.applyStoredToken();
    try {
      const response = await this.client.get(
        `${this.getBaseURL()}/api/v1/auth/me`
      );
      return response.data;
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        this.clearToken();
        return null;
      }
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      throw new Error(detail || 'Failed to get user info');
    }
  }

  async login() {
    try {
      const response = await this.client.get(
        `${this.getBaseURL()}/api/v1/auth/login`
      );
      const redirectUrl = (response.data as { redirect_url?: string })?.redirect_url;
      if (redirectUrl) window.location.href = redirectUrl;
      else throw new Error('No redirect URL');
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      throw new Error(detail || 'Failed to initiate login');
    }
  }

  async emailLogin(email: string, password: string) {
    try {
      const response = await this.client.post<{ token: string; expires_at?: number; token_type?: string }>(
        `${this.getBaseURL()}/api/v1/auth/email-login`,
        { email, password }
      );
      const token = response.data?.token;
      if (token) this.setToken(token);
      return response.data;
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      throw new Error(detail || 'Invalid email or password');
    }
  }

  async register(email: string, password: string, name?: string) {
    try {
      const response = await this.client.post<{ token: string; expires_at?: number; token_type?: string }>(
        `${this.getBaseURL()}/api/v1/auth/register`,
        { email, password, name }
      );
      const token = response.data?.token;
      if (token) this.setToken(token);
      return response.data;
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      throw new Error(detail || 'Registration failed');
    }
  }

  async requestPasswordReset(email: string) {
    try {
      const response = await this.client.post<{ message: string; reset_link?: string }>(
        `${this.getBaseURL()}/api/v1/auth/forgot-password`,
        { email }
      );
      return response.data;
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      throw new Error(detail || 'Failed to request password reset');
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      await this.client.post<{ message: string }>(
        `${this.getBaseURL()}/api/v1/auth/reset-password`,
        { token, new_password: newPassword }
      );
    } catch (error: unknown) {
      const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      throw new Error(detail || 'Failed to reset password');
    }
  }

  async logout() {
    this.clearToken();
    try {
      const response = await this.client.get(
        `${this.getBaseURL()}/api/v1/auth/logout`
      );
      const redirectUrl = (response.data as { redirect_url?: string })?.redirect_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
    } catch {
      // Backend may not have /auth/logout or may return 404 for email-only users
    }
    // No redirect from backend (e.g. email login) – caller should navigate to /
  }
}

export const authApi = new RPApi();
