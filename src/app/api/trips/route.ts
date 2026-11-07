import { NextResponse } from 'next/server';
import { getTrips, updateTrip } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const client = searchParams.get('client');
  const branch = searchParams.get('branch');

  let trips = getTrips();

  if (status) {
    trips = trips.filter(t => t.status === status);
  }
  if (client) {
    trips = trips.filter(t => t.client.toLowerCase().includes(client.toLowerCase()));
  }
  if (branch) {
    trips = trips.filter(t => t.branch.toLowerCase().includes(branch.toLowerCase()));
  }

  return NextResponse.json({ success: true, trips });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const trips = getTrips();
    
    // Auto generate ID if missing
    const newTrip = {
      id: body.id || `TRP-${Math.floor(66150 + Math.random() * 900)}`,
      lrNumber: body.lrNumber || `LR-${Math.floor(88490 + Math.random() * 900)}`,
      ewayBill: body.ewayBill || `241890${Math.floor(200000 + Math.random() * 800000)}`,
      client: body.client,
      vehicle: body.vehicle,
      origin: body.origin || 'Chhatrapati Sambhajinagar',
      destination: body.destination,
      freightAmount: Number(body.freightAmount) || 30000,
      status: 'Pending Capture',
      remarks: body.remarks || 'Freshly dispatched',
      driverName: body.driverName || 'Truck Driver',
      driverPhone: body.driverPhone || '9822000000',
      isHired: !!body.isHired,
      smsUploadToken: `token-${Math.random().toString(36).substring(2, 8)}`,
      createdDate: new Date().toISOString(),
      branch: body.branch || 'Chhatrapati Sambhajinagar',
      retakeCount: 0
    };

    trips.unshift(newTrip as any);
    const { saveTrips } = await import('@/lib/db');
    saveTrips(trips);

    return NextResponse.json({ success: true, trip: newTrip });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
