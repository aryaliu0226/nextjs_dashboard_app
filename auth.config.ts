/** @format */

import type { NextAuthConfig } from 'next-auth'

// https://next-auth.js.org/configuration/options
export const authConfig = {
  // https://next-auth.js.org/configuration/options#pages
  pages: {
    signIn: '/login', // 自定义登录页面路径,如果没有会被默认页面覆盖
    // signOut: '/auth/signout',
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // (used for check email message)
    // newUser: '/auth/new-user', // New users will be direc
  },

  // https://next-auth.js.org/configuration/options#callbacks
  callbacks: {
    // https://next-auth.js.org/configuration/callbacks#authorized-callback
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      return true
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig
