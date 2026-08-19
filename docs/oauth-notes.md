# Auth integration notes

Official Supabase guidance recommends cookie-based SSR auth for Next.js App Router using the `@supabase/ssr` package, public URL plus publishable key on the browser/server client, and a callback route that exchanges the OAuth `code` for a session. Supabase's GitHub provider can be configured in the Supabase dashboard with a GitHub OAuth application; the provider callback is the Supabase project callback URL. [1] [2]

For the separate repository connector, DevDesk should use its own GitHub OAuth web application flow after the user is authenticated with Supabase. The GitHub client secret must remain server-side. The callback must exchange the temporary authorization code on the server, validate the returned state, store the token encrypted or in a protected server-side table, and call the GitHub API with an `Authorization: Bearer` header. The UI should receive repository metadata only. [3]

References:

[1]: https://supabase.com/docs/guides/auth/quickstarts/nextjs — Supabase Auth with Next.js
[2]: https://supabase.com/docs/guides/auth/social-login/auth-github — Supabase GitHub social login
[3]: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authenticating-to-the-rest-api-with-an-oauth-app — GitHub OAuth app REST authentication
