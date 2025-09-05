import { NextResponse } from 'next/server';
import { generateAffiliateCode } from '@/lib/affiliate';
import { withAuth } from '@/lib/auth-utils';

async function generateAffiliateCodeHandler(request) {
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

// Export the handler wrapped with authentication
export const POST = withAuth(generateAffiliateCodeHandler);
