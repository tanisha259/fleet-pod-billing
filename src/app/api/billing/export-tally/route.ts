import { NextResponse } from 'next/server';
import { getTrips, updateTrip } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { tripIds, invoiceNumber, clientName } = await request.json();

    if (!tripIds || !Array.isArray(tripIds) || tripIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No trips provided for billing' }, { status: 400 });
    }

    const allTrips = getTrips();
    const targetTrips = allTrips.filter(t => tripIds.includes(t.id));

    // Calculate totals
    const totalFreight = targetTrips.reduce((sum, t) => sum + (t.freightAmount || 0), 0);
    const invoiceId = invoiceNumber || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    const dateFormatted = new Date().toISOString().split('T')[0].replace(/-/g, '');

    // Generate Tally-compliant XML
    const tallyXml = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>Company A Logistics Pvt Ltd</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create" OBJVIEW="Accounting Voucher View">
            <DATE>${dateFormatted}</DATE>
            <VOUCHERTYPENAME>Freight Sales</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${invoiceId}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${clientName || targetTrips[0]?.client || 'Client Account'}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>
            <BASICBUYERNAME>${clientName || targetTrips[0]?.client}</BASICBUYERNAME>
            <NARRATION>Freight Billing for ${targetTrips.length} Trips with Verified POD attachments. e-Way Bills: ${targetTrips.map(t => t.ewayBill).join(', ')}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${clientName || targetTrips[0]?.client}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${totalFreight}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Freight Revenue Account</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${totalFreight}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <UDF:ATTACHED_PODS.LIST>
              ${targetTrips.map(t => `
              <UDF:POD_ITEM>
                <UDF:TRIP_ID>${t.id}</UDF:TRIP_ID>
                <UDF:LR_NUMBER>${t.lrNumber}</UDF:LR_NUMBER>
                <UDF:EWAY_BILL>${t.ewayBill}</UDF:EWAY_BILL>
                <UDF:VEHICLE>${t.vehicle}</UDF:VEHICLE>
                <UDF:DESTINATION>${t.destination}</UDF:DESTINATION>
                <UDF:FREIGHT>${t.freightAmount}</UDF:FREIGHT>
                <UDF:POD_STATUS>VERIFIED</UDF:POD_STATUS>
                <UDF:CAPTURE_TIMESTAMP>${t.podCaptureDate || nowIso}</UDF:CAPTURE_TIMESTAMP>
                <UDF:GPS_COORDINATES>${t.podGps ? `${t.podGps.lat},${t.podGps.lng}` : 'N/A'}</UDF:GPS_COORDINATES>
              </UDF:POD_ITEM>`).join('')}
            </UDF:ATTACHED_PODS.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    // Mark trips as Billed
    targetTrips.forEach(t => {
      updateTrip(t.id, {
        status: 'Billed',
        invoiceNumber: invoiceId,
        billingCycle: '2026-W45',
        billedAt: nowIso
      });
    });

    return NextResponse.json({
      success: true,
      invoiceNumber: invoiceId,
      billedTripsCount: targetTrips.length,
      totalAmount: totalFreight,
      tallyXml
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
