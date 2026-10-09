import { browser } from "wxt/browser";
import { type HeaderOverride, normalizeHeaders } from "../../lib/headers";
import { getTabHeaders, tabKey } from "../../lib/tab-store";
import "./style.css";

function element<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`Missing element: ${selector}`);
  return found;
}

const form = element<HTMLFormElement>("#headers-form");
const editor = element<HTMLFieldSetElement>("#editor");
const enabled = element<HTMLInputElement>("#enabled");
const rows = element<HTMLDivElement>("#headers");
const status = element<HTMLParagraphElement>("#status");
const template = element<HTMLTemplateElement>("#header-row");
let tabId: number | undefined;

function showStatus(message: string, error = false) {
  status.textContent = message;
  status.classList.toggle("error", error);
}

function reportError(error: unknown) {
  showStatus(error instanceof Error ? error.message : String(error), true);
}

function addRow(
  header: HeaderOverride = { name: "", value: "" },
  focus = false,
) {
  const fragment = template.content.cloneNode(true) as DocumentFragment;
  const row = fragment.querySelector<HTMLDivElement>(".header-row");
  const name = fragment.querySelector<HTMLInputElement>(".header-name");
  const value = fragment.querySelector<HTMLInputElement>(".header-value");
  const remove = fragment.querySelector<HTMLButtonElement>(".remove");
  if (!row || !name || !value || !remove)
    throw new Error("Missing header row fields.");
  name.value = header.name;
  value.value = header.value;
  remove.addEventListener("click", () => {
    row.remove();
    if (!rows.children.length) addRow();
    showStatus("Unsaved changes. Click Apply to update this tab.");
  });
  rows.append(fragment);
  if (focus) name.focus();
}

function collectHeaders(): HeaderOverride[] {
  return normalizeHeaders(
    Array.from(rows.querySelectorAll<HTMLDivElement>(".header-row"), (row) => ({
      name: row.querySelector<HTMLInputElement>(".header-name")?.value ?? "",
      value: row.querySelector<HTMLInputElement>(".header-value")?.value ?? "",
    })),
  );
}

async function apply(reload: boolean) {
  if (tabId === undefined) return;
  try {
    const headers = collectHeaders();
    editor.disabled = true;
    // Invoke the permission request directly from the click/submit user gesture.
    const granted =
      enabled.checked && headers.length > 0
        ? await browser.permissions.request({ origins: ["<all_urls>"] })
        : true;
    if (!granted)
      throw new Error(
        "Allow access to all websites to apply headers to every request in this tab.",
      );
    await browser.tabs.get(tabId);
    await browser.storage.session.set({
      [tabKey(tabId)]: { enabled: enabled.checked, headers },
    });
    showStatus(
      enabled.checked && headers.length
        ? `${headers.length} header${headers.length === 1 ? "" : "s"} active for this tab.`
        : "Headers are off for this tab.",
    );
    if (reload) {
      await browser.tabs.reload(tabId, { bypassCache: true });
      window.close();
    }
  } catch (error) {
    reportError(error);
  } finally {
    editor.disabled = false;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void apply(false);
});
form.addEventListener("input", () =>
  showStatus("Unsaved changes. Click Apply to update this tab."),
);
element<HTMLButtonElement>("#apply-reload").addEventListener(
  "click",
  () => void apply(true),
);
element<HTMLButtonElement>("#add-header").addEventListener("click", () =>
  addRow(undefined, true),
);
element<HTMLButtonElement>("#clear").addEventListener("click", async () => {
  if (tabId === undefined) return;
  editor.disabled = true;
  try {
    await browser.storage.session.remove(tabKey(tabId));
    rows.replaceChildren();
    addRow();
    enabled.checked = true;
    showStatus("All headers cleared for this tab.");
  } catch (error) {
    reportError(error);
  } finally {
    editor.disabled = false;
  }
});

async function initialize() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) throw new Error("No current tab is available.");
  const title = element<HTMLParagraphElement>("#tab-title");
  title.textContent = tab.title || tab.url || `Tab ${tab.id}`;
  title.title = tab.url ?? "";
  if (!tab.url || !/^(https?|wss?):\/\//.test(tab.url)) {
    throw new Error("Open a website tab to configure request headers.");
  }
  const config = await getTabHeaders(browser.storage.session, tab.id);
  tabId = tab.id;
  enabled.checked = config.headers.length === 0 ? true : config.enabled;
  for (const header of config.headers) addRow(header);
  if (!config.headers.length) addRow();
  editor.disabled = false;
  const permitted = await browser.permissions.contains({
    origins: ["<all_urls>"],
  });
  showStatus(
    !permitted
      ? "Click Apply to allow access to all websites for this tab’s requests."
      : config.enabled && config.headers.length
        ? `${config.headers.length} header${config.headers.length === 1 ? "" : "s"} active for this tab.`
        : "Add headers, then click Apply.",
  );
}

void initialize().catch(reportError);
