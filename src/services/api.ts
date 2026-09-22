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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : endpoint;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Include HttpOnly session cookies
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
    throw new ApiError(
      'Unable to connect to ServeFlow. Please check your network or server.',
      0,
      'NETWORK_ERROR'
    );
  }
}

export const api = {
  // Authentication
  auth: {
    login: (identifier: string, password: string) =>
      request<ApiResponse<{ user: any; permissions: string[]; accessToken: string }>>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      }),
    logout: () =>
      request<ApiResponse>('/auth/logout', {
        method: 'POST',
      }),
    refresh: () =>
      request<ApiResponse<{ user: any; permissions: string[]; accessToken: string }>>('/auth/refresh', {
        method: 'POST',
      }),
    me: () =>
      request<ApiResponse<{ user: any; permissions: string[] }>>('/auth/me', {
        method: 'GET',
      }),
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
