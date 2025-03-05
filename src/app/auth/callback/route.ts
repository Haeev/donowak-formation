import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');

  // Si c'est une confirmation d'email
  if (code && type === 'email_confirmation') {
    return NextResponse.redirect(new URL('/auth/email-confirmed', requestUrl.origin));
  }
  
  // Si c'est un code d'authentification normal
  if (code) {
    const cookieStore = await cookies();
    const supabase = await createClient();
    
    await supabase.auth.exchangeCodeForSession(code);
    
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
  }

  // Return the user to the home page if something goes wrong
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 