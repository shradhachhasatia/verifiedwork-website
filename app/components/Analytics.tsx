import Script from 'next/script'

/* Google Analytics 4. Renders nothing unless NEXT_PUBLIC_GA_ID is set, so it's
   inert in local/dev and preview builds without the env var. A GA Measurement
   ID (G-XXXXXXXX) is public, not a secret. */
export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID
  if (!id) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`}
      </Script>
    </>
  )
}
