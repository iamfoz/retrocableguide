## XMLTV + Config Design

### Goal

Make the preview video URL configurable and replace hardcoded schedule data with a framework-agnostic guide data layer that can pull now/next programme data from an XMLTV feed through a proxy.

### Recommended Approach

Use a small checked-in config module plus a normalized guide adapter. The UI should consume a simple guide payload and should not parse XMLTV directly. A thin host-specific proxy layer should fetch XMLTV and call the shared normalization code.

### Architecture

- `src/config.js` holds editable settings:
  - `previewVideoUrl`
  - `xmltvUrl`
  - `proxyPath`
  - `channelMap`
  - `fallbackToDemoData`
- `src/guide/*` holds plain JavaScript helpers for:
  - fetching XMLTV
  - parsing XMLTV
  - normalizing programme data into the retro guide shape
  - exposing seeded fallback demo data
- The React UI reads config and requests normalized JSON from the proxy endpoint.
- The proxy endpoint is thin and host-specific.

### Data Contract

The UI should consume payloads shaped like:

```json
{
  "generatedAt": "2026-03-20T10:00:00.000Z",
  "channels": [
    {
      "num": 1,
      "name": "Sky One",
      "programmes": [
        { "start": "18:00", "title": "Batfink" },
        { "start": "18:30", "title": "DJ Kat Show" }
      ]
    }
  ]
}
```

The first programme is used as `now`; the second as `next`.

### Proxy Shape

For the current Vite app, add a thin `/api/guide` endpoint through Vite server middleware for development and preview. That endpoint should:

1. Read config.
2. Fetch the configured XMLTV URL server-side.
3. Parse channel and programme entries.
4. Map feed channels to visible retro guide channels via explicit config.
5. Return normalized JSON.

Later, Astro can replace only the adapter layer with an Astro API route while reusing the same config and normalization modules.

### Error Handling

- If the XMLTV fetch fails, return fallback demo data when enabled.
- If a channel has no current or next programme, return the best available entries or a placeholder.
- If the configured video URL fails, keep the existing visual fallback in the preview window.

### Testing

- Confirm the preview video reads from config instead of a hardcoded path.
- Confirm `/api/guide` returns normalized JSON from XMLTV.
- Confirm the UI renders fallback demo data when the feed is unavailable.
- Confirm the layout and preview framing remain unchanged.
