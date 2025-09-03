import { NextResponse } from 'next/server';
import { calculateCommission } from '@/lib/affiliate';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const affiliateCode = searchParams.get('code');

    if (!affiliateCode) {
      return NextResponse.json({ error: 'Affiliate code is required' }, { status: 400 });
    }

    const commissionData = await calculateCommission(affiliateCode);

    return NextResponse.json(commissionData);
  } catch (error) {
    console.error('Error getting affiliate orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
