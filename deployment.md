# Deployment and Execution Guide

## Road Transport Fleet Proof-of-Delivery (POD) Capture & Billing Application
**Client**: Company A (Chhatrapati Sambhajinagar, Maharashtra)  
**Industry**: Full-truckload transporter for cement, steel, and packaged goods  

---

## 1. How to Run Locally (Step-by-Step)

### Prerequisites
* **Node.js**: v18.17.0 or higher (Tested on Node.js v20+ / v24)
* **npm**: v9.0.0 or higher
* Modern web browser (Chrome, Edge, or Safari with Web Speech and HTML5 Canvas support)

### Installation & Launch Steps

1. **Clone or Extract the Project Directory**:
   ```bash
   cd project
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run the Development Server**:
   ```bash
   npm run dev
   ```

4. **Access the Application**:
   Open [http://localhost:3000](http://localhost:3000) in your web browser.

5. **Run the Automated Test Suite**:
   ```bash
   npm test
   ```
   *Validates DPDP Act 2023 data masking, image payload compression (<300 KB limit), 2-retake escalation policies, and financial ROI mathematics.*

---

## 2. Reviewer Demo Accounts & Access Points

The application features an integrated top navigation bar that enables immediate 1-click role toggling without cumbersome authentication gates:

| Role | Access URL | Features Demonstrated |
| :--- | :--- | :--- |
| **Billing & Operations Executive** | `http://localhost:3000` (Default View) | AI POD verification queue, side-by-side inspection, Tally XML sales invoice export, missing POD aging dashboard, and trip import. |
| **Driver (In-Cab Mobile Web)** | `http://localhost:3000` (Switch to Driver View) | Minimal one-big-button UI, Hindi & Marathi voice prompts, GPS & timestamp stamp, auto-compression (<300 KB), and offline highway dead-zone sync. |
| **Hired Driver (Direct SMS Link)** | `http://localhost:3000/driver/token-66141` | Standalone zero-install upload interface for third-party hired vehicle drivers. |
| **Consignee / Client Portal** | `http://localhost:3000/pod-view/TRP-66120` | Tokenized read-only digital POD proof with consignee privacy masking. |

### Included Seed Data (from Problem Statement):
* **TRP-66120** (Company B - Cement): Vehicle `MH20 EL 4521`, Nagpur, ₹38,500 – *Status: Verified*
* **TRP-66134** (Company C - Steel): Vehicle `MH20 GT 7718`, Pune, ₹26,000 – *Status: Retake requested (Stamp not visible)*
* **TRP-66141** (Company D - Packaged Foods): Vehicle `MH17 BY 3092 (Hired)`, Indore, ₹41,200 – *Status: Needs review (Shortage/damage note on receipt)*
* **TRP-66148 & TRP-66152**: Pending dispatches awaiting driver capture.

---

## 3. Production Deployment Guide

### Deployment to Vercel (Recommended 1-Click Platform)
1. Push repository to GitHub.
2. Link the repository to [Vercel](https://vercel.com).
3. Framework Preset: **Next.js**.
4. Root Directory: `./`.
5. Deploy.

### Deployment with Docker / Node Server
```dockerfile
FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 4. Environment Variables Reference

*(Names only, as mandated by the brief)*

| Variable Name | Required | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | Optional | Set to `production` for optimized static page serving |
| `PORT` | Optional | Port number for the web server (defaults to `3000`) |
| `NEXT_PUBLIC_APP_URL` | Optional | Canonical URL for generating external SMS and client share links |
| `GEMINI_API_KEY` | Optional | Google Gemini Vision API key for live multimodal visual extraction (Heuristic AI fallback operates out-of-the-box if omitted) |
