# Tab Headers

Set request headers for one Firefox tab. Each tab has its own settings; switching
tabs does not move the overrides. Headers apply to future network requests from
that tab, including navigation, redirects, iframes, images, scripts, fetch/XHR,
and WebSocket handshakes, including requests to other origins.

```sh
bun install
bun run --filter @ffext/tab-headers dev
```

To load a production build, run `bun run --filter @ffext/tab-headers build`, open
`about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select
`.output/firefox-mv3/manifest.json` in this extension's directory.

1. Open a website tab and click **Tab Headers** in Firefox's extensions menu.
2. Enter header names and values. Use **Add header** for more rows.
3. Click **Apply** for future requests, or **Apply & reload** to reload immediately
   with the saved headers and bypass the cache. Allow access to all websites if
   Firefox prompts; cross-origin subresources need permission too.
4. To pause overrides, uncheck **Enable headers for this tab** and click **Apply**.
   **Clear** immediately removes that tab's saved headers. The toolbar badge shows
   the number of active headers.

Names are case-insensitive: an override replaces all existing instances of that
name, or adds it if absent. Duplicate names and invalid names/values are rejected.
A blank value sends an empty header value; it does not remove the header.

Settings stay with the tab through reloads and navigation, including navigation
to a different website. They are held only in session memory, survive suspension
of the background event page, and clear when the tab closes or Firefox restarts.
They are not synced or written to persistent storage. Configured values are sent
to every accessible origin requested by the tab; use suitable values when setting
credentials such as `Authorization`.

Firefox controls what an extension can intercept. Protected Firefox/Mozilla
pages, cached resources that do not make a network request, and requests without
a tab ID (including some service-worker requests) are outside this extension's
scope. Firefox may also restrict or rewrite particular browser-managed headers.
Other extensions can change headers afterward. See Mozilla's documentation for
[webRequest](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest)
and [onBeforeSendHeaders](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeSendHeaders).

```sh
bun run check
bun run --filter @ffext/tab-headers build
bun run --filter @ffext/tab-headers lint:manifest
bun run --filter @ffext/tab-headers zip
```
