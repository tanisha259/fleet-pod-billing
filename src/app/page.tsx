'use client';

import React, { useState } from 'react';
import BillingPortalView from '@/components/BillingPortalView';
import DriverCaptureView from '@/components/DriverCaptureView';
import { initialTrips } from '@/data/trips';
import { Truck, Shield, Smartphone } from 'lucide-react';

export default function Home() {
  const [role, setRole] = useState<'billing' | 'driver'>('billing');
  const [selectedDemoTripIndex, setSelectedDemoTripIndex] = useState<number>(1); // Default to TRP-66134 or TRP-66148

  return (
    <div className="min-h-screen">
      {/* Switcher Header for Reviewer Convenience */}
      <div className="bg-slate-950 text-white text-xs px-4 py-2 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-emerald-400">Company A Demo Portal</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Switch user role:</span>
        </div>

        <div className="flex items-center space-x-3">
          {role === 'driver' && (
            <div className="flex items-center space-x-2 text-slate-300">
              <span>Select Active Trip:</span>
              <select
                aria-label="Select Active Trip for Driver"
                value={selectedDemoTripIndex}
                onChange={(e) => setSelectedDemoTripIndex(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-emerald-300 rounded px-2 py-0.5 text-xs font-mono"
              >
                {initialTrips.map((t, idx) => (
                  <option key={t.id} value={idx}>
                    {t.id} ({t.vehicle} - {t.destination})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex space-x-1">
            <button
              onClick={() => setRole('billing')}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-all ${
                role === 'billing' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Billing & Ops Executive</span>
            </button>
            <button
              onClick={() => setRole('driver')}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-all ${
                role === 'driver' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Driver Capture (Mobile)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic View rendering */}
      {role === 'billing' ? (
        <BillingPortalView />
      ) : (
        <div className="bg-slate-200 py-6 min-h-[calc(100vh-41px)] flex items-center justify-center">
          <DriverCaptureView trip={initialTrips[selectedDemoTripIndex]} />
        </div>
      )}
    </div>
  );
}
