const AUTH_STORAGE_KEY = "TOT_AUTH_EXPERTS";
const AUTH_TTL_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function saveAuthUser(expert) {
  const expiresAt = Date.now() + AUTH_TTL_DURATION_MS;

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      expert,
      expiresAt,
    }),
  );
}

export function loadAuthUser() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) return null;

  try {
    const data = JSON.parse(raw);

    if (!data?.expert || !data?.expiresAt) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    if (Date.now() > data.expiresAt) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return data.expert;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function clearAuthUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
