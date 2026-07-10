import Script from 'next/script'

/* Google Analytics 4. A GA Measurement ID (G-XXXXXXXX) is public, not a secret,
   so the production ID ships as the default; NEXT_PUBLIC_GA_ID can override it
   (e.g. a separate property for a staging environment) or disable tracking by
   setting it to an empty string. */
const DEFAULT_GA_ID = 'G-DYH41RCLYV'

export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID ?? DEFAULT_GA_ID
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
// Privacy-first: deny all storage so GA4 runs cookieless - no cookies and no
// personal data are stored on anyone's device. GA still reports aggregate,
// non-identifying traffic (pageviews, events, sources).
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied'
});
gtag('js', new Date());
gtag('config', '${id}');`}
      </Script>
    </>
  )
}
