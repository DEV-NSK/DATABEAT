import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized — no token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // Create a server client scoped to this user's token.
    // RLS policies will automatically filter rows to this user.
    const serverClient = createServerSupabaseClient(token);

    // Verify token and get user
    const { data: { user }, error: authError } = await serverClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized — invalid token' },
        { status: 401 }
      );
    }

    // Fetch latest row from client_cross_sell filtered by user_id via RLS
    const { data, error } = await serverClient
      .from('client_cross_sell')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data ?? null });
  } catch (error) {
    console.error('Error fetching latest cross-sell data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cross-sell data' },
      { status: 500 }
    );
  }
}
