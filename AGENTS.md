# Retro Cable Guide Handoff

## Current State

- Project path: `/Users/alexkinch/Projects/alexkinch/retrocableguide`
- GitHub repo: `github.com/alexkinch/retrocableguide`
- Branch: `main`
- Main guide page file: `src/pages/guide-page.jsx`
- Main config file: `src/config.js`
- Mosaic page: `src/pages/mosaic-page.jsx`
- CRT overlay component: `src/components/crt-overlay.jsx`

## What Was Built

- A PAL-era cable guide recreation in React/Vite.
- Frame target is `720x576`.
- The app now has three routes:
  - `/` launcher (branded title card with guide/mosaic links)
  - `/guide` retro guide
  - `/mosaic` mosaic wall
- Two configurable visual styles: Nynex (default) and Telewest, selectable via `guideStyle`.
- The top-right preview area can independently show live video or a rotating promo slideshow, controlled by `previewContentMode`.
- The top layout is built around a shared grid instead of ad hoc sections.
- Live guide data comes from configurable M3U and XMLTV feeds.
- The main listings render from the full filtered channel set.
- The top-left preview panel and video rotate over a configurable `previewChannels` subset.
- The top-left preview info panel supports configurable transition effects.
- A separate mosaic page shows 12 outer live tiles plus a rotating centre promo tile.
- Mosaic page audio can be overridden with a separate URL.
- The right preview window crops wider-than-`4:3` sources to fill the retro preview area.
- The lower guide area uses shared column geometry so `START` and `CHANNEL` line up with the content rows.
- Branding is fully configurable via `guideBrand` in config; defaults to `"cable"`.
- The guide logo is rendered in code from `guideBrand`, not from an image asset.
- Promo slides are defined in config with `{brand}` template tokens that resolve at runtime.
- A whole-frame CRT overlay (scanlines, vignette, phosphor bloom) is available via `crtEffect` and applies to all three routes.

## Important Design Decisions

- Treat this as **PAL 576i / 720x576**, not 480i.
- Preserve overall proportions. Do not keep shrinking modules to solve safe-area problems.
- Safe-area thinking should apply mostly to text/graphics placement, not to collapsing the whole composition.
- The main guide and preview channel rotation are separate concerns.
- Preview channel logic must not affect the main listings set.
- Guide preview transitions only apply to the top-left info panel, not the video window.
- `guideStyle` controls visual appearance (Nynex vs Telewest); `previewContentMode` independently controls whether the top-right box shows promos or live video. These are decoupled.
- Mosaic page behavior must stay isolated from guide-page behavior.
- Most UI chrome uses a Futura-style stack: `F_UI`.
- Programme listing rows use Arial/Helvetica-style italic text: `F_MAIN`.

## Current Layout Constants

These are at the top of `src/pages/guide-page.jsx` and drive most geometry:

- `FRAME_WIDTH`
- `FRAME_HEIGHT`
- `LEFT_PANEL_WIDTH`
- `RIGHT_PANEL_WIDTH`
- `TOP_TOTAL_HEIGHT`
- `TOP_TEXT_HEIGHT`
- `CALENDAR_ROW_HEIGHT`
- `HEADER_HEIGHT`
- `BODY_HEIGHT`
- `START_COL_WIDTH`
- `LEFT_CHANNEL_WIDTH`
- `NOW_HEADER_WIDTH`
- `TELE_TEXT_WIDTH`

If proportions drift again, adjust these first instead of patching individual blocks.

## Config Reference

All settings live in `src/config.js` (`APP_CONFIG`):

- `guideStyle`: `"nynex"` (default) or `"telewest"` — visual style toggle.
- `guideBrand`: brand name string (default `"cable"`). Used in the rendered logo and promo template resolution.
- `previewContentMode`: `"video"` or `"promo"` — controls whether the top-right box shows live video or a promo slideshow.
- `previewInfoMode`: `"rotate"` or `"fixed"` — controls whether the top-left panel cycles channels.
- `previewVideoMode`: `"channel"` or `"url"` — whether the large preview follows the current channel or a fixed URL.
- `previewFixedChannel`: pin the top-left panel to a specific channel number when not rotating.
- `previewVideoUrl`: override URL for the preview video; blank means use the current preview channel stream.
- `previewChannels`: array of channel numbers for the rotating preview subset.
- `previewCycleSeconds`: rotation interval (default `15`).
- `previewTransitions`, `previewTransitionMode`, `previewTransitionSeconds`: control the top-left panel transition effect.
- `previewMuted`: whether preview video starts muted.
- `mosaicChannels`: 12-tile mosaic lineup.
- `mosaicCycleSeconds`: mosaic centre tile rotation interval.
- `mosaicAudioUrl`: audio stream override for the mosaic page.
- `m3uUrl`, `xmltvUrl`: feed endpoints.
- `proxyPath`: local proxy endpoint for guide data.
- `refreshMinutes`: how often to re-fetch guide data.
- `timeFormat`: `"12h"` or `"24h"`.
- `allowedGroups`: M3U group filter.
- `stripNamePrefixes`: whether to strip common channel name prefixes.
- `channelLimit`: `0` means no cap.
- `fallbackToDemoData`: use demo data if feeds fail.
- `crtEffect`: `true`/`false` — whole-frame CRT overlay on all routes.
- `headerTagline`: text shown in the guide header's rightmost cell (default `"Full listings on teletext"`).
- `promos`: array of promo slide objects. Text fields support `{brand}` tokens.

## Feed and Preview Notes

- Current guide sources are Dispatcharr endpoints:
  - `m3uUrl: http://192.168.20.186:9191/output/m3u`
  - `xmltvUrl: http://192.168.20.186:9191/output/epg`
- Current `allowedGroups` are the UK groups.
- TS preview uses `mpegts.js`.
- HLS preview uses `hls.js`.
- Shared TS/HLS tile playback logic lives in `src/components/stream-media.jsx`.

## Teletext TTI Generator

A standalone teletext page generator lives in `src/teletext/` (all `.mjs` files) with CLI scripts in `scripts/`.

### Files

- `src/teletext/tti-writer.mjs` — control codes, OL line builder, page/carousel assembly
- `src/teletext/page-builder.mjs` — layout utilities (dot leaders, separators, programme rows, fastext bar)
- `src/teletext/index-page.mjs` — Channel Guide Index page generator (two-column, carousel)
- `src/teletext/schedule-page.mjs` — per-channel schedule page generator (today/tomorrow, carousel)
- `src/teletext/generator.mjs` — orchestrator: fetches M3U+XMLTV, matches channels, generates all pages
- `src/teletext/config.mjs` — teletext-specific configuration
- `scripts/generate-teletext.mjs` — CLI: generates `.tti` files from live feed data (one-shot)
- `scripts/teletext-server.mjs` — long-running server: regenerates `.tti` files on a timer (default 15m)
- `scripts/build-teletext-t42.mjs` — CLI: compiles `.tti` files into a `.t42` binary (requires `~/Projects/TheMarco/teletext`)

### Teletext Config (`src/teletext/config.mjs`)

- `serviceName`: header text on all pages (default `"TV Guide"`)
- `indexTitle`: double-height title on the index page (default `"THE CHANNEL GUIDE INDEX"`)
- `indexPage`: `0x100`
- `todayPageBase`: `0x100` — today schedule pages start here (channel N → page 1NN)
- `tomorrowPageBase`: `0x200` — tomorrow schedule pages start here (channel N → page 2NN)
- `scheduleCarouselSeconds`: carousel cycle time for schedule pages (default `15`)
- `indexCarouselSeconds`: carousel cycle time for index pages (default `10`)
- `autoSlotMap`: `true` — auto-assign sequential channel numbers (1–99) from M3U order
- `channelSlotMap`: manual override `{ sourceChannelNum: displayChannelNum }`

### Page Numbering

- Page 100: Channel Guide Index (carousel subpages if >30 channels)
- Pages 101–199: today's schedules (channel 1 = page 101, channel 42 = page 142, etc.)
- Pages 201–299: tomorrow's schedules (channel 1 = page 201, channel 42 = page 242, etc.)

Channel numbers are assigned sequentially (1–99) from M3U order after group filtering. Page offsets use BCD encoding so decimal channel numbers map directly to teletext page numbers (e.g. channel 42 → BCD `0x42` → page `0x142` displays as "142").

User navigation: press `1` then channel number for today, `2` then channel number for tomorrow.

### Usage

```bash
# Generate .tti files from live XMLTV/M3U data (one-shot)
node scripts/generate-teletext.mjs --output-dir ./teletext-pages

# Run as a long-running server, regenerating every 15 minutes
# Point --output-dir at vbit2's pages directory for live updates
node scripts/teletext-server.mjs --output-dir ./teletext-pages --interval 15

# Compile to .t42 for browser viewer (not needed for vbit2, which reads .tti directly)
node scripts/build-teletext-t42.mjs --input-dir ./teletext-pages

# View in TheMarco's browser viewer (load the .t42 via its "Load .t42 file" button)
cd ~/Projects/TheMarco/teletext && npm start
```

### Schedule Page Behaviour

Based on analysis of off-air TV Today captures (23 Jan 1999):

- **Broadcast day**: "Today" runs 06:00–06:00, capturing the overnight tail from the previous evening. "Tomorrow" runs midnight–midnight (full calendar day).
- **No time-trimming**: the full day's schedule is always shown; past programmes are not removed.
- **Row 23 pagination**: single-page schedules have a blank row 23. Multi-page carousels show "Later programmes follow>>>>" on earlier subpages, "Earlier programmes follow>>>>" on the last subpage.
- **Date header spans**: when a subpage contains programmes after midnight, the header shows both days (e.g. "Sat 23 Jan - Sun 24 Jan").

### Technical Notes

- Self-contained: own M3U/XMLTV parsing, no imports from `src/guide/`
- TTI control codes use `\xNN` hex escape notation (compatible with both vbit2 and TheMarco's viewer)
- Double-height rows emit both top and bottom half rows
- Fastext links: Red=Prev channel, Green=Next channel, Yellow=Index, Cyan=Toggle day
- The `.mjs` extension is required because the main project is CJS but these files use ESM
- vbit2 reads `.tti` files directly from a directory; the `.t42` compile step is only needed for browser viewers

## Known Remaining Issues / Likely Next Steps

- Browser TS preview still needs real-world validation against all channels.
- The transition set may still want editorial tuning; the framework is now configurable.
- Calendar badge could still be pushed closer to the exact reference if needed.
- Header colors and contrast may still want tiny calibration against additional captures.
- The top-left channel/logo/programme panel may still need small proportional tuning depending on new references.
- `public/guide-logo.png` is now unused and can be deleted.
- Teletext channel-to-page mapping uses BCD encoding; channels beyond 99 are not supported.
- Teletext page output needs real-world validation on vbit2/Raspberry Pi.

## Things Not To Break

- Do not let preview-channel filtering mutate the main listings.
- Do not let guide transitions affect the video window.
- Do not let the mosaic page logic leak back into the guide page.
- Do not go back to independent top/bottom layouts; keep the shared grid.
- Do not replace the listing rows with a separate programme column.
- Do not shrink everything globally to chase safe zones.
- Do not let `guideStyle` dictate `previewContentMode` — they are independent.

## Useful Commands

Install / run:

```bash
npm install
npm run dev
npm run build
```

Transcode a browser-friendly 4:3 preview file:

```bash
ffmpeg -i video.mp4 -vf "scale=768:576:flags=lanczos,setsar=1,setdar=4/3" -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -c:a aac -b:a 192k /Users/alexkinch/Projects/alexkinch/retrocableguide/public/video.mp4
```

Inspect live guide data:

```bash
curl -s http://127.0.0.1:5175/api/guide
```

## Final Instruction

Future changes should be incremental and reference-driven.
