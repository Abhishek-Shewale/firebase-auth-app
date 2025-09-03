import { NextResponse } from 'next/server';
import { generateAffiliateCode } from '@/lib/affiliate';

export async function POST(request) {
  try {
    const { uid, email } = await request.json();

    if (!uid || !email) {
      return NextResponse.json({ error: 'UID and email are required' }, { status: 400 });
    }

    const affiliateData = await generateAffiliateCode(uid, email);

    return NextResponse.json({
      success: true,
      affiliate: affiliateData,
      message: 'Affiliate code generated successfully'
    });
  } catch (error) {
    console.error('Error generating affiliate code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
