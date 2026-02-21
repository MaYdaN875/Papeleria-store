const API_BASE = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/$/, "");

export function getApiBase(): string {
  return API_BASE;
}

export function buildAuthHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

export function buildCandidateApiBases(base: string): string[] {
  const normalizedBase = base.trim().replace(/\/$/, "");
  if (!normalizedBase) return [];

  const variants = new Set<string>([normalizedBase]);
  variants.add(normalizedBase.replace("papelería", "papeleria"));
  variants.add(normalizedBase.replace("papeleria", "papelería"));
  variants.add(normalizedBase.replace("://www.", "://"));
  variants.add(normalizedBase.replace("://", "://www."));

  return Array.from(variants).filter((value) => value.length > 0);
}
