import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Proxy login request to Flask API
    const response = await fetch(`${API_BASE}/api/v2/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      // Pass through error details for registration state handling
      return NextResponse.json(
        { 
          success: false, 
          message: data.message || 'Login failed',
          errors: data.errors,
        },
        { status: response.status }
      );
    }

    // Store token in cookies
    const token = data.data?.token;
    if (token) {
      const cookieStore = await cookies();
      // 1) HttpOnly cookie for server-side use if needed
      cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
      // 2) Readable cookie for client to attach Authorization header on cross-origin requests
      cookieStore.set('access_token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
    }

    // Return user data and token so client can persist as well
    return NextResponse.json({
      success: true,
      user: data.data?.user || data.user,
      token,
    });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    // Optional: Call Flask logout endpoint
    if (token) {
      try {
        await fetch(`${API_BASE}/api/v2/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        // Ignore Flask logout errors - still clear the cookie
        console.warn('Flask logout failed:', error);
      }
    }

  // Clear the auth cookies
  cookieStore.delete('auth_token');
  cookieStore.delete('access_token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}