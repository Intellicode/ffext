import { expect, test } from "bun:test";
import {
  getTabHeaders,
  headersForRequest,
  type SessionStorage,
  tabKey,
} from "./tab-store";

function sessionStorage(): SessionStorage {
  const data: Record<string, unknown> = {};
  return {
    async get(key) {
      return { [key]: data[key] };
    },
    async set(items) {
      Object.assign(data, structuredClone(items));
    },
    async remove(key) {
      delete data[key];
    },
  };
}

test("settings follow the originating tab, even when another tab is active", async () => {
  const storage = sessionStorage();
  await storage.set({
    [tabKey(1)]: { enabled: true, headers: [{ name: "X-Tab", value: "one" }] },
    [tabKey(2)]: { enabled: true, headers: [{ name: "X-Tab", value: "two" }] },
  });
  const requestHeaders = [{ name: "Accept", value: "*/*" }];
  for (const [tabId, value] of [
    [1, "one"],
    [2, "two"],
  ] as const) {
    expect(await headersForRequest(storage, { tabId, requestHeaders })).toEqual(
      {
        requestHeaders: [...requestHeaders, { name: "X-Tab", value }],
      },
    );
  }
  expect(
    await headersForRequest(storage, { tabId: 3, requestHeaders }),
  ).toEqual({});
  expect(
    await headersForRequest(storage, { tabId: -1, requestHeaders }),
  ).toEqual({});
  expect(await headersForRequest(storage, { tabId: 1 })).toEqual({});
});

test("reads the latest session settings on every request, including after background suspension", async () => {
  const storage = sessionStorage();
  const key = tabKey(4);
  await storage.set({
    [key]: { enabled: true, headers: [{ name: "X-Test", value: "old" }] },
  });
  const request = { tabId: 4, requestHeaders: [] };
  expect(
    (await headersForRequest(storage, request)).requestHeaders?.[0]?.value,
  ).toBe("old");
  await storage.set({
    [key]: { enabled: true, headers: [{ name: "X-Test", value: "new" }] },
  });
  expect(
    (await headersForRequest(storage, request)).requestHeaders?.[0]?.value,
  ).toBe("new");
  await storage.set({
    [key]: { enabled: false, headers: [{ name: "X-Test", value: "new" }] },
  });
  expect(await headersForRequest(storage, request)).toEqual({});
  expect((await getTabHeaders(storage, 4)).headers).toHaveLength(1);
  await storage.remove(key);
  expect(await headersForRequest(storage, request)).toEqual({});
  expect(await headersForRequest(sessionStorage(), request)).toEqual({});
});

test("invalid tab IDs cannot become storage keys", () => {
  for (const tabId of [-1, 1.5, Number.NaN])
    expect(() => tabKey(tabId)).toThrow("No current tab");
});
