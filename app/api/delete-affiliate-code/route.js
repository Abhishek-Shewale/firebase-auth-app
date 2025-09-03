import { NextResponse } from 'next/server';
import { deleteAffiliate } from '@/lib/affiliate';

export async function POST(request) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    await deleteAffiliate(uid);

    return NextResponse.json({
      success: true,
      message: 'Affiliate link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting affiliate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
