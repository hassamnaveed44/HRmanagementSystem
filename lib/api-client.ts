/**
 * Centralized API Client Helper
 * Automatically attaches the Bearer token to all protected API requests
 * and handles 401 Unauthorized responses by clearing session state and redirecting to /login.
 */

export const TOKEN_KEY = "jwt_token";
export const USER_KEY = "auth_user";

/**
 * Get stored JWT token from localStorage.
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store JWT token and user info in localStorage and document.cookie.
 */
export function setStoredAuth(token: string, user: any): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=604800; SameSite=Lax`;
}

/**
 * Clear stored JWT token and user info from localStorage and document.cookie.
 */
export function clearStoredAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/**
 * Get stored User info from localStorage.
 */
export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Reusable API Fetcher
 * Automatically appends `Authorization: Bearer <jwt-token>` header
 * and intercepts 401 Unauthorized responses.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  // Set default Content-Type to application/json if sending a body
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Attach Bearer token if available
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Intercept 401 Unauthorized responses
  if (response.status === 401) {
    // Only intercept if we are not on public auth pages (/login or /signup)
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      if (currentPath !== "/login" && currentPath !== "/signup") {
        clearStoredAuth();
        window.location.href = "/login?expired=true";
      }
    }
  }

  return response;
}
