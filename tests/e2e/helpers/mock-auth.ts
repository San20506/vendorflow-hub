import { Page } from '@playwright/test';

// Supabase project ref from VITE_SUPABASE_URL: omtjwinoxbrzeqvdckyg
const PROJECT_REF = 'omtjwinoxbrzeqvdckyg';
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

// A fake but structurally valid Supabase session object.
// The JWT payload is fake — it won't pass Supabase server validation,
// but the client reads it to populate the session object locally.
// We intercept the API calls so the server never validates it.
const FAKE_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  Buffer.from(
    JSON.stringify({
      iss: 'supabase',
      ref: PROJECT_REF,
      role: 'authenticated',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600 * 24,
      iat: Math.floor(Date.now() / 1000),
      sub: 'test-user-id-00000000',
      email: 'test@vendorflow.com',
      email_confirmed_at: '2024-01-01T00:00:00.000Z',
      user_metadata: { name: 'Test Admin' },
      app_metadata: { provider: 'email' },
    })
  ).toString('base64').replace(/=/g, '') +
  '.fake-signature';

const FAKE_SESSION = {
  access_token: FAKE_ACCESS_TOKEN,
  token_type: 'bearer',
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: 'fake-refresh-token',
  user: {
    id: 'test-user-id-00000000',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@vendorflow.com',
    email_confirmed_at: '2024-01-01T00:00:00.000Z',
    confirmed_at: '2024-01-01T00:00:00.000Z',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    last_sign_in_at: new Date().toISOString(),
    user_metadata: { name: 'Test Admin' },
    app_metadata: { provider: 'email', providers: ['email'] },
    identities: [],
  },
};

export async function injectMockAuth(page: Page): Promise<void> {
  // 1. Intercept Supabase REST API calls to avoid real network hits
  await page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url();

    // GET /session or token refresh — return our fake session
    if (url.includes('/token') || url.includes('/session') || url.includes('/user')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FAKE_SESSION),
      });
      return;
    }
    // Everything else (logout, etc.) — OK
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  // 2. Intercept Supabase DB calls so AuthContext resolves cleanly
  // user_roles table
  await page.route('**/rest/v1/user_roles*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ role: 'admin' }),
    });
  });

  // profiles table
  await page.route('**/rest/v1/profiles*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'Test Admin', avatar_url: null }),
    });
  });

  // users table — AuthContext.buildAppUser queries this; must return a valid user or
  // buildAppUser returns null → isAuthenticated = false → redirect to /login
  await page.route('**/rest/v1/users*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-user-id-00000000',
        email: 'test@vendorflow.com',
        role: 'admin',
        avatar: null,
      }),
    });
  });

  // vendors table — getCurrentVendor queries this; needed by Insights page
  await page.route('**/rest/v1/vendors*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        vendor_id: 'test-vendor-id-00000000',
        name: 'Test Vendor',
        user_id: 'test-user-id-00000000',
      }]),
    });
  });

  // 3. Inject localStorage session BEFORE the app's JS runs
  await page.addInitScript(
    ({ key, session }: { key: string; session: object }) => {
      localStorage.setItem(key, JSON.stringify(session));
    },
    { key: STORAGE_KEY, session: FAKE_SESSION }
  );
}
