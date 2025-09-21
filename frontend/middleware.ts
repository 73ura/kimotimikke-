import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 認証が必要なパス（(authed)グループ）
  const protectedPaths = ['/app', '/billing', '/pricing', 'not-found.tsx'];

  // 認証が不要なパス（(public)グループ）
  const publicPaths = ['/help', '/login'];

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

  let isAuthenticated = false;
  if (idToken) {
    // テスト環境では無効なトークンを明示的にチェック
    if (idToken.includes('invalid-token')) {
      isAuthenticated = false;
      if (process.env.NODE_ENV === 'development') {
        console.log('Invalid token detected:', idToken);
      }
    } else {
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
          console.log('Response status:', response.status);
          console.log('Token value:', idToken.substring(0, 20) + '...');
        }
      } catch (error) {
        console.error('ID Token検証エラー:', error);
        isAuthenticated = false;
      }
    }
  }

  // 認証が必要なパスへのアクセス
  if (isProtectedPath) {
    if (!isAuthenticated) {
      // 認証されていない場合はログインページにリダイレクト
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 認証済みの場合、サブスクリプション状態をチェック
    try {
      const subscriptionResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/stripe/subscription/status`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
        },
      );

      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        const hasSubscription =
          subscriptionData.has_subscription || subscriptionData.is_trial;

        if (!hasSubscription) {
          // サブスクリプション未登録の場合はプライシングページにリダイレクト
          return NextResponse.redirect(new URL('/pricing', request.url));
        }

        // サブスクリプション登録済みの場合、/appにアクセスした際はセットアップチェック
        // ただし、設定ページやその他の管理ページは除外
        if (pathname === '/app' || pathname === '/app/') {
          const childrenResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/children`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
              },
            },
          );

          if (childrenResponse.ok) {
            const childrenData = await childrenResponse.json();
            if (childrenData.children && childrenData.children.length === 0) {
              // 子ども情報が未設定の場合はセットアップページにリダイレクト
              if (process.env.NODE_ENV === 'development') {
                console.log('Redirecting to setup page: no children data');
              }
              return NextResponse.redirect(new URL('/app/setup', request.url));
            }
          }
        }
      }
    } catch (error) {
      console.error('Subscription/Setup check failed:', error);
    }

    return NextResponse.next();
  }

  // パブリックパスへのアクセス
  if (isPublicPath) {
    if (isAuthenticated) {
      // サブスクリプション状態をチェックしてリダイレクト先を決定
      try {
        const subscriptionResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/stripe/subscription/status`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
          },
        );

        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          const hasSubscription =
            subscriptionData.has_subscription || subscriptionData.is_trial;

          if (hasSubscription) {
            // サブスクリプション登録済みの場合はアプリページにリダイレクト
            return NextResponse.redirect(new URL('/app', request.url));
          } else {
            // サブスクリプション未登録の場合はプライシングページにリダイレクト
            return NextResponse.redirect(new URL('/pricing', request.url));
          }
        }
      } catch (error) {
        console.error('Subscription check failed:', error);
      }

      // サブスクリプション状態の確認に失敗した場合はデフォルトでアプリページにリダイレクト
      return NextResponse.redirect(new URL('/app', request.url));
    }

    // 認証されていない場合はそのまま進む
    return NextResponse.next();
  }

  // ルートパスへのアクセス
  if (isRootPath) {
    if (isAuthenticated) {
      // サブスクリプション状態をチェックしてリダイレクト先を決定
      try {
        const subscriptionResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/stripe/subscription/status`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
          },
        );

        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          const hasSubscription =
            subscriptionData.has_subscription || subscriptionData.is_trial;

          if (hasSubscription) {
            // サブスクリプション登録済みの場合はアプリページにリダイレクト
            return NextResponse.redirect(new URL('/app', request.url));
          } else {
            // サブスクリプション未登録の場合はプライシングページにリダイレクト
            return NextResponse.redirect(new URL('/pricing', request.url));
          }
        }
      } catch (error) {
        console.error('Subscription check failed:', error);
      }

      // サブスクリプション状態の確認に失敗した場合はデフォルトでアプリページにリダイレクト
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
