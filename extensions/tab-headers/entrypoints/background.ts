import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import { readTabHeaders, type TabHeaders } from "../lib/headers";
import { getTabHeaders, headersForRequest, tabKey } from "../lib/tab-store";

async function updateBadge(tabId: number, config: TabHeaders) {
  const count = config.enabled ? config.headers.length : 0;
  await Promise.all([
    browser.action.setBadgeText({ tabId, text: count ? String(count) : "" }),
    browser.action.setBadgeBackgroundColor({ tabId, color: "#2563eb" }),
  ]);
}

export default defineBackground(() => {
  // Register synchronously so Firefox can wake this event page for requests.
  // Session storage survives event-page suspension without reusing tab IDs after restart.
  type RequestListener = Parameters<
    typeof browser.webRequest.onBeforeSendHeaders.addListener
  >[0];
  const listener = (details: Parameters<RequestListener>[0]) =>
    headersForRequest(browser.storage.session, details).catch(
      (error: unknown) => {
        console.error("Could not apply tab headers", error);
        return {};
      },
    );
  browser.webRequest.onBeforeSendHeaders.addListener(
    // Firefox supports Promise<BlockingResponse>; WXT's cross-browser types do not.
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeSendHeaders
    listener as unknown as RequestListener,
    { urls: ["<all_urls>"] },
    ["blocking", "requestHeaders"],
  );

  browser.tabs.onRemoved.addListener((tabId) => {
    void browser.storage.session.remove(tabKey(tabId)).catch(console.error);
  });

  // Firefox resets tab-specific badges on navigation; restore the saved count.
  browser.tabs.onUpdated.addListener((tabId, change) => {
    if (!change.status) return;
    void getTabHeaders(browser.storage.session, tabId)
      .then((config) => updateBadge(tabId, config))
      .catch(() => {});
  });

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "session") return;
    for (const [key, change] of Object.entries(changes)) {
      const match = /^tab-headers:(\d+)$/.exec(key);
      if (!match) continue;
      const tabId = Number(match[1]);
      const config = readTabHeaders(change.newValue);
      void updateBadge(tabId, config).catch(() => {});
    }
  });
});
