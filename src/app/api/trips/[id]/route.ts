import { NextResponse } from 'next/server';
import { getTripById, updateTrip } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const trip = getTripById(params.id);
  if (!trip) {
    return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, trip });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = updateTrip(params.id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, trip: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
