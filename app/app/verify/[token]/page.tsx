import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VerifyForm from './VerifyForm'

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: req } = await supabase.rpc('get_verification_request', { p_token: token })

  if (!req) notFound()

  return <VerifyForm token={token} req={req} />
}
