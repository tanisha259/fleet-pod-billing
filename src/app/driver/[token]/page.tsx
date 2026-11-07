import React from 'react';
import { notFound } from 'next/navigation';
import DriverCaptureView from '@/components/DriverCaptureView';
import { getTripById } from '@/lib/db';

interface Props {
  params: {
    token: string;
  };
}

export default function DriverUploadPage({ params }: Props) {
  const trip = getTripById(params.token);

  if (!trip) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl max-w-sm text-center shadow-md">
          <h2 className="text-red-600 font-bold text-base mb-2">Invalid or Expired Link</h2>
          <p className="text-xs text-slate-500">
            This upload link could not be verified. Please contact Company A dispatch office.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 sm:py-6 flex items-center justify-center">
      <DriverCaptureView trip={trip} smsMode={true} />
    </div>
  );
}
