import NextAuth from 'next-auth'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'

/**
 * NextAuth is used only for the Microsoft OIDC flow.
 * Once authenticated, the microsoft-callback route reads the next-auth session,
 * looks up the user in our database, and mints a custom admin-session JWT cookie.
 * All subsequent auth checks use our own session — not next-auth.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    }),
  ],
  // next-auth needs its own secret for internal JWT signing
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, profile }) {
      // Pass Microsoft profile info through the next-auth JWT so the
      // microsoft-callback route can read the email and Entra Object ID
      if (profile) {
        token.microsoftId = (profile as Record<string, unknown>).oid as string | undefined
        if (profile.email) token.email = profile.email
        if (profile.name) token.name = profile.name
      }
      return token
    },
    async session({ session, token }) {
      if (token.microsoftId) {
        (session.user as unknown as Record<string, unknown>).microsoftId = token.microsoftId
      }
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
})
