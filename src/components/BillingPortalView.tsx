'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText, 
  Download, 
  TrendingUp, 
  Clock, 
  Building2, 
  RefreshCw, 
  Eye, 
  ShieldCheck, 
  Truck, 
  Share2, 
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Trip, TripStatus } from '@/types/trip';

export default function BillingPortalView() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'review' | 'billing' | 'dashboard' | 'import'>('review');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [filterClient, setFilterClient] = useState<string>('all');
  const [billingSelectedTripIds, setBillingSelectedTripIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [tallyExportResult, setTallyExportResult] = useState<{ invoiceNumber: string; tallyXml: string } | null>(null);
  const [shareableLink, setShareableLink] = useState<string | null>(null);

  // New trip import form state
  const [newVehicle, setNewVehicle] = useState('MH20 AB 9119');
  const [newClient, setNewClient] = useState('Company B (cement)');
  const [newDestination, setNewDestination] = useState('Solapur');
  const [newFreight, setNewFreight] = useState('31000');
  const [newBranch, setNewBranch] = useState('Chhatrapati Sambhajinagar');

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/trips');
      const data = await res.json();
      if (data.success) {
        setTrips(data.trips);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  // Filtered trips
  const filteredTrips = trips.filter(t => {
    if (filterClient !== 'all' && !t.client.includes(filterClient)) return false;
    return true;
  });

  const reviewQueue = filteredTrips.filter(t => t.status === 'Needs review' || t.status === 'Retake requested');
  const verifiedQueue = filteredTrips.filter(t => t.status === 'Verified');
  const pendingQueue = filteredTrips.filter(t => t.status === 'Pending Capture');
  const billedQueue = filteredTrips.filter(t => t.status === 'Billed');

  // Handle Review action
  const handleReviewDecision = async (tripId: string, decision: 'Verified' | 'Retake requested', remarks?: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: decision,
          remarks: remarks || (decision === 'Verified' ? 'Approved by Billing Clerk' : 'Manual retake requested'),
          retakeReason: decision === 'Retake requested' ? (remarks || 'Clear stamp required') : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchTrips();
        setSelectedTrip(null);
      }
    } catch (e) {
      alert('Error updating trip');
    }
  };

  // Handle Tally Export & Invoicing
  const handleExportToTally = async () => {
    if (billingSelectedTripIds.length === 0) {
      alert('Please select at least one verified trip to bundle and export to Tally');
      return;
    }

    try {
      setIsExporting(true);
      const res = await fetch('/api/billing/export-tally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripIds: billingSelectedTripIds,
          clientName: filterClient !== 'all' ? filterClient : undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        setTallyExportResult({
          invoiceNumber: data.invoiceNumber,
          tallyXml: data.tallyXml
        });
        setBillingSelectedTripIds([]);
        await fetchTrips();
      } else {
        alert(data.error || 'Export failed');
      }
    } catch (e) {
      console.error(e);
      alert('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Download generated Tally XML file
  const downloadXmlFile = () => {
    if (!tallyExportResult) return;
    const blob = new Blob([tallyExportResult.tallyXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tally_Sales_${tallyExportResult.invoiceNumber}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Add new trip (Daily import simulation)
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: newClient,
          vehicle: newVehicle,
          destination: newDestination,
          freightAmount: Number(newFreight),
          branch: newBranch
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Trip imported successfully! Driver SMS link generated.');
        await fetchTrips();
        setActiveTab('review');
      }
    } catch (e) {
      alert('Failed to import trip');
    }
  };

  // Financial Metrics Calculation
  const totalDispatchedTrips = trips.length;
  const verifiedTripsCount = verifiedQueue.length + billedQueue.length;
  const podTurnaroundRate = totalDispatchedTrips > 0 ? Math.round((verifiedTripsCount / totalDispatchedTrips) * 100) : 0;
  const totalCapitalUnlocked = billedQueue.reduce((acc, t) => acc + t.freightAmount, 0) + verifiedQueue.reduce((acc, t) => acc + t.freightAmount, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-lg">
              A
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-tight">
                Company A Logistics
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Chhatrapati Sambhajinagar • Fleet Operations & Tally Billing
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('review')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'review'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Review Queue</span>
              {reviewQueue.length > 0 && (
                <span className="ml-1 bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                  {reviewQueue.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'billing'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Billing & Tally</span>
              {verifiedQueue.length > 0 && (
                <span className="ml-1 bg-emerald-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                  {verifiedQueue.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Executive Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('import')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'import'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Trip Import</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">POD-to-Invoice Days</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900">3.6</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  ↓ Down from 18d
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">24h Capture Rate</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900">{podTurnaroundRate}%</span>
                <span className="text-xs font-semibold text-slate-400">Target: 80%</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Dispute / Retake Rate</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-slate-900">0.4%</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  ↓ Down from 1.5%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Working Capital Unlocked</p>
              <span className="text-2xl font-black text-slate-900">
                ₹{(totalCapitalUnlocked / 100000).toFixed(1)} Lakh
              </span>
            </div>
          </div>
        </div>

        {/* TAB 1: REVIEW QUEUE (AI Check + Escalations) */}
        {activeTab === 'review' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  AI POD Verification & Review Queue
                </h2>
                <p className="text-xs text-slate-500">
                  Trips flagged with low confidence, missing stamps, or damage notes. Image is the source of truth.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  aria-label="Filter Trips by Client"
                  value={filterClient}
                  onChange={(e) => setFilterClient(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700"
                >
                  <option value="all">All Clients</option>
                  <option value="Company B (cement)">Company B (cement)</option>
                  <option value="Company C (steel)">Company C (steel)</option>
                  <option value="Company D (packaged foods)">Company D (packaged foods)</option>
                </select>
              </div>
            </div>

            {/* Table of Review Items */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Trip ID / LR</th>
                    <th className="py-3 px-4">Client & Vehicle</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Freight</th>
                    <th className="py-3 px-4">AI Finding</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reviewQueue.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No pending items in review queue. All captured PODs are verified!
                      </td>
                    </tr>
                  ) : (
                    reviewQueue.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-slate-900">{t.id}</span>
                          <span className="block text-[11px] text-slate-400">{t.lrNumber}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800">{t.client}</span>
                          <span className="block text-[11px] text-slate-500">{t.vehicle}</span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">{t.destination}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">₹{t.freightAmount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <span className="text-slate-700 font-medium line-clamp-1">
                            {t.aiExtracted?.damageOrShortageRemarks || t.remarks || 'Stamp obscured'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Confidence: {t.aiConfidence || 0}% • Retakes: {t.retakeCount || 0}/2
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center ${
                              t.status === 'Retake requested'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedTrip(t)}
                            className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 inline-flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            <span>Inspect & Verify</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: BILLING & TALLY EXPORT QUEUE */}
        {activeTab === 'billing' && (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Verified Trips Billing Queue (Tally ERP Integration)
                </h2>
                <p className="text-xs text-slate-500">
                  Select verified trips to bundle into a sales invoice and export standard Tally XML with non-repudiable POD links.
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    if (billingSelectedTripIds.length === verifiedQueue.length) {
                      setBillingSelectedTripIds([]);
                    } else {
                      setBillingSelectedTripIds(verifiedQueue.map(t => t.id));
                    }
                  }}
                  className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700"
                >
                  {billingSelectedTripIds.length === verifiedQueue.length ? 'Deselect All' : 'Select All'}
                </button>

                <button
                  onClick={handleExportToTally}
                  disabled={isExporting || billingSelectedTripIds.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-2 disabled:opacity-50"
                >
                  {isExporting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Export to Tally XML ({billingSelectedTripIds.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Export Success Modal / Card */}
            {tallyExportResult && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-emerald-900">
                    Tally XML Voucher Generated: {tallyExportResult.invoiceNumber}
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Ready for 1-click import into Tally Prime / ERP 9. All POD image links attached.
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={downloadXmlFile}
                    className="px-3.5 py-1.5 bg-emerald-700 text-white font-semibold text-xs rounded-xl hover:bg-emerald-800 flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download XML</span>
                  </button>
                  <button
                    onClick={() => setTallyExportResult(null)}
                    className="px-3 py-1.5 bg-white text-slate-600 text-xs rounded-xl border border-slate-200"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Verified Trips Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-10">Select</th>
                    <th className="py-3 px-4">Trip ID & Vehicle</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">LR & e-Way Bill</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Freight Amount</th>
                    <th className="py-3 px-4">POD Captured</th>
                    <th className="py-3 px-4 text-right">Client Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {verifiedQueue.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No pending verified trips ready for billing. Check the review queue!
                      </td>
                    </tr>
                  ) : (
                    verifiedQueue.map((t) => {
                      const isSelected = billingSelectedTripIds.includes(t.id);
                      return (
                        <tr
                          key={t.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isSelected ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBillingSelectedTripIds([...billingSelectedTripIds, t.id]);
                                } else {
                                  setBillingSelectedTripIds(billingSelectedTripIds.filter(id => id !== t.id));
                                }
                              }}
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <span className="font-bold text-slate-900">{t.id}</span>
                            <span className="block text-[11px] text-slate-500">{t.vehicle}</span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-800">{t.client}</td>
                          <td className="py-3.5 px-4 font-mono text-[11px]">
                            <span className="font-bold text-slate-800">{t.lrNumber}</span>
                            <span className="block text-slate-400">{t.ewayBill}</span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700">{t.destination}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">₹{t.freightAmount.toLocaleString()}</td>
                          <td className="py-3.5 px-4 text-emerald-700 font-semibold text-[11px]">
                            {t.podCaptureDate ? new Date(t.podCaptureDate).toLocaleDateString() : 'Verified'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                const url = `${window.location.origin}/pod-view/${t.id}`;
                                setShareableLink(url);
                              }}
                              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold inline-flex items-center"
                            >
                              <Share2 className="w-3.5 h-3.5 mr-1" />
                              <span>Link</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Billed History Accordion */}
            {billedQueue.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Previously Invoiced Trips in Tally ({billedQueue.length})
                </h3>
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                  <div className="space-y-2">
                    {billedQueue.map(t => (
                      <div key={t.id} className="flex justify-between items-center text-xs py-2 border-b border-slate-100 last:border-0">
                        <div className="flex items-center space-x-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="font-mono font-bold text-slate-900">{t.id}</span>
                          <span className="text-slate-600 font-medium">{t.client}</span>
                          <span className="text-slate-400 font-mono">Invoice: {t.invoiceNumber}</span>
                        </div>
                        <div className="font-semibold text-slate-800">
                          ₹{t.freightAmount.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EXECUTIVE & BRANCH TURNAROUND DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <h2 className="text-lg font-extrabold text-slate-900">
                Operations & Branch Performance Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Real-time tracking of unbilled revenue, POD capture speed, and aging trips across branches.
              </p>
            </div>

            {/* Branch Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Chhatrapati Sambhajinagar (HQ)', trips: 140, avgDays: 3.2, pending: 1, unbilled: '₹4.8L' },
                { name: 'Pune Hub', trips: 85, avgDays: 3.9, pending: 2, unbilled: '₹2.6L' },
                { name: 'Nagpur & Vidarbha', trips: 72, avgDays: 4.1, pending: 1, unbilled: '₹3.8L' }
              ].map(branch => (
                <div key={branch.name} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-sm text-slate-900">{branch.name}</span>
                    <Building2 className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block">Avg POD Turnaround</span>
                      <span className="font-bold text-slate-800 text-sm">{branch.avgDays} days</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Unbilled Pipeline</span>
                      <span className="font-bold text-emerald-700 text-sm">{branch.unbilled}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Missing POD Alert List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center">
                <Clock className="w-4 h-4 text-amber-500 mr-2" />
                <span>Aging Dispatches: Trips Awaiting Driver POD (&gt;24 Hours Alert)</span>
              </h3>
              <div className="divide-y divide-slate-100">
                {pendingQueue.map(t => (
                  <div key={t.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-900">{t.id}</span>
                        <span className="font-semibold text-slate-700">{t.vehicle}</span>
                        {t.isHired && (
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                            Hired Truck
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 block mt-0.5">
                        Driver: {t.driverName} ({t.driverPhone}) • Destination: {t.destination}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={`/driver/${t.smsUploadToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs hover:bg-emerald-100 flex items-center"
                      >
                        <span>Open Driver Link</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DAILY TRIP IMPORT FORM */}
        {activeTab === 'import' && (
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-1">
              Daily Trip & e-Way Bill Import
            </h2>
            <p className="text-xs text-slate-500 mb-5">
              Simulates daily import from TMS or logistics portal. Automatically provisions an instant SMS upload link for drivers.
            </p>

            <form onSubmit={handleCreateTrip} className="space-y-4 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-slate-600">Client</label>
                  <select
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Company B (cement)">Company B (cement)</option>
                    <option value="Company C (steel)">Company C (steel)</option>
                    <option value="Company D (packaged foods)">Company D (packaged foods)</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">Vehicle Number</label>
                  <input
                    type="text"
                    value={newVehicle}
                    onChange={(e) => setNewVehicle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    placeholder="MH20 EL 4521"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-slate-600">Destination City</label>
                  <input
                    type="text"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="Nagpur"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">Freight Value (₹)</label>
                  <input
                    type="number"
                    value={newFreight}
                    onChange={(e) => setNewFreight(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="35000"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-600">Operating Branch</label>
                <select
                  value={newBranch}
                  onChange={(e) => setNewBranch(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Chhatrapati Sambhajinagar">Chhatrapati Sambhajinagar</option>
                  <option value="Pune">Pune</option>
                  <option value="Nagpur">Nagpur</option>
                  <option value="Indore">Indore</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-md transition-all text-sm"
                >
                  Create Trip & Generate Driver SMS Link
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* INSPECT & VERIFY MODAL (Side-by-side POD vs AI Data) */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {selectedTrip.id}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Human Inspection & AI Cross-Verification
                </h3>
              </div>
              <button
                onClick={() => setSelectedTrip(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
              {/* Left Column: Source of Truth (POD Image) */}
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Original POD Document (Source of Truth)
                </span>
                <div className="aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative">
                  {selectedTrip.podImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedTrip.podImage}
                      alt="POD Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Sample POD Simulated Document</p>
                      <p className="text-[11px] font-mono text-emerald-400 mt-1">
                        LR: {selectedTrip.lrNumber} | {selectedTrip.destination}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>GPS: {selectedTrip.podGps ? `${selectedTrip.podGps.lat}, ${selectedTrip.podGps.lng}` : 'MH-State Highway'}</span>
                  <span>Payload: {selectedTrip.podFileSizeKB || 184} KB (&lt;300 KB)</span>
                </div>
              </div>

              {/* Right Column: AI Extraction & DPDP Masked Data */}
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  AI Extraction & DPDP 2023 Masking
                </span>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">LR Number Match</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      MATCH ({selectedTrip.lrNumber})
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Consignee Stamp</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded ${
                        selectedTrip.aiExtracted?.consigneeStampPresent
                          ? 'text-emerald-700 bg-emerald-100'
                          : 'text-amber-800 bg-amber-100'
                      }`}
                    >
                      {selectedTrip.aiExtracted?.consigneeStampPresent ? 'Detected (96%)' : 'Obscured / Faint'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Consignee Name (DPDP Act)</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {selectedTrip.aiExtracted?.consigneeNameMasked || 'Protected under DPDP'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Damage / Shortage Remarks</span>
                    <span className="font-semibold text-red-600">
                      {selectedTrip.aiExtracted?.damageOrShortageRemarks || 'None'}
                    </span>
                  </div>
                </div>

                {/* Human Override Action Buttons */}
                <div className="pt-4 flex space-x-3">
                  <button
                    onClick={() => handleReviewDecision(selectedTrip.id, 'Verified')}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Move to Billing</span>
                  </button>

                  <button
                    onClick={() => handleReviewDecision(selectedTrip.id, 'Retake requested', 'Stamp illegible')}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Request Driver Retake</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shareable Link Toast / Modal */}
      {shareableLink && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 max-w-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-emerald-400">Client POD Link Created</span>
            <button onClick={() => setShareableLink(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <p className="text-[11px] text-slate-300 font-mono break-all">{shareableLink}</p>
          <a
            href={shareableLink}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-xs font-bold text-emerald-400 underline"
          >
            Open in new tab →
          </a>
        </div>
      )}
    </div>
  );
}
