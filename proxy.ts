/** @format */

import NextAuth from 'next-auth'
import { authConfig } from './auth.config'

//  https://next-auth.js.org/configuration/options
export default NextAuth(authConfig).auth

// https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
export const config = {
  // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
