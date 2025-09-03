import { NextResponse } from 'next/server';
import { getAffiliateData } from '@/lib/affiliate';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    const affiliateData = await getAffiliateData(uid);

    if (!affiliateData) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 400 });
    }

    return NextResponse.json(affiliateData);
  } catch (error) {
    console.error('Error getting affiliate data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
