export function getApiUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl !== "http://localhost:5000") {
    return envUrl;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:5000";
}

export function getAuthToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("pulse_token");
  }
  return null;
}

export function getAuthUsername(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("pulse_username") || "";
  }
  return "";
}

export function setAuthToken(token: string, username: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("pulse_token", token);
    localStorage.setItem("pulse_username", username);
  }
}

export function removeAuthToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("pulse_token");
    localStorage.removeItem("pulse_username");
  }
}

export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  if (!token) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Not authenticated");
  }

  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${token}`,
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    removeAuthToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Session expired. Please login again.");
  }

  return response;
}
