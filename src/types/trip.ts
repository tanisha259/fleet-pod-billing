export type TripStatus = 'Pending Capture' | 'Retake requested' | 'Needs review' | 'Verified' | 'Billed';

export interface Trip {
  id: string; // e.g. TRP-66120
  lrNumber: string; // Lorry Receipt No e.g. LR-99214
  ewayBill: string; // 12-digit e-way bill number
  client: string; // e.g. Company B (cement)
  vehicle: string; // e.g. MH20 EL 4521
  origin: string; // e.g. Chhatrapati Sambhajinagar
  destination: string; // e.g. Nagpur
  freightAmount: number; // in INR
  status: TripStatus;
  remarks?: string;
  driverName: string;
  driverPhone: string;
  isHired: boolean;
  smsUploadToken: string; // unique token for hired drivers upload link
  createdDate: string;
  deliveryDate?: string;
  podCaptureDate?: string;
  branch: string; // e.g. Sambhajinagar, Pune, Nagpur
  
  // POD Data
  podImage?: string; // Data URL or storage path
  podFileSizeKB?: number;
  podGps?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  retakeCount: number; // Max capped at 2
  retakeReason?: string;
  
  // AI Extraction Data
  aiConfidence?: number; // 0 to 100
  aiExtracted?: {
    lrNumberMatch: boolean;
    extractedLrNumber: string;
    consigneeStampPresent: boolean;
    stampConfidence: number; // 0 to 100
    signaturePresent: boolean;
    consigneeNameMasked?: string; // DPDP Compliance
    consigneePhoneMasked?: string; // DPDP Compliance
    deliveredQuantity?: number;
    dispatchedQuantity?: number;
    hasRemarks: boolean;
    damageOrShortageRemarks?: string;
    inspectionDate: string;
    rawText?: string;
  };

  // Billing metadata
  invoiceNumber?: string;
  billingCycle?: string; // e.g. 2026-W45
  billedAt?: string;
}

export interface UserSession {
  role: 'driver' | 'billing' | 'operations';
  name: string;
  phone?: string;
  branch?: string;
}

export interface BranchMetric {
  branch: string;
  totalTrips: number;
  capturedPods: number;
  avgPodToInvoiceDays: number;
  unbilledValue: number;
  disputeCount: number;
}
