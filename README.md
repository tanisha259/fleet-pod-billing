# Fleet POD Capture & Tally Billing Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![DPDP Act 2023](https://img.shields.io/badge/Compliance-DPDP_Act_2023-10b981.svg)]()

> **End-to-End Proof-of-Delivery (POD) Capture, AI Stamp/LR Verification, and Tally ERP Billing Automation for Road Transport Fleets.**  
> Built for **Company A** (Chhatrapati Sambhajinagar, Maharashtra) — operating 340 owned and hired trucks across cement, steel, and packaged goods corridors.

---

## 📌 Executive Summary & Problem Solved

Company A runs **2,200 trips per month** at an average freight of **₹32,000/trip** (**₹84.48 Crore annual revenue**).

* **The Problem**: Deliveries take place up to 800+ km away. Physical paper Lorry Receipts (LRs) took **10–20 days (average: 18 days)** to return via trucks. Billing in Tally halted because clients reject invoices without signed/stamped PODs, tying up **₹3.24 Crore in working capital** costing **₹38.9 Lakh/year in interest at 12%**. Furthermore, **1.5% of PODs (396 trips/year)** were lost or disputed, destroying **₹63.36 Lakh/year**.
* **Total Annual Value Leakage**: **₹1.02 Crore / year**.
* **The Solution**: Reduces POD turnaround from **18 days down to 4 days**, captures **≥ 80% of PODs within 24 hours**, and cuts disputes down from **1.5% to < 0.5%**.

---

## 🚀 Key Features

### 1. Ultra-Minimal Driver Mobile Web App (`/` and `/driver/[token]`)
* **Designed for Low Literacy**: One massive emerald camera button, high-contrast visual cues (green for verified, amber for retake), and zero textual forms.
* **Bilingual Voice Guidance**: Instant synthesized voice prompts in **Marathi** (*"कृपया पावतीचा फोटो काढण्यासाठी हिरवे बटण दाबा"*) and **Hindi** (*"कृपया बिल्टी / पावती का फोटो खींचने के लिए हरा बटन दबाएं"*).
* **Highway Dead-Zone Offline Capture**: Captures photos with GPS coordinates and ISO timestamps locally via browser storage/IndexedDB; automatically syncs once 4G/2G network restores.
* **Strict Payload Compression (< 300 KB)**: In-browser HTML5 Canvas compression guarantees crisp OCR readability of stamps/signatures while keeping payloads under 300 KB for rural networks.
* **Zero-Install Link for Hired Drivers**: Tokenized SMS web links for third-party truck drivers with zero app store installation friction.

### 2. AI Vision Quality & Document Inspection Engine
* **Multi-Factor Document Check**:
  * Cross-references Lorry Receipt (LR) number against trip manifest & 12-digit e-way bill.
  * Consignee official rubber stamp presence and ink clarity.
  * Consignee authorized signature presence.
  * Physical pen marks detecting shortage or transit damage.
* **DPDP Act 2023 Privacy Compliance**: Consignee personal names and telephone numbers are automatically redacted and masked (`+91 98****3210`, `S. K****** (Warehouse Mgr)`).
* **Retake Escalation Policy**: Retakes for blurry or obscured stamps are **strictly capped at 2 attempts**. Third attempts escalate to the human review queue.
* **Human-in-the-Loop Source of Truth**: Low-confidence or shortage receipts route to human clerks. Invoices are never dispatched without verification.

### 3. Operations & Billing Executive Portal
* **Review Queue**: Side-by-side inspection comparing raw physical POD images against AI-extracted fields with 1-click Approve, Edit, or Retake triggers.
* **Tally ERP 9 / Prime XML Exporter**: Multi-trip batching that generates standard XML sales vouchers with attached POD digital audit links.
* **Executive Turnaround Dashboard**: Real-time tracking of branch performance (Sambhajinagar HQ, Pune Hub, Nagpur & Vidarbha), aging dispatches (> 24 hours), and unlocked capital metrics.
* **Client Shareable Link**: Secure, tokenized, read-only digital proof link for consignors (`/pod-view/[id]`).
* **Daily Trip Import**: Simulates daily dispatches with vehicle, client, and e-way bill generation.

---

## 📊 Sample Data (Pre-Seeded)

The application comes pre-loaded with realistic production data:

| Trip ID | Client | Vehicle | Destination | Freight (₹) | Status | Key Feature Demonstrated |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TRP-66120** | Company B (cement) | `MH20 EL 4521` | Nagpur | ₹38,500 | **Verified** | Clean stamp & signature, ready for Tally export |
| **TRP-66134** | Company C (steel) | `MH20 GT 7718` | Pune | ₹26,000 | **Retake requested** | Stamp obscured; prompts driver retake (attempt 1/2) |
| **TRP-66141** | Company D (packaged foods) | `MH17 BY 3092 (hired)` | Indore | ₹41,200 | **Needs review** | Transit damage remark noted; routed to human review |
| **TRP-66148** | Company B (cement) | `MH20 EL 4902` | Nashik | ₹22,500 | **Pending Capture** | En-route delivery awaiting driver photo capture |
| **TRP-66152** | Company C (steel) | `MH15 BB 6100 (hired)` | Mumbai | ₹34,000 | **Pending Capture** | Hired driver SMS upload token demo |

---

## 🛠️ Tech Stack & Architecture

* **Frontend & Backend**: Next.js 14 (App Router) + TypeScript
* **Styling & UI**: Tailwind CSS + Lucide Icons
* **Audio & Synthesis**: Web Speech Synthesis API (`mr-IN` & `hi-IN`)
* **Storage & Persistence**: Embedded Document Store + Client IndexedDB / LocalStorage queue
* **Testing**: Automated Node.js Test Suite verifying DPDP masking, compression constraints, retake limits, and ROI economics

---

## ⚡ Quick Start (Local Setup)

```bash
# 1. Clone repository
git clone https://github.com/tanisha259/fleet-pod-billing.git
cd fleet-pod-billing

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

### Run Automated Tests
```bash
npm test
```

---

## 📂 Project Structure

```
fleet-pod-billing/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── billing/export-tally/   # Tally XML voucher generator
│   │   │   └── trips/                  # Trip fetch, update, and capture endpoints
│   │   ├── driver/[token]/             # Hired driver SMS upload view
│   │   ├── pod-view/[id]/              # Read-only client digital POD view
│   │   ├── layout.tsx                  # Global root layout
│   │   └── page.tsx                    # Main portal with role switcher
│   ├── components/
│   │   ├── BillingPortalView.tsx       # Review queue, Tally export & dashboard
│   │   └── DriverCaptureView.tsx       # Driver mobile UI with voice prompts
│   ├── data/
│   │   └── trips.ts                    # Sample seed data
│   ├── lib/
│   │   ├── aiEngine.ts                 # AI inspection & DPDP 2023 masking
│   │   ├── db.ts                       # Document persistence
│   │   └── driverUtils.ts              # Audio prompts & <300KB compression
│   └── types/
│       └── trip.ts                     # Type definitions
├── Technical_Design_Document.md        # Complete Architecture & Design Document
├── deployment.md                       # Deployment & reviewer demo instructions
├── test.js                             # Automated verification test suite
└── package.json
```

---

## 📄 Submission Files

* **Technical Design Document**: [`Technical_Design_Document.md`](./Technical_Design_Document.md)
* **Deployment Guide**: [`deployment.md`](./deployment.md)
* **Pre-Packaged ZIP**: `submission.zip` (contains `Technical_Design_Document.md` and `deployment.md`)
