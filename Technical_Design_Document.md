# Technical Design Document (TDD)
## Road Transport Fleet Proof-of-Delivery (POD) Capture & Billing System

**GitHub Repository**: `https://github.com/your-username/logistics-pod-billing` *(replace with your public repository URL)*  
**Live Application URL**: `http://localhost:3000` *(or Vercel deployment link)*  
**Client**: Company A (Chhatrapati Sambhajinagar, Maharashtra)  
**Author**: Engineering Candidate  
**Date**: November 2026  

---

## 1. Executive Summary & Problem Analysis

Company A operates a full-truckload transportation fleet of 140 owned trucks and 200 hired trucks, handling 2,200 trips per month with an average freight value of ₹32,000 per trip (₹84.48 Crore annual revenue).

### The Financial & Operational Bottleneck
1. **Working Capital Drag**:
   - Deliveries span distances up to 800+ km away. Drivers historically carry physical signed Lorry Receipts (LR) back over 10–20 days (average: **18 days**).
   - Invoicing in Tally ERP halts until the physical stamped POD is physically submitted.
   - Reducing POD-to-invoice time from 18 days to 4 days pulls working capital forward by 14 days:
     $$\text{Working Capital} = \frac{₹84.48\text{ Cr} \times 14}{365} = ₹3.24\text{ Crore}$$
   - At a 12% working capital borrowing cost, this delay inflicts **₹38.9 Lakh/year** in avoidable interest expense.

2. **POD Discrepancies & Revenue Leakage**:
   - 1.5% of trips (396 trips/year) result in lost, water-damaged, or disputed PODs.
   - Disputed trips forfeit an average of 50% freight value ($396 \times ₹16,000 = ₹63.36\text{ Lakh/year}$).
   - Combined annual financial loss: **₹1.02 Crore / year**.

### Project Scope & Target KPIs
* **Budget**: ₹7.5 Lakh | **Timeline**: 6 weeks
* **Target 1**: ≥ 80% of PODs captured in the system within 24 hours of delivery.
* **Target 2**: POD-to-invoice cycle reduced from 18 days to 4 days.
* **Target 3**: Lost/disputed POD rate dropped from 1.5% to < 0.5%.

---

## 2. Architecture & Design Rationale

```
+-----------------------------------------------------------------------------------+
|                           CLIENT TIER (Adaptive UI)                                |
|  +-------------------------------------+  +------------------------------------+  |
|  |       Driver Web App / SMS Link     |  |     Billing & Operations Portal    |  |
|  | - One-big-button camera capture     |  | - Side-by-side AI inspection queue |  |
|  | - Hindi/Marathi voice prompts       |  | - Multi-trip Tally XML exporter    |  |
|  | - IndexedDB offline store           |  | - Branch turnaround & aging alerts |  |
|  | - HTML5 Canvas compression < 300KB |  | - DPDP 2023 Masking Inspector      |  |
|  +-------------------------------------+  +------------------------------------+  |
+------------------------------------------+----------------------------------------+
                                           | HTTPS REST APIs
+------------------------------------------v----------------------------------------+
|                            APPLICATION & LOGIC TIER                               |
|  - Next.js 14 API App Router (Server-side rendering & route handlers)             |
|  - Vision AI Inspection Engine (Stamp, Signature, LR match, Remarks detector)    |
|  - Retake Escalation Policy Controller (Enforces max 2 retakes rule)              |
|  - DPDP Act 2023 Data Anonymization Engine                                        |
|  - Tally ERP 9 / Prime XML Voucher Generator with UDF Digital Attachments         |
+------------------------------------------+----------------------------------------+
                                           | Persistence
+------------------------------------------v----------------------------------------+
|                                DATA STORAGE TIER                                  |
|  - Structured Document Store (Trips, Dispatches, e-Way Bills, Audit Trails)       |
|  - Client-side LocalStorage / IndexedDB for Highway Dead Zone Queue               |
+-----------------------------------------------------------------------------------+
```

### Architectural Decisions & Rationale
1. **Next.js 14 (App Router) + TypeScript**:
   * *Rationale*: Unifies the driver mobile interface and the high-throughput desktop billing portal under a single build and execution context. Provides server-rendered API endpoints without requiring heavy microservice orchestration.
2. **Offline-First Driver Capture (IndexedDB / LocalStorage)**:
   * *Rationale*: Long-haul transit routes (e.g., Sambhajinagar to Nagpur or Indore) frequently feature network dead zones near rural consignee warehouses. Offline caching captures high-resolution sensor input immediately, stamping GPS coordinates and syncing automatically once connectivity returns.
3. **Client-Side Canvas Compression (< 300 KB)**:
   * *Rationale*: Eliminates server bandwidth congestion on 2G/3G networks. Images are compressed dynamically to `< 300 KB` at `1400px` resolution, ensuring stamp ink, signatures, and pen annotations remain razor-sharp while staying lightweight.
4. **Zero-Install Direct SMS Links for Hired Drivers**:
   * *Rationale*: Over 200 trucks in Company A's network are hired external vehicles whose drivers resist installing third-party mobile applications. Tokenized web links sent via SMS enable 1-tap capture without app installations or passwords.

---

## 3. Data Model & Field Specifications

### Core Data Schema

| Entity | Field | Type | Description |
| :--- | :--- | :--- | :--- |
| **Trip** | `id` | String | Unique identifier (e.g., `TRP-66120`) |
| | `lrNumber` | String | Lorry Receipt identifier (e.g., `LR-88412`) |
| | `ewayBill` | String | Government 12-digit e-way bill number |
| | `client` | String | Consignor name (e.g., `Company B (cement)`) |
| | `vehicle` | String | Vehicle registration number (`MH20 EL 4521`) |
| | `freightAmount`| Number | Agreed freight in INR |
| | `status` | Enum | `Pending Capture` \| `Retake requested` \| `Needs review` \| `Verified` \| `Billed` |
| | `retakeCount` | Number | Integer counter (strictly capped at 2) |
| | `branch` | String | Operating branch (Sambhajinagar, Pune, Nagpur) |
| **POD Metadata** | `podImage` | String | Base64 / Storage path of compressed receipt |
| | `podFileSizeKB`| Number | Document payload size (verified `< 300 KB`) |
| | `podGps` | Object | `{ lat, lng, timestamp }` recorded at gate |
| **AI Extraction**| `lrNumberMatch`| Boolean | True if extracted LR matches trip manifest |
| | `consigneeStampPresent`| Boolean | True if consignee rubber stamp detected |
| | `stampConfidence` | Number | Detection confidence percentage |
| | `consigneeNameMasked` | String | Masked consignee name (DPDP Act 2023) |
| | `consigneePhoneMasked`| String | Masked telephone number (DPDP Act 2023) |
| | `damageOrShortageRemarks` | String | Pen remarks regarding transit damage/shortage |

---

## 4. AI Vision Verification & Human-in-the-Loop Workflow

### The AI Inspection Pipeline
The AI engine does not act as a silent black-box. The physical POD image remains the immutable **source of truth**.

```
   [ Driver photographs POD at Consignee Gate ]
                        |
                        v
       [ Client Compresses Payload < 300 KB ]
                        |
                        v
          [ AI Multi-Factor Document Check ]
            - LR Number match against Trip & e-Way Bill
            - Consignee official stamp presence & ink clarity
            - Authorized signature presence
            - Handwritten shortage/damage remarks
                        |
       +----------------+----------------+
       |                                 |
[ Stamp Missing / Glare ]      [ Damage / Shortage Notes ] OR
       |                       [ Low Confidence (<70%) ]   OR
       |                       [ Retakes >= 2 ]
       v                                 |
 [ Is Retake Count < 2? ]                v
    |                |             [ Route to Human Review Queue ]
   YES               NO                  |
    |                |                   v
    v                +-----> [ Billing Executive Inspects & Corrects ]
[ Voice Prompt: "Retake" ]               |
[ (Hindi / Marathi) ]                    v
                              [ 1-Click Verification / Approval ]
                                         |
                                         v
                         [ Batch Export to Tally XML Voucher ]
```

### Edge Cases Handled:
1. **Unclear or Missing Stamp**: Triggers immediate voice prompt in driver's chosen language (Hindi or Marathi). Capped strictly at 2 retakes to prevent driver frustration at the gate.
2. **Third Retake Escalation**: If the stamp remains unreadable after 2 retakes, status shifts automatically to **Needs review** for human intervention.
3. **Shortage or Damage Remarks**: If consignee receiver notes shortages (e.g., *"4 cartons soaked"*), the AI marks `hasRemarks: true` and flags the trip for review. Invoices are never sent out automatically with unresolved shortages.
4. **DPDP Act 2023 Compliance**: Consignee contact details and personnel names are systematically masked (`+91 98****3210`, `S. K******`) to prevent personal data exposure in compliance with India's Digital Personal Data Protection Act 2023.

---

## 5. UI/UX Decisions for Semi-Literate Drivers & Billing Clerks

### Driver Mobile Interface (Zero-Clutter)
* **One Big Action Button**: A massive emerald capture button dominates the viewport. No text input, no keyboards, and no dropdowns.
* **Audio-First Feedback**: Real-time voice prompts in Marathi (*"कृपया पावतीचा फोटो काढण्यासाठी हिरवे बटण दाबा"*) and Hindi (*"कृपया बिल्टी / पावती का फोटो खींचने के लिए हरा बटन दबाएं"*).
* **Color Psychology**: Green for verified completion, warm amber for retake requests, eliminating textual confusion.

### Billing Executive Portal
* **High-Density Keyboard-Friendly Layout**: Side-by-side inspection viewing original POD receipt alongside AI extracted fields.
* **Multi-Trip Invoicing**: 1-click batch selection to group verified deliveries by client cycle and export structured Tally XML vouchers with attached POD hyperlinks.
* **Turnaround Analytics**: Real-time dashboard showing branch-wise unbilled pipelines, average POD capture turnaround, and 24-hour dispatch aging alerts.

---

## 6. Scope Boundaries & Future Roadmap

### Features Cut for V1 (Explicit Trade-Offs)
* **Live In-Transit GPS Tracking**: Omitted to conserve mobile battery on driver phones and focus development on delivery-gate POD capture.
* **Full Fuel & Expense Accounting**: Excluded as Company A already maintains dedicated ledger workflows for vehicle maintenance.
* **Automated Consignee Invoicing Without Human Review**: Intentionally excluded to guarantee zero customer billing disputes.

### Future Enhancements (Phase 2 Roadmap)
1. **Direct Tally Prime ODBC Connector**: Automated two-way sync directly into local Tally instances via TCP/IP.
2. **WhatsApp Bot Fallback**: Webhook integration for drivers preferring WhatsApp upload with automated visual check responses.
3. **Automated WhatsApp Payment Reminders**: Once Tally invoice is posted, automated client reminders with verified POD proof attachments.

---

## 7. Assumptions Log

| # | Assumption Description | Impact on Architecture |
| :- | :--- | :--- |
| **A1** | Consignee acknowledgment requires an inked rubber stamp and signature on the physical LR. | AI inspection specifically trains on ink hue contrast and seal geometry. |
| **A2** | Invoices generated in Tally require verified proof attachments to prevent client invoice rejection. | Tally XML exporter incorporates non-repudiable POD links in voucher narration and UDF metadata. |
| **A3** | Hired drivers will not install native applications from app stores. | Responsive web link architecture delivered via lightweight SMS tokens without login requirements. |
