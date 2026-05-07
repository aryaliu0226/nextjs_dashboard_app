/** @format */

import NextAuth, { User } from 'next-auth'
import { authConfig } from './auth.config'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import postgres from 'postgres'
import bcrypt from 'bcrypt'

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`
    return user[0]
  } catch (error) {
    console.error('Failed to fetch user:', error)
    throw new Error('Failed to fetch user.')
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        // Validate the credentials using Zod
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data

          // Fetch the user from the database
          const user = await getUser(email)
          if (!user) {
            return null // Return null if user is not found, NextAuth will handle the redirection to the login page
          }

          const passwordsMatch = await bcrypt.compare(password, user.password) // Replace with actual password verification logic

          // Here you should verify the password (e.g., using bcrypt)
          // For demonstration, we will assume the password is correct
          // In production, never store plain text passwords and always verify them securely

          if (passwordsMatch) {
            return user
          }
        }

        return null // Return null if authentication fails, NextAuth will handle the redirection to the login page
      },
    }),
  ], // 允许用户用户名以及密码登录
})
