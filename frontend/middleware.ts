import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 認証が必要なパス（(authed)グループ）
  const protectedPaths = ['/app'];

  // 認証が不要なパス（(public)グループ）
  const publicPaths = ['/help', '/login', '/subscription'];

  // ルートパス
  const isRootPath = pathname === '/';

  // 保護されたパスかどうかチェック
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path),
  );

  // パブリックパスかどうかチェック
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Firebase ID Tokenをクッキーから取得
  const idToken = request.cookies.get('firebase-id-token')?.value;

  // デバッグログ（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('=== Middleware Debug ===');
    console.log('Pathname:', pathname);
    console.log('ID Token exists:', !!idToken);
    console.log(
      'All cookies:',
      request.cookies.getAll().map((c) => c.name),
    );
  }

  let isAuthenticated = false;
  if (idToken) {
    try {
      // バックエンドAPIでトークン検証
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/verify-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
        },
      );
      isAuthenticated = response.ok;
      if (process.env.NODE_ENV === 'development') {
        console.log('Token verification success:', isAuthenticated);
      }
    } catch (error) {
      console.error('ID Token検証エラー:', error);
      isAuthenticated = false;
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Is authenticated:', isAuthenticated);
    console.log('==================');
  }

  // 保護されたパスへのアクセス
  if (isProtectedPath) {
    if (!isAuthenticated) {
      // 認証されていない場合はログインページにリダイレクト
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 認証されている場合はそのまま進む
    return NextResponse.next();
  }

  // パブリックパスへのアクセス
  if (isPublicPath) {
    if (isAuthenticated) {
      // 既に認証されている場合はアプリページにリダイレクト
      return NextResponse.redirect(new URL('/app', request.url));
    }

    // 認証されていない場合はそのまま進む
    return NextResponse.next();
  }

  // ルートパスへのアクセス
  if (isRootPath) {
    if (isAuthenticated) {
      // 認証されている場合はアプリページにリダイレクト
      return NextResponse.redirect(new URL('/app', request.url));
    }

    // 認証されていない場合はそのまま進む（トップページ表示）
    return NextResponse.next();
  }

  // その他のパスはそのまま進む
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
