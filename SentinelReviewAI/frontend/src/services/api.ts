import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async login(email: string, password: string) {
    const response = await this.client.post('/api/v1/auth/login', { email, password });
    return response.data;
  }

  async register(email: string, password: string, name: string, organizationName?: string) {
    const data = { email, password, name };
    if (organizationName) (data as any).organizationName = organizationName;
    const response = await this.client.post('/api/v1/auth/register', data);
    return response.data;
  }

  // Reviews
  async getReviews() {
    const response = await this.client.get('/api/v1/reviews');
    return response.data;
  }

  async getReview(id: string) {
    const response = await this.client.get(`/api/v1/reviews/${id}`);
    return response.data;
  }

  async createReview(data: {
    repositoryId: string;
    pullRequestNumber: number;
    provider: string;
  }) {
    const response = await this.client.post('/api/v1/reviews', data);
    return response.data;
  }

  async getReviewComments(reviewId: string) {
    const response = await this.client.get(`/api/v1/reviews/${reviewId}/comments`);
    return response.data;
  }

  // Repositories
  async getRepositories() {
    const response = await this.client.get('/api/v1/repositories');
    return response.data;
  }

  async addRepository(data: {
    provider: string;
    name: string;
    url: string;
    accessToken?: string;
  }) {
    const response = await this.client.post('/api/v1/repositories', data);
    return response.data;
  }

  // Analytics
  async getAnalytics(organizationId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await this.client.get(`/api/v1/analytics/${organizationId}?${params}`);
    return response.data;
  }

  // Webhooks
  async getWebhooks() {
    const response = await this.client.get('/api/v1/admin/webhooks');
    return response.data;
  }

  async createWebhook(data: {
    provider: string;
    url: string;
    events: string[];
  }) {
    const response = await this.client.post('/api/v1/admin/webhooks', data);
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
