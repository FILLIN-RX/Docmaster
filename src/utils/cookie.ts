const TOKEN_KEY = "docmaster_jwt_token";

export function getToken() {
  let token = localStorage.getItem(TOKEN_KEY);
  if (token) return token;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === TOKEN_KEY) {
      token = decodeURIComponent(value);
      if (token) localStorage.setItem(TOKEN_KEY, token);
      return token;
    }
  }
  return null;
}

export function saveToken(token) {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=604800; SameSite=Lax`;
}

export function deleteToken() {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function isAuthenticated() {
  return !!getToken();
}
