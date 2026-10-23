const BASE_URL = "http://localhost:3000/api"; // Replace with your Express backend port or env variable

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  // 1. Request Interceptor: Attach Auth Token if available
  const token = localStorage.getItem("safepath_token");

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // 2. Response Interceptor: Handle Global HTTP Errors
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid — clear session and redirect to login
        localStorage.removeItem("safepath_token");
        if (window.location.pathname !== "/auth/login") {
          window.location.href = "/auth/login";
        }
      }

      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    // Handle empty 204 No Content responses safely
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error: any) {
    console.error(`[API Error] ${options.method || "GET"} ${endpoint}:`, error.message);
    throw error;
  }
}

// Convenient HTTP verb helpers
export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};
