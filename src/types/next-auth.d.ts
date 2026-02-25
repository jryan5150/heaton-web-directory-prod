import 'next-auth'

declare module 'next-auth' {
  interface Session {
    microsoftId?: string
    user: {
      email: string
      name: string
      image?: string | null
    }
  }
}
