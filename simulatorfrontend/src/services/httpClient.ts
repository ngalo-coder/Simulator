/**
 * Base HTTP client for API communication
 * Handles authentication headers, error handling, and token management
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

type RequestOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  isFormData?: boolean;
};

class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, signal, isFormData = false } = options;

    const config: RequestInit = {
      method,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...this.getAuthHeaders(),
        ...headers,
      },
      signal,
    };

    if (body) {
      config.body = isFormData ? body : JSON.stringify(body);
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, config);

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || data.error || `Request failed with status ${response.status}`;
        const error = new Error(errorMessage) as any;
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request was cancelled');
      }
      // If we already formatted the error, re-throw
      if (error.status) throw error;
      throw new Error(error.message || 'Network error');
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', signal });
  }

  async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  }

  // Raw fetch access for streaming endpoints
  getBaseUrl(): string {
    return this.baseUrl;
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }
}

export const httpClient = new HttpClient(API_URL);
export default HttpClient;
