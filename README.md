# verifiedwork-website

The product prototype for **verified.work** — a verified professional profile
platform built on intent-based hiring.

> Human validation in an AI world.

`index.html` is a self-contained, fully interactive prototype (React + Babel via
CDN) presented inside an iPhone frame. It walks the complete flow end to end:

**splash → sign up → magic-link sent → onboarding (name + role) → dashboard →
add project → invite validator → request sent → validator flow → public profile.**

The validator flow is the hero: four conversational steps that culminate in the
signature **verification stamp** animation and an "Endorsement published" state.
A **Tweaks** panel (bottom-right) swaps the public-profile card style between
*Classic record*, *Quote-led*, and *Receipt*.

## Design system

Built on the locked **verified.work** design system — pure white surfaces, black
`#1A1A1A` text, grey `#6B7280` secondary, and a single green accent `#2D6A4F`
reserved for the verification stamp. Inter for everything; IBM Plex Mono for IDs,
emails, and timestamps. No other colors, no emoji.

## Assets

- `assets/logo-icon.svg` — the V/W app icon (favicon + splash)
- `assets/logo-mark.svg` — the standalone verification check dot

## Running

It's a single static file. Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server
```
