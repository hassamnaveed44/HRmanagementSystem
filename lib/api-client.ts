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

let isRefreshing = false;

/**
 * Reusable API Fetcher
 * Automatically appends `Authorization: Bearer <jwt-token>` header,
 * performs silent background token refresh on 401 Unauthorized,
 * and retries the request seamlessly.
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

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Intercept 401 Unauthorized responses and attempt silent refresh
  if (response.status === 401 && !url.includes("/api/auth/refresh") && !url.includes("/api/auth/login")) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newToken = refreshData.accessToken || refreshData.token;
          if (newToken && refreshData.user) {
            setStoredAuth(newToken, refreshData.user);

            // Retry original request with new Access Token
            const retryHeaders = new Headers(options.headers || {});
            retryHeaders.set("Authorization", `Bearer ${newToken}`);
            if (options.body && !retryHeaders.has("Content-Type")) {
              retryHeaders.set("Content-Type", "application/json");
            }

            response = await fetch(url, {
              ...options,
              headers: retryHeaders,
            });
          }
        } else {
          // Refresh token expired or revoked
          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            if (currentPath !== "/login" && currentPath !== "/signup") {
              clearStoredAuth();
              window.location.href = "/login?expired=true";
            }
          }
        }
      } catch (err) {
        console.error("Token refresh failed:", err);
      } finally {
        isRefreshing = false;
      }
    }
  }

  return response;
}
