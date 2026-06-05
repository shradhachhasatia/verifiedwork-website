# verifiedwork-website

The marketing site **and** interactive product prototype for **verified.work** —
a verified professional profile platform built on intent-based hiring.

> Human validation in an AI world.

## Structure

| File | What it is |
|---|---|
| `index.html` | **The sign-up page** (front door). An animated, motion-graphic sign-up — drifting aurora background, a live **trust-graph canvas** (nodes connecting and getting verified in real time), floating verified-work chips with stamp pops, a word-cycling headline, count-up stats, a password strength meter, and a **Try verifiedwork for free** CTA. PRD-compliant fields (first name, email, password — no social login). On submit it hands off to the app's onboarding. |
| `app.html` | **The product prototype.** A responsive web app (no device frame) built in the same design language. |
| `careers.html`, `privacy.html`, `terms.html`, `blog/` | Supporting pages. |
| `favicon.*`, `og-image.*`, `apple-touch-icon.png` | Brand + social assets. |
| `assets/` | The V/W app icon and the standalone verification check mark. |

## The app (`app.html`)

A single self-contained React app (React + Babel via CDN) with a hash router, so
every screen is linkable (`app.html#/dashboard`, `#/profile`, `#/validate`, …).

**Candidate flow** — auth (with a simulated *Continue with Google* account chooser
+ email magic link) → onboarding → **dashboard** (projects with verified / pending
status, expandable) → add project → invite validator → request sent.

**Validator / endorser flow** (`#/validate`) — the standalone experience for the
person *asked* to verify someone: the request intro, four conversational steps, and
the signature **verification stamp** → "Endorsement published."

**User profile** (`#/profile`) — a rich public + owner profile: identity header with
inline **edit mode**, stat strip, contribution badges, **expandable verified-work
cards** (full quote, endorser, outcome receipt, artifact link), and an endorsements
wall.

### Design language

Inherited from the landing page: pure white surfaces, `#1A1A1A` ink, `#6B7280` grey,
a single green accent `#2D6A4F` reserved for verification (the stamp, check dots,
verified badges). **Black-pill CTAs** that turn green on hover. Inter + JetBrains
Mono. Fluid `clamp()` type, scroll-reveal animations, and the verification stamp
(`scale 0.6 → 1.08 → 1.0`). Respects `prefers-reduced-motion`.

> The Google sign-in is a **prototype simulation** — no real Google account or
> backend is involved. Wiring real Google Identity Services later needs an OAuth
> Client ID and a backend to verify tokens.

## Running

Static files — open `index.html`, or serve the folder:

```
python3 -m http.server
```
