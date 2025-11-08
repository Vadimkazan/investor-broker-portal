const API_URL = 'https://functions.poehali.dev/fc00dc4e-18bf-4893-bb9d-331e8abda973';

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'investor' | 'broker';
  is_admin?: boolean;
  notify_new_objects?: boolean;
  created_at?: string;
}

export interface BrokerInfo {
  id: number;
  name: string;
  email: string;
  city?: string;
  club?: string;
  training_stream?: string;
  country?: string;
  surname?: string;
  first_name?: string;
}

export interface InvestmentObjectDB {
  id: number;
  broker_id?: number;
  title: string;
  city: string;
  address: string;
  property_type: 'flats' | 'apartments' | 'commercial' | 'country';
  area: number;
  price: number;
  yield_percent: number;
  payback_years: number;
  description?: string;
  images?: string[];
  videos?: string[];
  documents?: string[];
  status: 'available' | 'reserved' | 'sold';
  created_at?: string;
  broker?: BrokerInfo;
  min_investment?: number;
  monthly_payment?: number;
  strategy?: string;
  deal_cycle?: string;
  presentation_link?: string;
  investment_decision?: string;
}

export interface Favorite {
  id: number;
  user_id: number;
  object_id: number;
  created_at?: string;
  object?: {
    title: string;
    city: string;
    price: number;
    yield_percent: number;
    images: string[];
  };
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  object_id?: number;
  is_read: boolean;
  created_at?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    resource: string,
    method: string = 'GET',
    body?: any,
    params?: Record<string, string>
  ): Promise<T> {
    const queryParams = new URLSearchParams({ resource, ...params });
    const url = `${this.baseUrl}?${queryParams}`;

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('users', 'GET');
  }

  async getUserByEmail(email: string): Promise<User> {
    return this.request<User>('users', 'GET', undefined, { email });
  }

  async getUserById(id: number): Promise<User> {
    return this.request<User>('users', 'GET', undefined, { id: id.toString() });
  }

  async createUser(data: { email: string; name: string; role: 'investor' | 'broker' }): Promise<User> {
    return this.request<User>('users', 'POST', data);
  }

  async updateUser(id: number, data: { name?: string; notify_new_objects?: boolean }): Promise<User> {
    return this.request<User>('users', 'PUT', { id, ...data });
  }

  async getObjects(filters?: {
    city?: string;
    property_type?: string;
    status?: string;
    min_price?: number;
    max_price?: number;
    min_yield?: number;
    max_yield?: number;
    broker_city?: string;
    broker_club?: string;
    broker_stream?: string;
  }): Promise<InvestmentObjectDB[]> {
    const params: Record<string, string> = {};
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value.toString();
        }
      });
    }
    
    return this.request<InvestmentObjectDB[]>('objects', 'GET', undefined, params);
  }

  async getObjectById(id: number): Promise<InvestmentObjectDB> {
    return this.request<InvestmentObjectDB>('objects', 'GET', undefined, { id: id.toString() });
  }

  async createObject(data: Omit<InvestmentObjectDB, 'id' | 'created_at'>): Promise<InvestmentObjectDB> {
    return this.request<InvestmentObjectDB>('objects', 'POST', data);
  }

  async updateObject(id: number, data: Partial<InvestmentObjectDB>): Promise<InvestmentObjectDB> {
    return this.request<InvestmentObjectDB>('objects', 'PUT', { id, ...data });
  }

  async getFavorites(userId: number): Promise<Favorite[]> {
    return this.request<Favorite[]>('favorites', 'GET', undefined, { user_id: userId.toString() });
  }

  async addToFavorites(userId: number, objectId: number): Promise<Favorite> {
    return this.request<Favorite>('favorites', 'POST', { user_id: userId, object_id: objectId });
  }

  async removeFromFavorites(userId: number, objectId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>('favorites', 'DELETE', undefined, {
      user_id: userId.toString(),
      object_id: objectId.toString(),
    });
  }

  async getNotifications(userId: number): Promise<Notification[]> {
    return this.request<Notification[]>('notifications', 'GET', undefined, { user_id: userId.toString() });
  }

  async markNotificationAsRead(notificationId: number): Promise<Notification> {
    return this.request<Notification>('notifications', 'PUT', { id: notificationId });
  }

  async createNotification(data: { user_id: number; type: string; title: string; message: string; object_id?: number }): Promise<Notification> {
    return this.request<Notification>('notifications', 'POST', data);
  }

  async uploadFile(file: File): Promise<{ url: string; fileName: string; fileType: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const response = await fetch('https://functions.poehali.dev/c8226cd3-1426-487a-8f8f-0b22ed0be84e', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: base64Data,
              fileName: file.name,
              fileType: file.type
            })
          });
          
          if (!response.ok) {
            throw new Error('Upload failed');
          }
          
          const data = await response.json();
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const api = new ApiClient(API_URL);