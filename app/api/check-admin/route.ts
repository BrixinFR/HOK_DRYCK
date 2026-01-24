import { isAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const admin = await isAdmin();
    return NextResponse.json({ isAdmin: admin });
  } catch (error) {
    return NextResponse.json({ isAdmin: false });
  }
}