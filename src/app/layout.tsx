import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Logistics POD Capture & Billing System - Company A',
  description: 'Proof of Delivery Capture, AI Stamp/LR Verification, and Tally Billing Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
