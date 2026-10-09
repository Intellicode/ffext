export interface HeaderOverride {
  name: string;
  value: string;
}

export interface TabHeaders {
  enabled: boolean;
  headers: HeaderOverride[];
}

export interface RequestHeader {
  name: string;
  value?: string;
  binaryValue?: ArrayBuffer;
}

export const emptyTabHeaders = (): TabHeaders => ({
  enabled: false,
  headers: [],
});

export function normalizeHeaders(headers: HeaderOverride[]): HeaderOverride[] {
  const names = new Set<string>();
  const result: HeaderOverride[] = [];
  for (const [index, header] of headers.entries()) {
    const name = header.name.trim();
    if (!name && !header.value) continue;
    if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name)) {
      throw new Error(`Header ${index + 1}: enter a valid header name.`);
    }
    // HTTP field values permit horizontal tabs and Latin-1, but no other controls.
    if (/[^\t\x20-\x7e\x80-\xff]/.test(header.value)) {
      throw new Error(
        `Header ${index + 1}: values cannot contain newlines, control characters, or characters outside Latin-1.`,
      );
    }
    const key = name.toLowerCase();
    if (names.has(key))
      throw new Error(`Header ${index + 1}: ${name} is already listed.`);
    names.add(key);
    result.push({ name, value: header.value });
  }
  return result;
}

export function readTabHeaders(value: unknown): TabHeaders {
  if (!value || typeof value !== "object") return emptyTabHeaders();
  const config = value as Partial<TabHeaders>;
  if (typeof config.enabled !== "boolean" || !Array.isArray(config.headers))
    return emptyTabHeaders();
  if (
    !config.headers.every(
      (header) =>
        header &&
        typeof header.name === "string" &&
        typeof header.value === "string",
    )
  )
    return emptyTabHeaders();
  try {
    return {
      enabled: config.enabled,
      headers: normalizeHeaders(config.headers),
    };
  } catch {
    return emptyTabHeaders();
  }
}

export function applyHeaders(
  original: RequestHeader[],
  overrides: HeaderOverride[],
): RequestHeader[] {
  const names = new Set(overrides.map((header) => header.name.toLowerCase()));
  return [
    ...original.filter((header) => !names.has(header.name.toLowerCase())),
    ...overrides.map((header) => ({ ...header })),
  ];
}
