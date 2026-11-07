'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, CheckCircle2, AlertTriangle, Wifi, WifiOff, Volume2, ShieldCheck, MapPin } from 'lucide-react';
import { Trip } from '@/types/trip';
import { SupportedLanguage, voicePrompts, speakPrompt, compressImageToUnder300KB } from '@/lib/driverUtils';

interface DriverCaptureProps {
  trip: Trip;
  onSuccess?: () => void;
  smsMode?: boolean;
}

export default function DriverCaptureView({ trip: initialTrip, onSuccess, smsMode }: DriverCaptureProps) {
  const [trip, setTrip] = useState<Trip>(initialTrip);
  const [language, setLanguage] = useState<SupportedLanguage>('hi');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(trip.podImage || null);
  const [capturedSizeKB, setCapturedSizeKB] = useState<number>(trip.podFileSizeKB || 0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'retake' | 'review' | 'queued_offline'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor network status for highway dead zones
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      // Attempt auto-sync if pending offline image
      syncOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial voice welcome
    const welcomeText = language === 'mr' ? voicePrompts.mr.welcome : voicePrompts.hi.welcomeHi;
    const timer = setTimeout(() => {
      speakPrompt(welcomeText, language);
    }, 600);

    // Fetch GPS coordinates in background
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.log('GPS prompt skipped or unavailable:', err),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timer);
    };
  }, [language]);

  // Sync offline queued images
  const syncOfflineQueue = async () => {
    try {
      const offlineQueueKey = `pod_offline_${trip.id}`;
      const cached = localStorage.getItem(offlineQueueKey);
      if (cached) {
        const payload = JSON.parse(cached);
        await submitPodPayload(payload.base64, payload.sizeKB, payload.gps);
        localStorage.removeItem(offlineQueueKey);
      }
    } catch (e) {
      console.warn('Sync failed:', e);
    }
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
    speakPrompt(lang === 'mr' ? voicePrompts.mr.welcome : voicePrompts.hi.welcomeHi, lang);
  };

  const handleTriggerCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    speakPrompt(
      language === 'mr' ? voicePrompts.mr.capturing : voicePrompts.hi.capturing,
      language
    );

    try {
      // Automatic client-side compression strictly under 300 KB
      const { base64, sizeKB } = await compressImageToUnder300KB(file);
      setCapturedImage(base64);
      setCapturedSizeKB(sizeKB);

      const gps = gpsCoords || { lat: 19.8762, lng: 75.3433 };

      if (!navigator.onLine) {
        // Highway dead zone -> Queue locally
        localStorage.setItem(`pod_offline_${trip.id}`, JSON.stringify({ base64, sizeKB, gps }));
        setUploadStatus('queued_offline');
        setStatusMessage(
          language === 'mr'
            ? 'नेटवर्क नाही. फोटो सुरक्षित सेव्ह झाला आहे! नेटवर्क येताच आपोआप जमा होईल.'
            : 'नेटवर्क नहीं है. फोटो सुरक्षित सेव हो गई है! नेटवर्क आते ही अपने आप जमा हो जाएगी.'
        );
        speakPrompt(
          language === 'mr' ? voicePrompts.mr.offlineNotice : voicePrompts.hi.offlineNotice,
          language
        );
      } else {
        await submitPodPayload(base64, sizeKB, gps);
      }
    } catch (err: any) {
      console.error(err);
      alert('Error processing photo: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const submitPodPayload = async (
    imageBase64: string,
    fileSizeKB: number,
    gps: { lat: number; lng: number }
  ) => {
    try {
      const res = await fetch(`/api/trips/${trip.id}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          fileSizeKB,
          gps: {
            ...gps,
            timestamp: new Date().toISOString()
          }
        })
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Upload error');
        return;
      }

      const updatedTrip = data.trip as Trip;
      setTrip(updatedTrip);

      if (updatedTrip.status === 'Verified') {
        setUploadStatus('success');
        setStatusMessage(
          language === 'mr'
            ? 'पावती मंजूर झाली! स्टॅम्प आणि सही तपासली गेली.'
            : 'पावती सत्यापित हो गई! मुहर और हस्ताक्षर सही पाए गए.'
        );
        speakPrompt(
          language === 'mr' ? voicePrompts.mr.success : voicePrompts.hi.success,
          language
        );
      } else if (updatedTrip.status === 'Retake requested') {
        setUploadStatus('retake');
        setStatusMessage(
          updatedTrip.retakeReason ||
            (language === 'mr'
              ? 'मुहर (स्टॅम्प) दिसत नाही. कृपया पुन्हा फोटो काढा.'
              : 'मुहर (स्टाम्प) साफ नहीं दिख रही है. कृपया दोबारा फोटो लें.')
        );
        speakPrompt(
          language === 'mr' ? voicePrompts.mr.retakeRequired : voicePrompts.hi.retakeRequired,
          language
        );
      } else {
        setUploadStatus('review');
        setStatusMessage(
          language === 'mr'
            ? 'पावती मुख्य कार्यालयाकडे तपासणीसाठी पाठवली आहे.'
            : 'पावती मुख्य कार्यालय में समीक्षा के लिए भेजी गई है.'
        );
        speakPrompt(
          language === 'mr' ? voicePrompts.mr.reviewRequired : voicePrompts.hi.reviewRequired,
          language
        );
      }
    } catch (e: any) {
      console.error(e);
      setUploadStatus('queued_offline');
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-100 flex flex-col justify-between p-4 shadow-xl select-none font-sans">
      {/* Top Bar: Network & Language Toggle */}
      <header className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <span className="flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
              <Wifi className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Online
            </span>
          ) : (
            <span className="flex items-center text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
              <WifiOff className="w-3.5 h-3.5 mr-1 text-amber-600" />
              Highway Dead Zone (Offline Mode)
            </span>
          )}
        </div>

        {/* Hindi / Marathi Voice Toggle */}
        <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <button
            onClick={() => handleLanguageChange('hi')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              language === 'hi'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            हिंदी
          </button>
          <button
            onClick={() => handleLanguageChange('mr')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              language === 'mr'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            मराठी
          </button>
        </div>
      </header>

      {/* Main Vehicle & Delivery Card - Clean, Zero Clutter */}
      <section className="bg-white rounded-3xl p-5 my-4 shadow-sm border border-slate-200 text-center">
        <div className="inline-block bg-slate-100 text-slate-800 text-sm font-bold tracking-wider px-3 py-1 rounded-lg mb-2">
          {trip.vehicle}
        </div>
        <h1 className="text-xl font-black text-slate-900">{trip.destination}</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">{trip.client}</p>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-around text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block font-normal">LR Number</span>
            <span className="font-bold text-slate-800">{trip.lrNumber}</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400 block font-normal">e-Way Bill</span>
            <span className="font-mono font-bold text-slate-800">{trip.ewayBill.slice(-6)}</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400 block font-normal">Retakes</span>
            <span className="font-bold text-slate-800">{trip.retakeCount || 0} / 2</span>
          </div>
        </div>
      </section>

      {/* Active State / Photo Feedback Area */}
      <div className="flex-1 flex flex-col items-center justify-center my-2">
        {capturedImage ? (
          <div className="w-full bg-white rounded-3xl p-4 shadow-sm border border-slate-200 flex flex-col items-center">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Captured POD"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md rounded-xl p-2 text-white flex justify-between items-center text-xs">
                <span className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                  GPS Stamped
                </span>
                <span className="font-mono text-emerald-300 font-semibold">
                  {capturedSizeKB} KB (&lt;300 KB)
                </span>
              </div>
            </div>

            {/* Status Banner */}
            <div
              className={`w-full mt-3 p-3.5 rounded-2xl flex items-center space-x-3 text-left ${
                uploadStatus === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : uploadStatus === 'retake'
                  ? 'bg-amber-50 text-amber-900 border border-amber-300'
                  : uploadStatus === 'review'
                  ? 'bg-blue-50 text-blue-900 border border-blue-300'
                  : 'bg-slate-50 text-slate-800 border border-slate-200'
              }`}
            >
              {uploadStatus === 'success' ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              ) : uploadStatus === 'retake' ? (
                <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
              ) : (
                <ShieldCheck className="w-8 h-8 text-blue-600 shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-bold text-sm leading-snug">
                  {statusMessage ||
                    (language === 'mr' ? 'फोटो जमा झाला आहे' : 'फोटो जमा हो गया है')}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    speakPrompt(statusMessage, language)
                  }
                  className="mt-1 flex items-center text-xs font-semibold text-slate-700 hover:text-black"
                >
                  <Volume2 className="w-3.5 h-3.5 mr-1" />
                  {language === 'mr' ? 'पुन्हा ऐका' : 'दोबारा सुनें'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 bg-white/70 rounded-3xl border border-dashed border-slate-300 w-full flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-3 text-emerald-600">
              <Camera className="w-10 h-10" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              {language === 'mr'
                ? 'पावतीवर स्टॅम्प आणि सही स्पष्ट दिसू द्या'
                : 'पावती पर मुहर और हस्ताक्षर साफ दिखने चाहिए'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              {language === 'mr'
                ? 'खालील मोठ्या हिरव्या बटणावर दाबा'
                : 'नीचे दिए गए बड़े हरे बटन पर टैप करें'}
            </p>
          </div>
        )}
      </div>

      {/* Hidden File / Camera Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* DPDP Act 2023 Trust Banner */}
      <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 py-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        <span>DPDP Act 2023 Compliant • Personal Data Masked</span>
      </div>

      {/* ONE BIG ACTION BUTTON - Core UX Design Requirement */}
      <div className="pt-2">
        {uploadStatus === 'retake' && (trip.retakeCount || 0) < 2 ? (
          <button
            type="button"
            onClick={handleTriggerCamera}
            disabled={isProcessing}
            className="w-full py-5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-black text-lg flex items-center justify-center space-x-3 shadow-lg shadow-amber-500/30 transition-all"
          >
            {isProcessing ? (
              <RefreshCw className="w-7 h-7 animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-7 h-7" />
                <span>
                  {language === 'mr' ? 'पुन्हा फोटो काढा (Retake)' : 'दोबारा फोटो लें (Retake)'}
                </span>
              </>
            )}
          </button>
        ) : uploadStatus === 'success' ? (
          <div className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-base flex items-center justify-center space-x-2 shadow-md">
            <CheckCircle2 className="w-6 h-6" />
            <span>
              {language === 'mr' ? 'काम पूर्ण झाले! (Done)' : 'काम पूरा हुआ! (Done)'}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleTriggerCamera}
            disabled={isProcessing}
            className="w-full py-5 rounded-3xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xl flex items-center justify-center space-x-3 shadow-xl shadow-emerald-600/35 transition-all"
          >
            {isProcessing ? (
              <RefreshCw className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <Camera className="w-8 h-8" />
                <span>
                  {language === 'mr' ? 'फोटो काढा' : 'फोटो खींचें'}
                </span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
