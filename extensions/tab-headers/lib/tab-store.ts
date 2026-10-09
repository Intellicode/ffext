import {
  applyHeaders,
  type RequestHeader,
  readTabHeaders,
  type TabHeaders,
} from "./headers";

export interface SessionStorage {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
  remove(key: string): Promise<void>;
}

export function tabKey(tabId: number): string {
  if (!Number.isInteger(tabId) || tabId < 0)
    throw new Error("No current tab is available.");
  return `tab-headers:${tabId}`;
}

export async function getTabHeaders(
  storage: SessionStorage,
  tabId: number,
): Promise<TabHeaders> {
  const key = tabKey(tabId);
  return readTabHeaders((await storage.get(key))[key]);
}

export async function headersForRequest(
  storage: SessionStorage,
  details: { tabId: number; requestHeaders?: RequestHeader[] },
): Promise<{ requestHeaders?: RequestHeader[] }> {
  if (details.tabId < 0 || !details.requestHeaders) return {};
  const config = await getTabHeaders(storage, details.tabId);
  if (!config.enabled || config.headers.length === 0) return {};
  return {
    requestHeaders: applyHeaders(details.requestHeaders, config.headers),
  };
}
