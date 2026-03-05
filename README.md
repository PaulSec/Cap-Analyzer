# CAP Analyzer (Expo + React Native Web)

Front-end-only network traffic analyzer that runs entirely in the browser.

## What this app does

- Drag-and-drop `.pcap` or `.pcapng` files in the browser
- Parse captures client-side (no backend, no server upload)
- Extract metadata for:
  - source/destination IP
  - source/destination port
  - transport protocol (TCP/UDP/ICMP/ICMPv6)
  - inferred service
  - packet timestamps
  - DNS metadata (basic)
  - TLS metadata (version + SNI when inferable)
  - HTTP metadata (request/status when inferable)
- Visualize traffic as:
  - interactive network graph (D3, zoom/pan/click/double-click focus)
  - timeline/sequence panel
  - sortable flow table
  - details panel for selected packet/flow
- Apply shared dynamic filters across all views:
  - free text
  - IP/source/destination
  - source/destination port
  - protocol
  - service multi-select
  - time-range presets
  - related-traffic mode
- Trace and focus actions:
  - focus on node
  - show related traffic only
  - trace selected flow
  - clear all filters
- Export filtered flows to CSV
- Includes mock demo dataset when no PCAP is loaded

## Tech stack

- Expo
- React Native + React Native Web
- TypeScript
- D3.js
- Zustand
- Browser-native parser implementation (custom)

## Parser strategy and tradeoffs

No backend parser is used.

This MVP uses a custom browser-safe binary parser to avoid Node-only packet tooling:

- Supported containers:
  - PCAP
  - PCAPNG (SHB/IDB/EPB + basic handling for SPB/PB)
- Supported packet layers:
  - Ethernet (DLT 1)
  - Raw IP (DLT 101/228)
  - IPv4 / IPv6
  - TCP / UDP / ICMP / ICMPv6
  - DNS metadata extraction
  - TLS metadata heuristics
  - HTTP metadata heuristics

Not implemented by design (to keep browser robustness):

- Full TCP stream reassembly
- Deep payload decoding across fragmented sessions
- Advanced PCAPNG option decoding (`if_tsresol`, comments, etc.)

This keeps the app stable and responsive for medium-sized captures while still providing reliable metadata-oriented analysis.

## Project structure

- `App.tsx`
- `src/app/NetworkAnalyzerScreen.tsx`
- `src/components/`
- `src/features/upload/`
- `src/features/graph/`
- `src/features/timeline/`
- `src/features/filters/`
- `src/features/flows/`
- `src/lib/parsers/`
- `src/lib/transformers/`
- `src/lib/mock/`
- `src/store/`
- `src/hooks/`
- `src/types/`
- `src/theme/`

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start Expo web:

```bash
npm run web
```

3. Open the browser URL shown by Expo.

## Type check

```bash
npm run typecheck
```

## Notes for performance

- Parsing and transform pipeline are optimized for metadata extraction only.
- Filtered graph/timeline/table are memoized from shared Zustand state.
- Large table is capped in render size to keep UI responsive.
- For very large captures, splitting files or sampling traffic is recommended.

## Browser-only guarantee

- No API calls for parsing
- No backend service
- No database
- All processing runs in-browser
