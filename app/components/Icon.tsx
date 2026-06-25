import type { CSSProperties, ReactNode } from 'react'

type IconName =
  | 'check' | 'arrowLeft' | 'arrowRight' | 'arrowUpRight' | 'chevronDown' | 'x'
  | 'plus' | 'crown' | 'layers' | 'handshake' | 'info' | 'inbox' | 'share'
  | 'mapPin' | 'shield' | 'fileText' | 'logout' | 'grid' | 'user' | 'send'
  | 'link' | 'image' | 'paperclip' | 'upload' | 'trash' | 'camera' | 'calendar'
  | 'globe'

// Icon set ported from the static mockup so the look matches exactly.
export function Icon({
  name, size = 20, stroke = 1.8, color = 'currentColor', style,
}: {
  name: IconName; size?: number; stroke?: number; color?: string; style?: CSSProperties
}) {
  const P = {
    fill: 'none', stroke: color, strokeWidth: stroke,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
  const paths: Record<IconName, ReactNode> = {
    check: <polyline points="20 6 9 17 4 12" {...P} />,
    arrowLeft: <><line x1="19" y1="12" x2="5" y2="12" {...P} /><polyline points="12 19 5 12 12 5" {...P} /></>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12" {...P} /><polyline points="12 5 19 12 12 19" {...P} /></>,
    arrowUpRight: <><path d="M7 17L17 7" {...P} /><path d="M8 7h9v9" {...P} /></>,
    chevronDown: <polyline points="6 9 12 15 18 9" {...P} />,
    x: <><line x1="18" y1="6" x2="6" y2="18" {...P} /><line x1="6" y1="6" x2="18" y2="18" {...P} /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" {...P} /><line x1="5" y1="12" x2="19" y2="12" {...P} /></>,
    crown: <path d="M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8z" {...P} />,
    layers: <><polygon points="12 2 2 7 12 12 22 7 12 2" {...P} /><polyline points="2 17 12 22 22 17" {...P} /><polyline points="2 12 12 17 22 12" {...P} /></>,
    handshake: <><path d="m11 17 2 2a1 1 0 1 0 3-3" {...P} /><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4" {...P} /><path d="m21 3 1 11h-2" {...P} /><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3" {...P} /><path d="M3 4h8" {...P} /></>,
    info: <><circle cx="12" cy="12" r="10" {...P} /><line x1="12" y1="16" x2="12" y2="12" {...P} /><line x1="12" y1="8" x2="12.01" y2="8" {...P} /></>,
    inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" {...P} /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" {...P} /></>,
    share: <><circle cx="18" cy="5" r="3" {...P} /><circle cx="6" cy="12" r="3" {...P} /><circle cx="18" cy="19" r="3" {...P} /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" {...P} /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" {...P} /></>,
    mapPin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" {...P} /><circle cx="12" cy="10" r="3" {...P} /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...P} /><path d="m9 12 2 2 4-4" {...P} /></>,
    fileText: <><path d="M14 3v4a1 1 0 0 0 1 1h4" {...P} /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" {...P} /><path d="M9 13h6M9 17h4" {...P} /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...P} /><polyline points="16 17 21 12 16 7" {...P} /><line x1="21" y1="12" x2="9" y2="12" {...P} /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" {...P} /><rect x="14" y="3" width="7" height="7" rx="1" {...P} /><rect x="3" y="14" width="7" height="7" rx="1" {...P} /><rect x="14" y="14" width="7" height="7" rx="1" {...P} /></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" {...P} /><circle cx="12" cy="7" r="4" {...P} /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" {...P} /><path d="M22 2 11 13" {...P} /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" {...P} /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" {...P} /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" {...P} /><circle cx="9" cy="9" r="2" {...P} /><path d="m21 15-3.5-3.5a2 2 0 0 0-2.8 0L6 21" {...P} /></>,
    paperclip: <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" {...P} />,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" {...P} /><polyline points="17 8 12 3 7 8" {...P} /><line x1="12" y1="3" x2="12" y2="15" {...P} /></>,
    trash: <><polyline points="3 6 5 6 21 6" {...P} /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...P} /></>,
    camera: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" {...P} /><circle cx="12" cy="13" r="3" {...P} /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" {...P} /><line x1="16" y1="2" x2="16" y2="6" {...P} /><line x1="8" y1="2" x2="8" y2="6" {...P} /><line x1="3" y1="10" x2="21" y2="10" {...P} /></>,
    globe: <><circle cx="12" cy="12" r="10" {...P} /><path d="M2 12h20" {...P} /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" {...P} /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0, ...style }} aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

// LinkedIn brand glyph (filled). Pass a color to override the default brand blue.
export function LinkedInLogo({ size = 16, color = '#0A66C2' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: 'block', flexShrink: 0 }} aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}

export function CheckDot({ size = 18 }: { size?: number }) {
  return (
    <span className="check-dot" style={{ width: size, height: size }}>
      <Icon name="check" size={size * 0.62} color="#fff" stroke={2.8} />
    </span>
  )
}

export function Wordmark() {
  return (
    <span className="wm">
      <span>verified</span>
      <span className="check">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span className="work">work</span>
    </span>
  )
}
