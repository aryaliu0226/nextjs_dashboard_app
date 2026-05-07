/** @format */
'use server'

import { z } from 'zod'
import postgres from 'postgres'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'
import { signIn } from '@/auth'

export type State = {
  message?: string | null
  errors?: {
    customerId?: string[]
    amount?: string[]
    status?: string[]
  }
}

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Customer selection is required.',
    required_error: 'Customer selection is required.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Amount must be greater than zero.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Status selection is required.',
    required_error: 'Status selection is required.',
  }),
  date: z.string(),
})

const CreateInvoice = FormSchema.omit({ id: true, date: true })

export async function createInvoice(
  prevState: State,
  formData: FormData,
): Promise<State> {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    }
  }

  const { customerId, amount, status } = validatedFields.data
  const amountInCents = amount * 100
  const date = new Date().toISOString().split('T')[0]

  try {
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    }
  }

  revalidatePath('/dashboard/invoices') // Force the invoices page to re-render and show the new invoice
  redirect('/dashboard/invoices') //
}

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true })

// ...

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })

  const amountInCents = amount * 100

  try {
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `
  } catch (error) {
    console.error(error)
    return {
      message: 'Database Error: Failed to Update Invoice.',
    }
  }

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

export async function deleteInvoice(id: string) {
  // throw new Error(
  //   'Delete functionality is currently disabled for safety reasons.',
  // )
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`
  } catch (error) {
    return {
      message: 'Database Error: Failed to Delete Invoice.',
    }
  }
  revalidatePath('/dashboard/invoices')
}

//
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    // Use the signIn function from next-auth to authenticate the user with credentials provider
    await signIn('credentials', formData)
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.'
        default:
          return 'Something went wrong.'
      }
    }
    throw error
  }
}
