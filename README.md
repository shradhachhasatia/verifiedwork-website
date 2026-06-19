# verifiedwork-website

The marketing site **and** interactive product prototype for **verified.work** -
a verified professional profile platform built on intent-based hiring.

> Human validation in an AI world.

## Structure

| File | What it is |
|---|---|
| `index.html` | **The landing page** (front door). One marketing page - no waitlist. Hero with a self-verifying **profile motion graphic** (work entries slide in and get stamped *Verified* on a loop), a word-cycling headline, a **"How verified.work helps you"** section, a 3-step how-it-works, a **product screenshots** showcase (browser-framed mockups of the profile, validator flow and add-work), the **research articles** (expandable stat cards), and **Try verifiedwork for free** CTAs into the app. |
| `app.html` | **The product prototype.** A responsive web app (no device frame) built in the same design language. Starts **blank** - your real data, no mock projects. |
| `careers.html`, `privacy.html`, `terms.html`, `blog/` | Supporting pages. |
| `favicon.*`, `og-image.*`, `apple-touch-icon.png` | Brand + social assets. |
| `assets/` | The V/W app icon and the standalone verification check mark. |

## The app (`app.html`)

A single self-contained React app (React + Babel via CDN) with a hash router, so
every screen is linkable (`app.html#/dashboard`, `#/profile`, `#/validate`, …).

**Candidate flow** - auth (with a simulated *Continue with Google* account chooser
+ email magic link) → onboarding → **dashboard** (projects with verified / pending
status, expandable) → add project → invite validator → request sent.

**Validator / endorser flow** (`#/validate`) - the standalone experience for the
person *asked* to verify someone: the request intro, four conversational steps, and
the signature **verification stamp** → "Endorsement published."

**User profile** (`#/profile`) - a rich public + owner profile: identity header with
inline **edit mode**, stat strip, contribution badges, **expandable verified-work
cards** (full quote, endorser, outcome receipt, artifact link), and an endorsements
wall.

**Onboarding & adding work** are now multi-step wizards with a **progress bar**
and only a few fields per screen (less fatigue). Adding a project captures a
**date range** ("how long"), an **artifact** (link, image, or file you can open),
and a verifier with a live **tiered trust-badge** preview (Company / Academic /
Peer). The **validator flow** groups its questions onto two screens with a
progress bar, and an owner can **edit their profile** or **delete their account**
(with a confirm dialog).

### Design language

Pure white surfaces, `#1A1A1A` ink, `#6B7280` grey, a single green accent
`#2D6A4F` reserved for verification (the stamp, check dots, verified badges).
**Black-pill CTAs** that turn green on hover. Typeface pairing: **Inter** for
everything, **Space Grotesk** for labels/eyebrows (replacing the previous
monospace). Fluid `clamp()` type, scroll-reveal animations, and the verification
stamp (`scale 0.6 → 1.08 → 1.0`). Respects `prefers-reduced-motion`.

> The Google sign-in is a **prototype simulation** (one click → a brief
> "Connecting to Google…" → you're in) - no real Google account or backend is
> involved. Real Google Identity Services later needs an OAuth Client ID and a
> backend to verify tokens.

## Running

Static files - open `index.html`, or serve the folder:

```
python3 -m http.server
```
