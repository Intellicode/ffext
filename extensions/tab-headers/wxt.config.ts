import { firefoxConfig } from "@ffext/config";
import { defineConfig } from "wxt";

export default defineConfig({
  ...firefoxConfig,
  manifest: {
    name: "Tab Headers",
    description: "Set custom request headers for the current tab.",
    icons: {
      16: "icons/16.png",
      32: "icons/32.png",
      48: "icons/48.png",
      96: "icons/96.png",
      128: "icons/128.png",
    },
    action: {
      default_icon: {
        16: "icons/16.png",
        32: "icons/32.png",
        48: "icons/48.png",
      },
    },
    permissions: ["activeTab", "storage", "webRequest", "webRequestBlocking"],
    host_permissions: ["<all_urls>"],
    browser_specific_settings: {
      gecko: {
        id: "tab-headers@ffext.local",
        strict_min_version: "142.0",
        data_collection_permissions: { required: ["none"] },
      },
    },
  },
});
