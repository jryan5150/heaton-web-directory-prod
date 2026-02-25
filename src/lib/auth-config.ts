import NextAuth from 'next-auth'
import AzureAD from 'next-auth/providers/azure-ad'
import prisma from '@/lib/db'

/**
 * NextAuth configuration for Microsoft Entra ID (Azure AD) SSO.
 *
 * We use next-auth ONLY for the Microsoft OIDC flow. Once authenticated,
 * we create our own JWT session (via auth-helpers.ts) in the microsoft-callback
 * route. This avoids rearchitecting the existing email/password auth system.
 */
export const { handlers, auth, signIn: serverSignIn } = NextAuth({
  providers: [
    AzureAD({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      // Restrict to organization's tenant only (not personal Microsoft accounts)
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    }),
  ],
  // next-auth needs its own secret for internal JWT signing
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, profile }) {
      // Only allow users who are pre-registered in our User table
      const email = user.email || profile?.email
      if (!email) return false

      const dbUser = await prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
        },
      })

      if (!dbUser) {
        // Not a registered admin -- deny sign-in
        return false
      }

      return true
    },
    async jwt({ token, profile }) {
      // Pass Microsoft profile info through the next-auth JWT so we can
      // read it in the microsoft-callback route via auth()
      if (profile) {
        token.microsoftId = profile.oid || profile.sub
        token.email = profile.email || profile.preferred_username
        token.name = profile.name
      }
      return token
    },
    async session({ session, token }) {
      // Attach Microsoft profile data to the session object
      if (token) {
        session.microsoftId = token.microsoftId as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
  },
  pages: {
    // Use our existing login page
    signIn: '/admin/login',
    // On error, redirect back to login with error param
    error: '/admin/login',
  },
})
