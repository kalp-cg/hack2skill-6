# SaansSaathi — 5-Slide Pitch Deck Outline & 3-Minute Demo Script

---

## Slide 1: The Crisis — Winter Smog Is a Daily Family Decision Problem
- **Headline**: 500M+ North Indian urban residents face AQI 300–450 every winter, yet existing air apps only show a red number.
- **The Gap**: Parents, commuters, elders, and RWAs don't need another AQI speedometer—they need to know *at 7 AM*:
  - *"Can my 6-year-old asthmatic child go to school today?"*
  - *"When is the exact 2-hour window to open windows?"*
  - *"How much PM2.5, CO₂, and ₹ INR do I actually save by taking the Metro and running a DIY filter?"*
- **Solution**: **SaansSaathi (Breath Companion)** — a mobile-first, multilingual (EN / हिन्दी / ગુજરાતી) GenAI + Deterministic + RAG assistant built for Indian homes and communities.

---

## Slide 2: Product Experience — 5 Features Mapped to the 5 Challenge Pillars
1. **Location + Lifestyle Personalization**: 60-second 4-step setup (GPS/city, kids' ages, elders, asthma/COPD/heart/pregnancy, pets, commute km, WFH, kitchen fuel, floor, window exposure).
2. **Live Air + Smog Emergency Mode (>300 AQI)**: Animated CPCB AQI ring, winter thermal inversion / low mixing-height alert, 48-hour forecast with **"Best outdoor window"**, and one-tap red Emergency Mode.
3. **AI Daily Plan + Indoor Air Hacks Engine**: 5-block daily routine (`Morning` → `Night`) with tap-to-complete confetti, adaptive plan swaps on Skip, Room-Wise Playbook (`Bedroom`, `Kitchen`, `Kids' Room`), interactive CADR calculator (`sq ft × 1.35`), and myth-busting (indoor plants & cloth masks).
4. **Sustainable Alternatives + Direct Impact Explainer**: Commute Comparator (`Car` vs `Metro` vs `Carpool` vs `Bus` vs `Cycle` in ₹ INR, mins, PM2.5 & CO₂), **Your Smog Score (0–100)**, interactive What-If Simulator, Berkeley Earth cigarette-equivalent approximation, and expandable **"How we calculated this"** formulas.
5. **Multilingual Voice Assistant + Community Circles**: Grounded EN/HI/GU chat + Web Speech voice I/O, Family/RWA/School leaderboards, streaks/badges, and one-tap **WhatsApp Impact Card PNG**.

---

## Slide 3: Why Judges Can Trust the AI — Deterministic + RAG Architecture
- **No Hallucinated Math**: A pure TypeScript deterministic engine computes CPCB AQI, mixing-height inversions, CADR (`sq ft × 1.35`), INR/CO₂ transit savings, and 24-hour inhaled PM2.5 dose *before* the LLM speaks.
- **Grounded Local Knowledge Base (RAG)**: Retrieves exact sections from CPCB National AQI & GRAP, WHO 2021 Air Quality Guidelines, MoHFW/ICMR Smog Advisories, and US EPA Indoor Air/CADR docs.
- **Strict Structured Output & Safety Guardrails**: Gemini outputs schema-validated JSON plans with citations and automatically escalates clinical red flags (wheezing, chest pain, breathing trouble) to immediate medical care.
- **Offline-First PWA**: Works on 3G/offline via Workbox service worker + cached last AQI/plan, Large Text, High Contrast, and Dark Mode.

---

## Slide 4: Automated Verification & Quantified Impact
- **15-Scenario Evaluation Harness (`scripts/eval.ts`)**: **15 / 15 passed** across Severe Delhi Smog, Pediatric Asthma, Biomass Kitchen, 18 km Commuter, Skipped-Action Adaptation, 120 sq ft CADR Sizing, Myth-Busting, Hindi/Gujarati contexts, and Clinical Red-Flag Safety.
- **9 / 9 Unit Tests Passed**: Verified deterministic math invariants across CPCB breakpoints, inversion triggers, and exposure dose drops.
- **Tangible Household Impact (Demo Delhi Severe Day, AQI 386)**:
  - Combining **Metro/Carpool + 12h Purifier/Seal + 90% N95** cuts daily inhaled PM2.5 by **~65–74%** (~5–7 cigarette-equivalents avoided/week), saves **₹3,000–₹4,500/month** on solo petrol driving, and avoids **70–100+ kg CO₂/month** per commuter.

---

## Slide 5: Community Scale & Roadmap
- **Collective Action Multiplier**: RWAs and School Parent Circles aggregate anonymous CO₂ saved and exposure reduction, driving habit adherence through weekly challenges (Zero Waste-Burning, No-Idling School Gates) and viral WhatsApp Impact Cards.
- **Next 90 Days**:
  - Hyperlocal CPCB/WAQI station & low-cost BLE indoor sensor pairing.
  - Scheduled Web Push notifications for overnight GRAP Stage III/IV escalations.
  - Persistent cloud database for inter-RWA and inter-school city-wide Clean Air Leagues across Delhi NCR, Ahmedabad, Lucknow, and Kolkata.

---

## 3-Minute Live Demo Script (Judge Walkthrough)
- **0:00–0:30**: Start on Splash screen → switch language (`EN / हिन्दी / ગુજરાતી`) → tap **"Demo: Delhi Severe Smog (AQI 386)"**.
- **0:30–1:05**: Show **Today** tab (AQI 386 gauge, Severe Thermal Inversion at 210 m, 48h forecast chart, Household Risk Radar) → open **Smog Emergency Mode**.
- **1:05–1:45**: Tap **Personalize with AI** → open Action Bottom Sheet (`Why / Impact / Citation`) → tap **Do It Now** (confetti + Smog Score bump) → inspect **Plan** tab (CADR calculator, myth-busters, commute INR/CO₂ table).
- **1:45–2:25**: Open **Impact** tab → move What-If sliders to show real-time `% exposure cut` & cigarette-equivalent math → expand **"How we calculated this"** → ask **Ask** tab a grounded question (`"Which purifier CADR for a 120 sq ft bedroom?"`).
- **2:25–3:00**: Open **Community** tab → generate & download **WhatsApp Impact Card PNG** → toggle **Dark Mode** → open **How It Works** modal to show the 5-pillar mapping and visible AI architecture.
