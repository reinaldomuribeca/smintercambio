export type SendEmailInput = {
  to: string | string[]
  subject: string
  text: string
  html?: string
}

/**
 * Envia um e-mail via Resend. Retorna { error } em vez de lançar — uma falha de
 * e-mail nunca deve derrubar a operação de negócio que a disparou.
 * Centraliza a inicialização do client (antes duplicada em email-templates.ts).
 */
export async function sendEmail(input: SendEmailInput): Promise<{ error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { error: 'RESEND_API_KEY não configurado.' }

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)
  const from = process.env.RESEND_FROM_EMAIL ?? 'SM Intercâmbio <noreply@smintercambio.com.br>'

  const { error } = await resend.emails.send({
    from,
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
    text: input.text,
    ...(input.html ? { html: input.html } : {}),
  })

  if (error) {
    console.error('[email] Resend error:', error)
    return { error: 'Falha ao enviar e-mail.' }
  }
  return {}
}
