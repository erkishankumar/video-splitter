/*! coi-serviceworker v0.1.7 - Guido Zuidhof, licensed under MIT */
/* Injects Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers
   so SharedArrayBuffer works on GitHub Pages / Netlify / any static host.
   Source: https://github.com/gzuidhof/coi-serviceworker */

if (typeof window === 'undefined') {
  // SERVICE WORKER SCOPE
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

  async function handleFetch(request) {
    if (request.cache === "only-if-cached" && request.mode !== "same-origin") return;
    const r = await fetch(request).catch(e => { throw e; });
    if (r.status === 0) return r;
    const newHeaders = new Headers(r.headers);
    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
    newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
    newHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
    return new Response(r.body, { status: r.status, statusText: r.statusText, headers: newHeaders });
  }

  self.addEventListener("fetch", e => {
    if (e.request.url.startsWith(self.location.origin)) {
      e.respondWith(handleFetch(e.request));
    }
  });

} else {
  // PAGE SCOPE — register the service worker
  (async () => {
    if (!crossOriginIsolated) {
      if (!("serviceWorker" in navigator)) return;
      try {
        const reg = await navigator.serviceWorker.register(
          window.document.currentScript.src
        );
        // If newly installed, reload so the SW can intercept
        if (reg.installing) {
          await new Promise(r => reg.installing.addEventListener("statechange", function() {
            if (this.state === "activated") r();
          }));
          location.reload();
        }
      } catch (e) {
        console.warn("[coi-sw] registration failed:", e);
      }
    }
  })();
}
