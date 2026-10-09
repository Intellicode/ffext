import { firefoxConfig } from "@ffext/config";
import { defineConfig } from "wxt";

export default defineConfig({
  ...firefoxConfig,
  manifest: {
    name: "Starter",
    description: "A custom Firefox extension.",
    browser_specific_settings: {
      gecko: {
        id: "starter@ffext.local",
        strict_min_version: "142.0",
        data_collection_permissions: { required: ["none"] },
      },
    },
  },
});
