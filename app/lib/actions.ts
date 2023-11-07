'use server';

import { z } from "zod";
import { createClient } from "@/app/lib/data";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const InvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = InvoiceSchema.omit({ id: true, date: true });
const UpdateInvoice = InvoiceSchema.omit({ date: true });
 
export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  const client = await createClient(); 
  try {
    await client.query(`INSERT INTO invoices (customer_id, amount, status, date)
                       VALUES ($1, $2, $3, $4)`,
                       [customerId, amountInCents, status, date]);


  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to write new invoice.' + client.database);
  } finally {
    client.end();
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    id: id,
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  const client = await createClient(); 
  try {
    await client.query(`UPDATE invoices
                       SET customer_id = $1, amount = $2, status = $3
                       WHERE id = $4`,
                       [customerId, amountInCents, status, id]);


  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to write new invoice.' + client.database);
  } finally {
    client.end();
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {

  const client = await createClient(); 
  try {
    await client.query(`DELETE FROM invoices
                       WHERE id = $1`,
                       [id]);


  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to write new invoice.' + client.database);
  } finally {
    client.end();
  }

  revalidatePath('/dashboard/invoices');
}
