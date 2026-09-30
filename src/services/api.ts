/**
 * ServeFlow Centralized API Client
 * Automatically includes credentials (HttpOnly cookies) for every request.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function getServerUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('serveflow_server_url');
    if (saved && saved.trim()) {
      const clean = saved.trim().replace(/\/+$/, '');
      // Automatically clear invalid/placeholder IP ending in .0 (network address)
      if (clean.includes('192.168.161.0') || clean.endsWith('.0:4000') || clean.endsWith('.0')) {
        localStorage.removeItem('serveflow_server_url');
      } else {
        return clean;
      }
    }

    const envUrl = (import.meta as any).env?.VITE_API_URL;
    if (envUrl && envUrl.trim()) return envUrl.trim().replace(/\/+$/, '');

    // If running in Capacitor or mobile webview
    const isCapacitor =
      (window as any).Capacitor !== undefined ||
      window.location.protocol === 'file:' ||
      (window.location.hostname === 'localhost' && window.location.port !== '4000' && window.location.port !== '3000');

    if (isCapacitor) {
      return 'http://10.0.2.2:4000';
    }
  }
  return '';
}

export function setServerUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('serveflow_server_url');
    } else {
      localStorage.setItem('serveflow_server_url', url.trim().replace(/\/+$/, ''));
    }
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('serveflow_access_token');
  }
  return null;
}

export function setAuthToken(token: string | null): void {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('serveflow_access_token', token);
    } else {
      localStorage.removeItem('serveflow_access_token');
    }
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const base = getServerUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${base}${endpoint}`;

  const token = getAuthToken();
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Include HttpOnly session cookies where supported
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new ApiError(
        data.message || (res.status === 403 ? 'Access Denied.' : 'Request failed'),
        res.status,
        data.error
      );
    }

    return data;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    const currentServer = base || 'localhost:4000';
    throw new ApiError(
      `Unable to connect to ServeFlow at ${currentServer}. Please verify your server is running and Wi-Fi is connected.`,
      0,
      'NETWORK_ERROR'
    );
  }
}

export const api = {
  // Authentication
  auth: {
    login: async (identifier: string, password: string) => {
      const res = await request<ApiResponse<{ user: any; permissions: string[]; accessToken: string }>>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      if (res.success && res.data?.accessToken) {
        setAuthToken(res.data.accessToken);
      }
      return res;
    },
    logout: async () => {
      try {
        await request<ApiResponse>('/auth/logout', {
          method: 'POST',
        });
      } finally {
        setAuthToken(null);
      }
    },
    refresh: async () => {
      const res = await request<ApiResponse<{ user: any; permissions: string[]; accessToken: string }>>('/auth/refresh', {
        method: 'POST',
      });
      if (res.success && res.data?.accessToken) {
        setAuthToken(res.data.accessToken);
      }
      return res;
    },
    me: () =>
      request<ApiResponse<{ user: any; permissions: string[] }>>('/auth/me', {
        method: 'GET',
      }),
    ping: async (urlOverride?: string): Promise<{ ok: boolean; message: string }> => {
      const base = (urlOverride || getServerUrl()).replace(/\/+$/, '');
      const pingUrl = `${base}/health`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(pingUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          return { ok: true, message: `Connected to ${base}` };
        }
        return { ok: false, message: `Server replied with HTTP ${res.status}` };
      } catch (err: any) {
        return { ok: false, message: `Cannot reach server at ${base}: ${err.message || 'Timeout'}` };
      }
    },
  },

  // Employees
  employees: {
    list: (params?: { q?: string; role?: string; status?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.append('q', params.q);
      if (params?.role) searchParams.append('role', params.role);
      if (params?.status) searchParams.append('status', params.status);
      return request<ApiResponse<any[]>>(`/api/employees?${searchParams.toString()}`);
    },
    create: (data: any) =>
      request<ApiResponse<any>>('/api/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<ApiResponse<any>>(`/api/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deactivate: (id: string) =>
      request<ApiResponse>(`/api/employees/${id}/deactivate`, {
        method: 'POST',
      }),
    activate: (id: string) =>
      request<ApiResponse>(`/api/employees/${id}/activate`, {
        method: 'POST',
      }),
    resetPassword: (id: string, newPassword: string) =>
      request<ApiResponse>(`/api/employees/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      }),
    auditLogs: () => request<ApiResponse<any[]>>('/api/employees/audit'),
  },

  // Tables
  tables: {
    list: () => request<ApiResponse<any[]>>('/api/tables'),
  },

  // Menu
  menu: {
    list: () => request<ApiResponse<any[]>>('/api/menu'),
    create: (data: any) =>
      request<ApiResponse<any>>('/api/menu', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<ApiResponse<any>>(`/api/menu/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<ApiResponse<{ dishId: string }>>(`/api/menu/${id}`, {
        method: 'DELETE',
      }),
    toggleAvailability: (id: string) =>
      request<ApiResponse<{ isAvailable: boolean }>>(`/api/menu/${id}/toggle`, {
        method: 'PATCH',
      }),
    stockOut: (id: string, isAvailable: boolean) =>
      request<ApiResponse<{ dishId: string; dishName: string; isAvailable: boolean }>>(
        `/api/menu/${id}/stock-out`,
        {
          method: 'POST',
          body: JSON.stringify({ isAvailable }),
        }
      ),
  },

  // Orders
  orders: {
    list: (params?: { status?: string; type?: string }) => {
      const sp = new URLSearchParams();
      if (params?.status) sp.append('status', params.status);
      if (params?.type) sp.append('type', params.type);
      return request<ApiResponse<any[]>>(`/api/orders?${sp.toString()}`);
    },
    create: (orderData: any) =>
      request<ApiResponse<{ orderId: string; kotId: string; totals: any }>>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      }),
    addItems: (orderId: string, additionalItems: any[]) =>
      request<ApiResponse>(`/api/orders/${orderId}/items`, {
        method: 'POST',
        body: JSON.stringify({ additionalItems }),
      }),
    requestBill: (orderId: string) =>
      request<ApiResponse>(`/api/orders/${orderId}/request-bill`, {
        method: 'POST',
      }),
    submitPayment: (orderId: string, paymentData: any) =>
      request<ApiResponse>(`/api/orders/${orderId}/payment`, {
        method: 'POST',
        body: JSON.stringify(paymentData),
      }),
    verifyPayment: (orderId: string) =>
      request<ApiResponse>(`/api/orders/${orderId}/verify-payment`, {
        method: 'POST',
      }),
  },

  // Kitchen KOTs
  kot: {
    list: () => request<ApiResponse<any[]>>('/api/kot'),
    updateStatus: (kotId: string, status: 'new' | 'preparing' | 'ready' | 'served') =>
      request<ApiResponse>(`/api/kot/${kotId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  // Reports
  reports: {
    dailySummary: () => request<ApiResponse<any>>('/api/reports/daily-summary'),
  },

  // Real-time synchronization
  sync: {
    pulse: () =>
      request<
        ApiResponse<{
          tables: any[];
          orders: any[];
          kitchenTickets: any[];
          dishes: any[];
        }>
      >('/api/sync/pulse'),
  },
};
