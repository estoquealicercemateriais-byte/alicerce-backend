const ADMIN_API_KEY_STORAGE_KEY = "whatsbot.adminApiKey";

export function getAdminApiKey(): string | null {
  const value = window.localStorage.getItem(ADMIN_API_KEY_STORAGE_KEY);
  return value?.trim() || null;
}

export function setAdminApiKey(value: string): void {
  const trimmed = value.trim();
  if (!trimmed) {
    window.localStorage.removeItem(ADMIN_API_KEY_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(ADMIN_API_KEY_STORAGE_KEY, trimmed);
}

export function clearAdminApiKey(): void {
  window.localStorage.removeItem(ADMIN_API_KEY_STORAGE_KEY);
}
