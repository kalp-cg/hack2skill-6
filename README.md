# SaansSaathi (Breath Companion) — GenAI Urban Air Quality Assistant

> **Chosen Vertical**: **Challenge 6 — Urban Air Quality Assistant**
> A mobile-first, installable Progressive Web App (PWA) and GenAI + Deterministic + RAG assistant built to help Indian families, daily commuters, schools, and RWAs navigate severe winter smog with personalized low-emission routines, indoor air quality hacks, sustainable alternatives, and transparent direct impact math.

---

## 1. Chosen Vertical & Problem Statement Alignment

**Problem Statement**:
> *"Create a GenAI-powered assistant that helps families and communities navigate severe winter smog and urban air pollution. The application should suggest low-emission daily routines, indoor air quality hacks, and sustainable alternatives tailored to their location and lifestyle, while clearly explaining the direct impact of their choices."*

Every feature in **SaansSaathi** maps directly to the five pillars of the problem statement (and is also viewable in-app under **How It Works**):

| Problem Pillar | SaansSaathi Implementation |
| --- | --- |
| **1. Low-Emission Daily Routines** | 5-block daily Smog Plan (`Morning`, `Commute`, `Afternoon`, `Evening`, `Night`), 48-hour cleanest outdoor window highlight, no-idling, wet mopping, streaks & badges. |
| **2. Indoor Air Quality Hacks** | Room-by-room Playbook (`Bedroom`, `Kitchen`, `Kids' Room`), interactive Purifier CADR room calculator (`sq ft × 1.35`), Corsi-Rosenthal DIY MERV-13 filter guide, damp-cloth sealing, and indoor-plant / cloth-mask myth-busting. |
| **3. Sustainable Alternatives** | Commute Comparator (`Car`, `Metro`, `3x Carpool`, `Bus`, `Two-Wheeler`, `Cycle`) in ₹ INR/month, minutes, PM2.5 exposure, and kg CO₂ saved, plus induction cooking swaps & RWA zero waste-burning circles. |
| **4. Location + Lifestyle Personalization** | 60-second 4-step onboarding (browser GPS/city search, kids' ages, elders, asthma/COPD/heart/pregnancy, pets, commute km, WFH days, kitchen fuel, heating, home type, window exposure) + adaptive feedback loop when a user skips an action. |
| **5. Explaining Direct Impact** | **Your Smog Score (0–100)** + 7-day trend, interactive What-If Simulator sliders, `µg/m³ avoided`, `kg CO₂ saved`, `₹ INR saved`, Berkeley Earth cigarette-equivalent (explicitly labeled as an approximation), and an expandable **"How we calculated this"** formulas & assumptions panel. |

---

## 2. Approach & Logic

Most air-quality apps show a static AQI number, while naive LLM wrappers risk hallucinating pollutant numbers, unsafe medical advice, or invented cost/CO₂ math. **SaansSaathi** uses a **5-stage Hybrid Deterministic + RAG + GenAI pipeline**:

```text
+-------------------------------------------------------------------------+
| 1. LIVE DATA LAYER (Free No-Key APIs + Offline & Delhi Severe Fallback) |
|    Open-Meteo Air Quality API (48h PM2.5/PM10/NO2/O3)                   |
|    Open-Meteo Weather API (Temp, RH, Wind, Boundary-Layer Mixing Height)|
|    Browser Geolocation + Open-Meteo / Nominatim Geocoding               |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| 2. SITUATION OBJECT CONTEXT BUILDER (src/utils/saansEngine.ts)          |
|    Merges Household Profile + Live 48h Forecast + Inversion State       |
|    + Skipped/Disliked Action Feedback + Selected Language (EN/HI/GU)    |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| 3. DETERMINISTIC ENGINE (Unit-Tested, Zero Hallucinated Math)           |
|    - Official CPCB National AQI (6 Bands + >300 Smog Emergency Trigger) |
|    - Winter Thermal Inversion & Low Mixing-Height Detection             |
|    - Purifier CADR Formula: Required CADR (m³/h) = Room sq ft × 1.35    |
|    - Commute Cost (INR), Time, Roadside PM2.5 & CO₂ Comparator          |
|    - 24h Inhaled Dose Model (12.5 m³ indoor + 2.5 m³ outdoor)           |
|    - Berkeley Earth Approx.: 22 µg/m³ for 24h (~330 µg) ≈ 1 cigarette   |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| 4. LOCAL MARKDOWN RAG KNOWLEDGE BASE (knowledge-base/*.md + rag.ts)     |
|    - cpcb_aqi_standards.md (CPCB National AQI & Delhi GRAP Stages I-IV) |
|    - who_2021_guidelines.md (WHO 2021 PM2.5/PM10/NO2 limits)            |
|    - mohfw_icmr_smog_advisory.md (Pediatric, Elder & Clinical Red Flags)|
|    - indoor_air_masks_purifiers.md (EPA CADR, DIY MERV-13, N95 fit)     |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| 5. GENAI ORCHESTRATION & GUARDRAILS (server.ts — @google/genai)         |
|    - POST /api/plan: Strict JSON Schema (5 period blocks + citations)   |
|    - POST /api/chat: Multilingual EN/HI/GU grounded chat + voice I/O    |
|    - Medical red-flag escalation (wheezing/chest pain -> see doctor)    |
|    - Automatic retry + resilient fallback on transient upstream 503     |
+-------------------------------------------------------------------------+
```

---

## 3. How the Solution Works

1. **Splash & 60-Second Onboarding**: Users pick **English, हिन्दी, or ગુજરાતી**, complete a 4-step context wizard (or jump straight into **"Demo: Delhi Winter Smog (AQI 386)"** for instant evaluation), and configure a smart alert AQI threshold.
2. **Today Tab & Smog Emergency Mode (`AQI > 300`)**: Displays an animated CPCB AQI ring gauge, PM2.5/PM10/NO₂/O₃, weather & winter thermal inversion alert, Household Protection Radar (kids, elders, asthma/heart/pregnancy, pets), 48-hour forecast chart with **"Best outdoor window"**, and a 1-tap red **Smog Emergency Mode** checklist.
3. **Plan Tab (Daily Plan + Indoor Hacks + Sustainable Commute)**: Users generate or inspect their 5-block daily plan, tap any action to open the **Action Bottom Sheet** (Why, Engine Impact, Citation, Thumbs Up/Down, **Do It Now** with confetti + streak + Smog Score bump, or **Skip** to adapt the plan), size purifiers with the **CADR Calculator**, bust indoor-plant & cloth-mask myths, and compare commute modes in ₹ INR, minutes, PM2.5, and CO₂.
4. **Impact Tab (Your Smog Score + What-If Simulator)**: Interactive sliders for commute mode, purifier hours, N95 mask compliance, and clean cooking/sealing recalculate 24h inhaled PM2.5 dose, `"If you do these 3 things, you cut X% exposure"`, cigarette-equivalent approximation, and monthly ₹ INR / CO₂ savings in real time, backed by an expandable **"How we calculated this"** panel.
5. **Ask Tab (Multilingual Grounded Chat + Voice)**: Powered by Gemini + local RAG with Web Speech API voice input and text-to-speech playback (`en-IN`, `hi-IN`, `gu-IN`), displaying data source, timestamp, confidence, RAG citations, and a persistent medical disclaimer.
6. **Community Tab**: Join or create Family, RWA, or School circles, track aggregated anonymous CO₂ and exposure reduction, compete on weekly challenges, earn badges, and download a one-tap **WhatsApp Impact Card PNG** generated via HTML5 Canvas.

---

## 4. Assumptions Made

| Domain | Formula / Assumption | Source / Rationale |
| --- | --- | --- |
| **AQI Standard** | Indian CPCB National AQI (governing max of PM2.5 & PM10 sub-indices, 0–500) | Central Pollution Control Board (CPCB) India |
| **24h Breathing Dose** | `Daily Inhaled PM2.5 (µg) = (Indoor PM2.5 × 12.5 m³) + (Commute PM2.5 × (1 − MaskEff) × 2.5 m³)` | 15 m³/day adult breathing volume (20h indoor, 4h commute/outdoors); fitted N95 real-world filtration = 85% |
| **Cigarette-Equivalent** | `Cigarettes/week ≈ (Daily Inhaled PM2.5 Avoided × 7) ÷ 330 µg` | Berkeley Earth rule of thumb (~22 µg/m³ for 24h ≈ 1 cigarette); explicitly labeled as an epidemiological approximation |
| **Purifier CADR Sizing** | `Required CADR (m³/h) = Room Area (sq ft) × 1.35` | Targets 4.8–5 Air Changes per Hour (ACH) for standard 8.5 ft Indian apartment ceilings |
| **Urban Mobility Benchmarks** | Petrol car `₹11.5/km, 175g CO₂/km`; Metro `₹3.2/km, 28g CO₂/km`; 3x Carpool `₹4.0/km, 58g CO₂/km`; AC/CNG Bus `₹2.2/km, 42g CO₂/km` | Indian urban transit fuel & lifecycle emission averages |
| **Community Storage** | Server-side in-memory store capped at 50 circles × 20 leaderboard entries (seeded with RWA, School & Family groups) | Zero-setup demo reliability without external DB credentials. On Vercel each serverless instance keeps its own copy, so community changes are best-effort and reset on cold start. |
| **AI Availability** | If Gemini is unavailable or rate-limited, the app keeps working on the deterministic engine plan | All safety-critical numbers come from the engine, not the LLM |

---

## 5. Engineering Standards (Security, Efficiency, Testing & Accessibility)

- **Code Quality**: Strict TypeScript (`tsc --noEmit` with 0 errors), clean separation between pure deterministic domain logic (`src/utils/saansEngine.ts`), the Express API (`src/server/app.ts` — a `createApp()` factory shared by the local server, Vercel function and tests), security/caching/RAG helpers (`src/server/*`), and modular React components (`src/components/saans/*`).
- **Security**:
  - Server-side Gemini API proxy (`src/server/app.ts`) — API keys never enter browser bundles or UI.
  - Defense-in-depth HTTP headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-Powered-By` disabled).
  - Strict input validation & sanitization (`src/server/security.ts`): geographic coordinate bounds, query/message/name length caps, control-character & HTML tag stripping, `32kb` JSON body cap, 16 KB cap on the situation context sent to the model, `AbortController` fetch timeouts on all external calls.
  - Spoof-resistant, memory-bounded sliding-window rate limiter on AI & mutation routes: the client IP comes from Express `trust proxy` (0 hops locally, 1 on Vercel), so a forged `X-Forwarded-For` cannot reset a bucket.
  - Prompt-injection hardening: the client-built situation object and chat history are labelled as untrusted data in both the system prompt and the user prompt.
  - JSON error handler: malformed or oversized bodies return `{ "error": ... }` with no stack trace.
- **Efficiency**:
  - Bounded `O(1)` TTL + LRU in-memory caches (`src/server/cache.ts`) for `/api/aqi` (10 min per grid cell) and `/api/geocode` (30 min), plus module-cached RAG chunks.
  - Offline-first PWA (`vite-plugin-pwa` Workbox caching + `localStorage` cache of last telemetry and plan) built for 3G networks.
  - Code-split bundle: secondary tabs load on demand via `React.lazy`, and React / charting libraries ship as long-lived vendor chunks (app code ≈ 28 KB gzip).
  - Lean repository footprint (≈ 2.3 MB excluding `node_modules`).
- **Testing & Automated Evaluation**:
  - **25 / 25 automated tests passing** (`npm test`):
    - *Engine & helpers (15)*: CPCB breakpoints, inversion detection, CADR sizing, commute savings, What-If exposure math, adaptive plan swaps, coordinate/text validation, sliding-window rate limiter, TTL LRU cache eviction, RAG citation accuracy.
    - *HTTP API (10, fully offline)*: security headers, input validation, 32 KB body cap, malformed-JSON handling, oversized situation rejection, missing-key 503, bounded leaderboard, and a regression test proving a spoofed `X-Forwarded-For` cannot bypass the rate limiter.
  - **15-scenario evaluation harness** checking Schema, Safety Guardrails, Numeric Consistency and RAG Grounding across 15 diverse Indian household personas:
    - `npm run eval` — runs the checks on the deterministic engine plan (offline, CI-safe).
    - `npm run eval -- --live` — runs the **same checks on real Gemini-generated plans** (requires `GEMINI_API_KEY`).
  - The Gemini response schema itself enforces exactly 5 plan blocks and exactly 3 top actions.
- **Accessibility**:
  - Automated axe-core WCAG 2 A/AA audit of every tab: 0 violations.
  - WCAG-oriented keyboard & screen-reader support: **Skip to main content** link, semantic landmarks (`<header>`, `<nav>`, `<main>`), `aria-live="polite"` status announcements, `Escape`-key dismissal on all dialogs/bottom sheets, `>=44px` mobile touch targets, plus built-in **Dark Mode**, **Large Text**, and **High Contrast** toggles.

---

## 6. Local Setup & Verification Commands

```bash
# 1. Install dependencies
npm install

# 2. Configure GEMINI_API_KEY in .env (copy from .env.example)
cp .env.example .env

# 3. Start full-stack dev server (http://localhost:3000)
npm run dev

# 4. Run tests, 15-scenario eval harness, type check, and production build
npm test
npm run eval            # add `-- --live` to evaluate real Gemini plans
npm run lint
npm run build
```

### Deploying to Vercel

The repo is Vercel-ready (`vercel.json`): Vite builds the PWA into `dist/`, and `api/index.ts` exposes the same Express app as a serverless function for every `/api/*` route (the `knowledge-base/` files are bundled with it for RAG).

```bash
npx vercel link
npx vercel env add GEMINI_API_KEY production
npx vercel --prod
```

---

## 7. 3-Minute Live Demo Script

1. **0:00 – 0:30 | Splash & 1-Tap Delhi Severe Smog Demo**: Switch language (`English` / `हिन्दी` / `ગુજરાતી`) and click **"Demo: Delhi Severe Smog (AQI 386)"**.
2. **0:30 – 1:05 | Today Tab & Emergency Mode**: Highlight the AQI 386 ring, Severe Thermal Inversion (~210 m mixing height), 48-hour forecast dip (`13:00–15:00`), Household Risk Radar, and **Smog Emergency Mode**.
3. **1:05 – 1:45 | AI Daily Plan, Indoor Hacks & Feedback Loop**: Click **Personalize with AI**, open an action in the Bottom Sheet, tap **Do It Now** (confetti + live Smog Score jump), then inspect the Room-Wise CADR calculator, myth-busters, and Commute Comparator.
4. **1:45 – 2:25 | Impact Lab & Multilingual Voice Chat**: Adjust What-If sliders on **Impact**, expand **"How we calculated this"**, then ask **Ask SaansSaathi** `"Which purifier CADR for a 120 sq ft bedroom?"` to see exact engine math (`162 m³/h`) + RAG citations.
5. **2:25 – 3:00 | Community Mode & How It Works**: Download a **WhatsApp Impact Card PNG**, toggle **Dark Mode**, and open **How It Works** to show the 5-pillar mapping and visible AI architecture.
