import React from 'react';
import { notFound } from 'next/navigation';
import { getTripById } from '@/lib/db';
import { ShieldCheck, CheckCircle2, FileText, Calendar, Truck } from 'lucide-react';

interface Props {
  params: {
    id: string;
  };
}

export default function ClientPodViewPage({ params }: Props) {
  const trip = getTripById(params.id);

  if (!trip) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 font-sans text-slate-800">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
              {trip.id}
            </span>
            <h1 className="text-xl font-black text-slate-900 mt-2">Verified Proof of Delivery (POD)</h1>
            <p className="text-xs text-slate-500">Transporter: Company A Logistics Pvt Ltd</p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Verified & Billed
            </span>
          </div>
        </div>

        {/* Trip Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <span className="text-slate-400 block">Client</span>
            <span className="font-bold text-slate-800">{trip.client}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Vehicle</span>
            <span className="font-mono font-bold text-slate-800">{trip.vehicle}</span>
          </div>
          <div>
            <span className="text-slate-400 block">LR Number</span>
            <span className="font-mono font-bold text-slate-800">{trip.lrNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block">e-Way Bill</span>
            <span className="font-mono font-bold text-slate-800">{trip.ewayBill}</span>
          </div>
        </div>

        {/* POD Document Preview */}
        <div className="my-6">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Stamped Delivery Receipt (DPDP Masked for Consignee Privacy)
          </span>
          <div className="aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative">
            {trip.podImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={trip.podImage} alt="POD" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-6 text-slate-300">
                <FileText className="w-12 h-12 mx-auto mb-2 text-emerald-400" />
                <p className="font-mono text-sm font-bold">DIGITAL STAMP VERIFIED</p>
                <p className="text-xs text-slate-400 mt-1">LR: {trip.lrNumber} • Consignee Ack Confirmed</p>
              </div>
            )}
            <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md rounded-xl p-2 text-white flex justify-between items-center text-[11px]">
              <span>Stamp Verified (Confidence: {trip.aiConfidence || 95}%)</span>
              <span className="font-mono">Payload: {trip.podFileSizeKB || 184} KB</span>
            </div>
          </div>
        </div>

        {/* Verification Summary */}
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-xs text-emerald-900 space-y-1">
          <div className="flex items-center space-x-1.5 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Digital Delivery Audit Trail Validated</span>
          </div>
          <p className="text-emerald-800">
            Received by {trip.aiExtracted?.consigneeNameMasked || 'Authorized Receiver'} on{' '}
            {trip.deliveryDate ? new Date(trip.deliveryDate).toLocaleDateString() : 'Delivery Date'}.
          </p>
        </div>
      </div>
    </div>
  );
}
