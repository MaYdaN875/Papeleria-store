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
  // Solo agregar la variante ASCII si el original tiene caracteres especiales
  const asciiVariant = normalizedBase.replace("papelería", "papeleria");
  if (asciiVariant !== normalizedBase) variants.add(asciiVariant);

  return Array.from(variants);
}
