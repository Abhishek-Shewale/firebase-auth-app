import { NextResponse } from 'next/server';
import { getAffiliateData } from '@/lib/affiliate';
import { withAuth } from '@/lib/auth-utils';

async function getAffiliateDataHandler(request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    // Verify that the requesting user can access this affiliate data
    // (either it's their own data or they have permission)
    if (request.user.uid !== uid) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }

    const affiliateData = await getAffiliateData(uid);

    if (!affiliateData) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(affiliateData);
  } catch (error) {
    console.error('Error getting affiliate data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export the handler wrapped with authentication
export const GET = withAuth(getAffiliateDataHandler);
