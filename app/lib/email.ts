import { Resend } from 'resend'

// Fallback keeps `next build` from throwing when the key isn't present at
// build time; the real key is injected from the environment at runtime.
const resend = new Resend(process.env.RESEND_API_KEY || 're_build_placeholder')
const FROM = process.env.RESEND_FROM ?? 'admin@verifiedwork.co'

export async function sendVerificationEmail({
  to,
  validatorName,
  ownerName,
  roleTitle,
  company,
  workDone,
  metrics,
  verifyUrl,
}: {
  to: string
  validatorName: string
  ownerName: string
  roleTitle: string
  company: string
  workDone: string
  metrics: string
  verifyUrl: string
}) {
  const firstName = validatorName.split(' ')[0]
  const ownerFirst = ownerName.split(' ')[0]

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Verify ${ownerFirst}'s work</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

      <!-- wordmark -->
      <tr><td style="padding-bottom:28px;text-align:center;">
        <span style="font-size:17px;font-weight:700;letter-spacing:-.015em;color:#1a1a1a;">verified<span style="display:inline-block;width:13px;height:13px;line-height:13px;text-align:center;border-radius:50%;background:#2D6A4F;color:#fff;font-size:9px;font-weight:700;vertical-align:middle;margin:0 1px;">✓</span><span style="font-weight:400;color:#6b7280;">work</span></span>
      </td></tr>

      <!-- card -->
      <tr><td style="background:#ffffff;border-radius:20px;border:1px solid #e5e7eb;overflow:hidden;">

        <!-- green top bar -->
        <div style="height:5px;background:#2D6A4F;"></div>

        <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 36px 0;">
          <tr><td>
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#2D6A4F;">Verification request</p>
            <h1 style="margin:0 0 14px;font-size:24px;font-weight:700;letter-spacing:-.025em;color:#1a1a1a;line-height:1.2;">
              ${ownerFirst} wants you to verify their work
            </h1>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.55;">
              Hi ${firstName}, ${ownerName} listed you as someone who can speak to their work at <strong style="color:#1a1a1a;">${company}</strong>. It only takes a minute.
            </p>
          </td></tr>
        </table>

        <!-- work summary -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:0 36px 28px;">
          <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:20px 22px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#9ca3af;">Role</p>
            <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1a1a1a;">${roleTitle} · ${company}</p>
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#9ca3af;">What they did</p>
            <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.55;">${workDone}</p>
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#9ca3af;">Outcome</p>
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.55;">${metrics}</p>
          </td></tr>
        </table>

        <!-- cta -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:0 36px 36px;">
          <tr><td align="center">
            <a href="${verifyUrl}" style="display:inline-block;background:#2D6A4F;color:#ffffff;font-size:15px;font-weight:600;letter-spacing:-.01em;text-decoration:none;padding:15px 32px;border-radius:999px;">
              Verify their work &rarr;
            </a>
          </td></tr>
        </table>

      </td></tr>

      <!-- footer -->
      <tr><td style="padding-top:22px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
          You received this because ${ownerName} listed your email as a validator.<br/>
          If you don&rsquo;t know them, you can ignore this email.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `${ownerFirst} wants you to verify their work at ${company}`,
    html,
  })

  if (error) throw new Error(error.message)
}

export async function sendAccountDeletedEmail({ to, name }: { to: string; name: string }) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td style="padding-bottom:28px;text-align:center;">
        <span style="font-size:17px;font-weight:700;letter-spacing:-.015em;color:#1a1a1a;">verified<span style="display:inline-block;width:13px;height:13px;line-height:13px;text-align:center;border-radius:50%;background:#2D6A4F;color:#fff;font-size:9px;font-weight:700;vertical-align:middle;margin:0 1px;">✓</span><span style="font-weight:400;color:#6b7280;">work</span></span>
      </td></tr>
      <tr><td style="background:#ffffff;border-radius:20px;border:1px solid #e5e7eb;overflow:hidden;">
        <div style="height:5px;background:#1a1a1a;"></div>
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 36px 40px;">
          <tr><td>
            <h1 style="margin:0 0 14px;font-size:22px;font-weight:700;color:#1a1a1a;">Your account has been deleted</h1>
            <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.6;">Hi ${name}, your verifiedwork account and all associated data have been permanently removed. If this was a mistake, you can create a new account at any time.</p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding-top:22px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">You received this because your account was just deleted.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`

  const { error } = await resend.emails.send({
    from: FROM, to,
    subject: 'Your verifiedwork account has been deleted',
    html,
  })
  if (error) throw new Error(error.message)
}

export async function sendVerifiedEmail({
  to,
  ownerName,
  validatorName,
  roleTitle,
  company,
  profileUrl,
}: {
  to: string
  ownerName: string
  validatorName: string
  roleTitle: string
  company: string
  profileUrl: string
}) {
  const validatorFirst = validatorName.split(' ')[0]

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Your work at ${company} is verified</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

      <!-- wordmark -->
      <tr><td style="padding-bottom:28px;text-align:center;">
        <span style="font-size:17px;font-weight:700;letter-spacing:-.015em;color:#1a1a1a;">verified<span style="display:inline-block;width:13px;height:13px;line-height:13px;text-align:center;border-radius:50%;background:#2D6A4F;color:#fff;font-size:9px;font-weight:700;vertical-align:middle;margin:0 1px;">✓</span><span style="font-weight:400;color:#6b7280;">work</span></span>
      </td></tr>

      <!-- card -->
      <tr><td style="background:#ffffff;border-radius:20px;border:1px solid #e5e7eb;overflow:hidden;">

        <div style="height:5px;background:#2D6A4F;"></div>

        <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 36px 0;">
          <tr><td>
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#2D6A4F;">Verified</p>
            <h1 style="margin:0 0 14px;font-size:24px;font-weight:700;letter-spacing:-.025em;color:#1a1a1a;line-height:1.2;">
              Your work at ${company} is verified
            </h1>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.55;">
              ${validatorFirst} just verified your work as <strong style="color:#1a1a1a;">${roleTitle}</strong> at <strong style="color:#1a1a1a;">${company}</strong>. It&rsquo;s now stamped on your profile.
            </p>
          </td></tr>
        </table>

        <!-- detail row -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:0 36px 28px;">
          <tr><td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:20px 22px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#9ca3af;">Verified by</p>
            <p style="margin:0;font-size:15px;font-weight:600;color:#1a1a1a;">${validatorName}</p>
          </td></tr>
        </table>

        <!-- cta -->
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:0 36px 36px;">
          <tr><td align="center">
            <a href="${profileUrl}" style="display:inline-block;background:#2D6A4F;color:#ffffff;font-size:15px;font-weight:600;letter-spacing:-.01em;text-decoration:none;padding:15px 32px;border-radius:999px;">
              View your profile &rarr;
            </a>
          </td></tr>
        </table>

      </td></tr>

      <!-- footer -->
      <tr><td style="padding-top:22px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
          You&rsquo;re receiving this because your work was verified on verifiedwork.co
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Your work at ${company} is verified`,
    html,
  })

  if (error) throw new Error(error.message)
}

/* Magic-link / sign-in email, sent through Resend via the Supabase
   "Send Email" auth hook. Supabase mints the token; we send the mail. */
export async function sendMagicLinkEmail({ to, link }: { to: string; link: string }) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Sign in to verified.work</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

      <tr><td style="padding-bottom:28px;text-align:center;">
        <span style="font-size:18px;font-weight:700;letter-spacing:-.015em;color:#1a1a1a;">verified<span style="display:inline-block;width:14px;height:14px;line-height:14px;text-align:center;border-radius:50%;background:#2D6A4F;color:#fff;font-size:9px;font-weight:700;vertical-align:middle;margin:0 1px;">&#10003;</span><span style="font-weight:400;color:#6b7280;">work</span></span>
      </td></tr>

      <tr><td style="background:#ffffff;border-radius:20px;border:1px solid #e5e7eb;overflow:hidden;">
        <div style="height:5px;background:#2D6A4F;"></div>
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:38px 38px 0;">
          <tr><td>
            <p style="margin:0 0 10px;font-size:12px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#2D6A4F;">Sign in</p>
            <h1 style="margin:0 0 14px;font-size:24px;font-weight:700;letter-spacing:-.025em;color:#1a1a1a;line-height:1.2;">Your link to verified.work</h1>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">Click the button below to finish signing in. This link works on any device and expires in 60 minutes.</p>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:0 38px 8px;">
          <tr><td align="center">
            <a href="${link}" style="display:inline-block;background:#1a1a1a;color:#ffffff;font-size:15px;font-weight:600;letter-spacing:-.01em;text-decoration:none;padding:15px 34px;border-radius:999px;">Sign in to verified.work</a>
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:18px 38px 38px;">
          <tr><td>
            <p style="margin:0;font-size:12.5px;color:#9ca3af;line-height:1.6;">Or paste this link into your browser:<br/>
              <a href="${link}" style="color:#2D6A4F;word-break:break-all;">${link}</a>
            </p>
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding-top:22px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">If you didn&rsquo;t request this, you can safely ignore this email.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: 'Sign in to verified.work',
    html,
  })

  if (error) throw new Error(error.message)
}
