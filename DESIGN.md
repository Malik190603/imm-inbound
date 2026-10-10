---
name: Mini Monitoring DC Tallo Makassar
description: Mobile-first warehouse monitoring app (Capacitor Android, Indonesian UI, light and dark) that answers the day's inbound question first and lists the detail after.
colors:
  # light theme (normative source: :root in www/index.html, --ink-3 overridden in www/ui.css)
  bg: "#F2F3F0"
  surface: "#FFFFFF"
  surface-2: "#F7F8F5"
  sunk: "#ECEEEA"
  ink: "#111820"
  ink-2: "#4B5660"
  ink-3: "#5E6870"
  line: "#E6E9E4"
  accent: "#111820"
  accent-ink: "#FFFFFF"
  mark: "#F2B230"
  mark-soft: "#FCEFCD"
  s-stock: "#1baf7a"
  s-store: "#eb6834"
  s-cust: "#2a78d6"
  bu-hci: "#2a78d6"
  bu-ahi: "#e34948"
  bu-tgi: "#6dbaf2"
  bu-fbi: "#7a5ad8"
  bu-kwi: "#f08a24"
  bu-x: "#9aa3a9"
  p1: "#86b6ef"
  p2: "#3987e5"
  p3: "#256abf"
  p4: "#184f95"
  p5: "#0d366b"
  good: "#23794A"
  good-bg: "#E2F2E8"
  warn: "#9A6100"
  warn-bg: "#FBEFD3"
  crit: "#B9382A"
  crit-bg: "#F9E2DE"
  # dark theme (:root[data-theme="dark"] and prefers-color-scheme: dark)
  bg-dark: "#0C1115"
  surface-dark: "#151C22"
  surface-2-dark: "#1A232A"
  sunk-dark: "#10161B"
  ink-dark: "#EEF2F4"
  ink-2-dark: "#A9B4BB"
  ink-3-dark: "#8D9AA2"
  line-dark: "#232E36"
  card-border-dark: "#1E2830"
  accent-dark: "#EEF2F4"
  accent-ink-dark: "#0C1115"
  mark-dark: "#E8A91F"
  mark-soft-dark: "#3A2F14"
  s-stock-dark: "#199e70"
  s-store-dark: "#d95926"
  s-cust-dark: "#3987e5"
  bu-hci-dark: "#3987e5"
  bu-ahi-dark: "#e66767"
  bu-tgi-dark: "#7cc4f6"
  bu-fbi-dark: "#9a85ea"
  bu-kwi-dark: "#f29a45"
  bu-x-dark: "#6d7a82"
  p1-dark: "#2a4f80"
  p2-dark: "#2f6bb8"
  p3-dark: "#3987e5"
  p4-dark: "#6da7ec"
  p5-dark: "#b7d3f6"
  good-dark: "#62C48D"
  good-bg-dark: "#15302A"
  warn-dark: "#E5B24F"
  warn-bg-dark: "#33291A"
  crit-dark: "#F07D6B"
  crit-bg-dark: "#3B201C"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "46px"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.035em"
    fontFeature: "tabular-nums"
  headline:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "15.5px"
    fontWeight: 700
    letterSpacing: "-0.01em"
  lead-sentence:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.45
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 500
    letterSpacing: "-0.01em"
    fontFeature: "tabular-nums"
rounded:
  r-lg: "22px"
  r: "16px"
  inner: "14px"
  icon: "12px"
  sheet: "26px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  lead: "18px"
components:
  lead:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.r-lg}"
    padding: "18px 18px 16px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r-lg}"
    padding: "16px"
  tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r-lg}"
    padding: "14px 16px 16px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "0 13px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
    height: "44px"
  button-ghost:
    backgroundColor: "{colors.sunk}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
    height: "44px"
  icon-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    size: "40px"
  attention-warn:
    backgroundColor: "{colors.warn-bg}"
    textColor: "{colors.warn}"
    rounded: "{rounded.r}"
    padding: "10px 14px"
    height: "56px"
  attention-crit:
    backgroundColor: "{colors.crit-bg}"
    textColor: "{colors.crit}"
    rounded: "{rounded.r}"
    padding: "10px 14px"
    height: "56px"
  attention-calm:
    backgroundColor: "{colors.good-bg}"
    textColor: "{colors.good}"
    rounded: "{rounded.r}"
    padding: "12px 14px"
  tag:
    backgroundColor: "{colors.sunk}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  search:
    backgroundColor: "{colors.sunk}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "44px"
  field:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.inner}"
    padding: "12px 14px"
    height: "44px"
  nav:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-3}"
    rounded: "24px"
    padding: "6px"
  nav-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "18px"
---

# Design System: Mini Monitoring DC Tallo Makassar

## Overview

**Creative North Star: "Jawaban Dulu" (answer first, detail after)**

Mini Monitoring (formerly IMM) is an Operate-mode tool read one-handed on an Android phone on the warehouse floor, and glanced at by managers. Every page opens with one near-black answer card that states the day's situation as a plain Indonesian sentence and one large figure with its unit; everything below it is a work list. The surrounding world is quiet on purpose: a warm-grey ground, borderless white cards, pill-shaped controls, and one amber mark.

Colour carries meaning, never decoration. Green, orange and blue are bound to the three flows (Storing, Store/Outbound, Customer); five fixed hues are bound to the business units; amber, red and green tints mark what needs action. The answer card inverts with the theme (near-black in light, near-white in dark), so it stays the loudest surface on the page in both.

Density is moderate: 16 px gutters, 16 px between cards, 12 px minimum text. Empty data does not take room: rows with a zero value collapse into one dashed summary line.

**Key Characteristics:**
- One answer card per page, at the top, in the accent colour, with a page-tone glow.
- Warm-grey ground, borderless white cards, soft low shadow; borders appear only in dark mode.
- Plus Jakarta Sans for everything read, JetBrains Mono for everything looked up (LC, container, LPN, dept codes, clock times).
- Every number carries a unit and tabular figures.
- Attention items (at most three) sit directly under the answer card; a calm green line replaces them when there is nothing to act on.
- Self-hosted fonts and inline SVG icons; the app renders without a network.

## Colors

A warm neutral ground with one dark accent, one amber mark, and a fixed set of meaning-bearing hues. Values live in the frontmatter; every `name` below is the CSS custom property `--name`, and each has a `-dark` counterpart.

### Primary
- **Ink Accent** (`accent` / `accent-ink`): the answer card, selected chips, primary buttons, the bottom-nav pill, the brand mark. In dark mode the pair swaps to near-white on near-black.
- **Amber Mark** (`mark`, `mark-soft`): the brand base line, the default answer-card tone (Beranda, Inbound), the selected week bar, the today underline, schedule timeline dots, the first-rank badge and the Putaway tile icon. Text on `mark` is dark brown (`#1B1403` / `#2b1f00` in the build), never white.

### Secondary
- **Flow colours** (`s-stock` green, `s-store` orange, `s-cust` blue): composition bars, legend dots, and the answer-card tone for Storing (`stock`), Outbound (`out`) and Monitoring (`mon`).
- **BU colours** (`bu-hci` blue, `bu-ahi` red, `bu-tgi` light blue, `bu-fbi` purple, `bu-kwi` orange, `bu-x` grey for unknown): the dot in a BU chip or badge and the fill of that BU's bar. A BU badge background is its colour at 14% over transparent with `ink` text.

### Tertiary
- **Status pairs** (`good`/`good-bg`, `warn`/`warn-bg`, `crit`/`crit-bg`): attention items, tags, insight icon tiles, damaged-LPN cards, field errors. Always used as a pair: the strong colour is text or icon on its own tint.
- **Position ramp** (`p1`–`p5`): the five container stages (POO, Berlayar, Yard, Dooring, Delivered); `p3` is also the "done" fill for step bars and the journey timeline. The ramp runs light-to-dark in light mode and dark-to-light in dark mode.

### Neutral
- **Warm Ground** (`bg`): page background and the translucent app bar (86% over a 16 px blur).
- **Card** (`surface`), **Inset** (`surface-2`: stat cells, option tiles, fields), **Well** (`sunk`: tracks, segmented controls, search, icon tiles).
- **Ink** (`ink`: text and figures), **Ink 2** (`ink-2`: secondary text, icons), **Ink 3** (`ink-3`: captions, hints, units).
- **Line** (`line`): row dividers, dashed zero line, chart grid.

### Named Rules
**The Tone Rule.** The answer card takes exactly one tone via `data-tone`: `mark` for Beranda and Inbound, `stock` for Storing, `out` for Outbound, `mon` for Monitoring. The tone colours the glow, the selected week bar and the today underline, and nothing else on the card.

**The Bound Colour Rule.** Flow and BU hues mean one thing each. They are never reused for emphasis, decoration, or a different category.

**The 4.5 Rule.** `ink`, `ink-2` and `ink-3` hold at least 4.5:1 on `surface`, `surface-2`, `bg` and `sunk`; each status colour holds 4.5:1 on its own tint and on `surface`/`surface-2`; `accent-ink` on `accent` likewise. `tests/ui.test.mjs` enforces this in both themes, and any new text token joins that test.

## Typography

**Display Font:** Plus Jakarta Sans (with system-ui, -apple-system, Segoe UI, Roboto, sans-serif)
**Body Font:** Plus Jakarta Sans (same stack)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, Menlo, Consolas, monospace)

**Character:** One geometric sans in two voices: weight 800 with tight tracking for figures and page titles, weight 400–700 for reading. Mono marks identifiers the reader matches against a sheet or a label. Both families are variable woff2 files in `www/fonts/` (weights 200–800 and 100–800), loaded with `font-display: swap`.

### Hierarchy
- **Display** (800, 46px, line-height 0.95, -0.035em): the answer-card figure, followed by its unit at 16px/700 in a dimmed accent-ink. Secondary figures step down through 42px and 32px (Inbound tiles), 24–19px (stat cells, attention counts).
- **Headline** (800, 26px, 1.15, -0.02em): page greeting and gate titles. Sub-page and compact headers use 21–22px at the same weight and tracking.
- **Title** (700, 15.5px, -0.01em): section heading inside a card, paired with a one-line explanation at 12.5px in `ink-3`.
- **Lead sentence** (500, 15px, 1.45): the answer card's sentence; the key phrase is set at 800 in full accent-ink while the rest sits at 82% accent-ink.
- **Body** (400, 14px, 1.5, word-spacing 0.05em): rows and running text; row titles 13.5–14.5px at 600–700.
- **Label** (600–700, 12px): captions, units, tags, nav labels, chart axes.
- **Mono** (500, 13–15px, -0.01em): LC numbers, container numbers, LPN IDs, dept codes, and schedule times (13px/600).

### Named Rules
**The 12 px Floor Rule.** No rendered text is smaller than 12px. The floor is enforced by a class list in `www/ui.css` and by the display tests at 360, 400 and 1280 px.

**The Unit Rule.** A figure never appears alone: it carries its unit (CBM, TEUs, LC, pcs) in a smaller, dimmer weight beside it, and uses tabular figures.

**The Compact Number Rule.** In narrow slots, values of 10,000 and above are shortened with Indonesian units and a decimal comma: `12,3 rb`, `1,2 jt`, `2,5 M` (`IMMUi.compact`).

## Layout

One column of cards on a 16 px gutter, 16 px apart, inside a 1120 px maximum width. A sticky translucent app bar holds the brand, the sync pill, and a horizontally scrolling filter strip of 44 px chips. On phones a floating five-tab bar sits 12 px above the bottom safe area and the page reserves 124 px beneath its content; from 900 px the tabs move into the app bar as a pill group and the floating bar is removed.

Page order is fixed: greeting or page head, answer card, attention items, insights, then work lists. Inside cards, the header pads 16 px and the body 12–16 px; rows are separated by a 1 px `line` and the last row has none.

Responsive behaviour observed in the build:
- **≥ 900 px:** answer cards holding a week strip or a stage pipeline become two columns with a 36 px gap and a vertical hairline; week bars grow from 34 px to 92 px tall. Inbound tiles go from two columns to `2fr 1fr 1fr`. Segmented controls and search cap at 440 px.
- **≤ 860 px:** two-column card grids collapse to one.
- **≥ 760 px:** bottom sheets become centred dialogs (max 620 px wide).
- **≤ 560 px:** the five-stage pipeline tightens and hides its sub-captions.
- **≤ 389 px:** the bottom bar insets drop to 6 px and its labels tighten.

No page scrolls sideways at 360, 400 or 1280 px; grid tracks are `minmax(0,1fr)` and long strings use `overflow-wrap: anywhere` or ellipsis. Horizontal scrolling is reserved for the filter strip, the insight carousel and the day picker, all with hidden scrollbars and scroll snap.

### Named Rules
**The 44 Rule.** Chips, buttons, segmented options, search fields, selects, inputs and setting rows are at least 44 px tall. Icon-only buttons (carousel arrows, sheet close, glossary "i", photo delete, back) are 40 × 40 px.

**The Zero Line Rule.** Rows whose value is zero are not listed. When some rows have values and others do not, the empty ones become one sentence under a dashed top border ("4 BU lain belum ada kiriman").

## Elevation & Depth

Layered but low. Cards float on the ground with one soft two-part shadow and no border in light mode; in dark mode the shadow deepens and a 1 px `card-border` appears, since shadow alone does not separate dark surfaces. Inside a card, depth is tonal: `surface-2` insets and `sunk` wells, never nested shadows. The app bar and bottom bar are translucent with a backdrop blur.

### Shadow Vocabulary
- **Card** (`--shadow`: `0 1px 2px rgba(17,24,32,.04), 0 10px 30px -18px rgba(17,24,32,.22)`; dark: `0 1px 2px rgba(0,0,0,.3), 0 10px 30px -16px rgba(0,0,0,.7)`): cards, the answer card, tiles, chips, the sync pill, icon buttons, selected option tiles, the segmented knob.
- **Floating bar** (`--shadow` plus `0 12px 40px -16px rgba(0,0,0,.35)`): the bottom tab bar only.
- **Gate card** (`0 30px 80px -30px rgba(0,0,0,.5)`): the role-question card over its blurred scrim.
- **Ring** (`0 0 0 2px`–`3px var(--surface)`): cut-out ring around notification badges and timeline dots.

### Named Rules
**The Tone Glow Rule.** The only gradient in the system is the answer card's glow: a 260 px radial of the page tone at 55% fading to transparent, at 50% opacity, clipped in the top-right corner. No other surface carries a gradient.

## Shapes

Round and soft throughout. Cards, the answer card and Inbound tiles use 22 px (`--r-lg`); attention items, insight cards and stage cells use 16 px (`--r`); inset stat cells, option tiles and form fields use 14 px; icon tiles use 10–12 px; sheets use 26 px on the top corners. Every control that is tapped as a single action (chips, buttons, segmented controls, search, tags, badges, progress tracks) is a full pill (999 px), and icon buttons are circles.

Borders are rare: a 1 px `line` between rows, a 1.5 px `line` border on form fields and LPN cards, a 1.5 px transparent border on selectable tiles that turns `accent` (or `ink`) when pressed, and a 1.5 px dashed `line` for empty pick states. Bars have rounded ends; week bars are rounded more at the top (5 px) than the base (2 px).

Icons are inline SVG line icons, stroke 1.5–2.2 with round caps, sized 13–22 px, coloured by `currentColor`.

## Components

Components are HTML string builders in `www/ui.js` (shared) with pure helpers in `www/ui-core.js`; styles are in `www/ui.css` and `www/inbound.css` over the base in `www/index.html`. The Mini Monitoring layer (v2.0) adds `www/mm.js` + `www/mm.css` (session, navigation, BU filter, KPI cards, hub, Settings), `www/dash.js` (department dashboards), `www/menus.js`, `www/forms.js` and `www/lp.js`.

### Answer card (`lead`)
The signature. `lead({tone, headline, value, unit, delta, body, stats, foot, empty})`.
- **Shape and colour:** `accent` background, `accent-ink` text, 22 px radius, padding 18/18/16, 14 px gap, card shadow, tone glow.
- **Contents, in order:** sentence (15px/500); figure (46px/800) with unit; comparison pill (12.5px/700, accent-ink at 12%, arrow up, rotated for down, equals sign for "Setara"); optional body (10 px composition bar, stage pipeline, or Putaway filter cells); two to four stat cells (12px label over 19px/800 value); optional week strip.
- **Dimmed text** inside the card is mixed from `accent-ink` into `accent` (82%, 72%, 70%, 66%), not taken from the `ink-*` tokens.
- **Empty state:** the figure drops to 55% accent-ink; the sentence says what is missing.

### Week strip (`weekStrip`)
Seven buttons from yesterday to five days ahead (`IMMUi.weekDays`), each a compact value, a bar scaled to the week's maximum (min 3 px), and a day label ("Min 4"). Separated from the card content by a hairline of accent-ink at 16%.
- **Unselected:** bar at accent-ink 38%.
- **Selected** (`aria-pressed="true"`): accent-ink 13% backdrop, bar in the page tone, value in full accent-ink.
- **Today:** label at 800 with a 2 px tone-coloured underline.
- A day with no volume shows an en dash. When the filter is a range, no day is selected.

### Attention list (`attention`)
Up to three items under the answer card. Each is a 56 px-minimum row with 16 px radius: count with unit (20px/800) in the status colour, label (13.5px/700 `ink`) with an optional sub-line (12px `ink-2`), and a chevron when tappable.
- **Tappable:** filled `warn-bg` or `crit-bg`.
- **Informational (not tappable):** no fill, a 1.5 px inset ring in the tint.
- **None:** one calm line on `good-bg` with a check icon: "Tidak ada yang perlu ditindak".

### Section head (`secHead`)
A 30 px `sunk` icon tile (10 px radius), the title (15.5px/700) with an inline count hint (12px `ink-3`), a one-line explanation (12.5px `ink-3`), and, where the section uses a warehouse term, a 40 px "i" button that opens the glossary sheet for just those terms (`IMMUi.GLOSSARY`).

### Cards and tiles
- **Card:** `surface`, 22 px radius, card shadow, transparent border (visible only in dark).
- **Inbound tile:** a whole-card button with a 36 px icon tile, a title (14px/700 `ink-2`), a figure (32px, 42px when wide) with unit, optional tags, and a chevron. The Putaway tile's icon sits on `mark`.
- **Stat cell:** `surface-2`, 14 px radius, 12px label over a 20–22px/800 value; as a filter (`put-sum`) it takes a status tint and a 1.5 px selected border.
- **LPN card:** `surface-2` with a 1.5 px `line` border and 18 px radius; a damaged LPN takes a `crit` border on `crit-bg`.

### Buttons
- **Shape:** pill, 44 px minimum height, 13.5px/700, 8 px icon gap.
- **Primary:** `accent` on `accent-ink`. **Ghost:** `sunk` with `ink` text. **Small:** 12.5px text at the same 44 px height. **Block:** full width; form submits use 15px text with 13–14 px vertical padding.
- **Press:** scale to 0.97 over 160 ms. **Disabled:** opacity 0.35–0.55.
- **Focus:** `outline: 2px solid var(--ink); outline-offset: 2px`. Inside the answer card (`.lead`) the outline uses `--accent-ink` so it stays visible on the inverted ground.

### Chips, tags and badges
- **Filter chip:** `surface` pill with card shadow, 13px/600 `ink-2`, an 8 px BU dot where relevant; selected is `accent`/`accent-ink`. The period chip shows a calendar icon and the date range in `ink-3`.
- **Tag:** 12px/700 pill on `sunk`; `good`, `warn`, `crit` and `mark` variants use the status pair.
- **BU badge:** 12px/700 pill with a 7 px dot, tinted at 14% of the BU colour.
- **Percent pill:** 12px/700 on `sunk`, right of an 8 px progress track.

### Segmented control
A `sunk` pill with a sliding `surface` knob carrying the card shadow (400 ms); options are 13px/700, `ink-3` unselected and `ink` selected.

### Inputs
- **Search:** `sunk` pill, 44 px, magnifier icon, no border.
- **Form field (Inbound):** `surface-2` with a 1.5 px `line` border, 14 px radius, 15px text, label above at 12.5px/700 `ink-2`. Focus turns the border `accent`; an error turns it `crit` with a 12px/600 `crit` message beneath.
- **Sheet field:** `sunk`, no border, 12 px radius, 13.5px text.

### Rows and timeline
- **Row:** two-line item with a right-aligned figure and unit, divided by a 1 px `line`; whole row is the tap target.
- **Bar row:** label, count hint and value over an 8 px `sunk` track with a coloured fill and a percent pill.
- **Schedule timeline:** a 54 px mono time column, a 2 px `line` rail, a 10 px `mark` dot with a 3 px `surface` ring, and the container rows for that hour beside it.

### Navigation
- **Three tabs:** Home, List, Settings. **Bottom bar (phones):** `surface` at 90% with an 18 px blur, 24 px radius, a 21 px icon over a 12.5px/600 label; an `accent` pill (18 px radius) slides under the selected tab over 450 ms and its label turns `accent-ink`. A 9 px `crit` dot or a count badge marks a tab with something pending (Work Order waiting for approval, unread notifications).
- **Top tabs (≥ 900 px):** the same three tabs as a `sunk` pill group with a sliding `accent` pill.
- **Routes** live in the hash (`#home`, `#list`, `#list/<menu>/<sub>`, `#set`); the Android back button goes sub menu → List → Home → exit.
- **List head (`listHead`):** back chevron, menu title, and either a department picker (`dept-pick`, 56 px row with a 40 px icon) for Dashboard or a segmented control for the menu's sub pages.

### Hub (List tab)
A two-column grid of menu tiles (`hub-i`, 140 px minimum, `surface`, `--r-lg`), each with an icon tile, title (14px/700) and a one-line description; only the menus the signed-in role and jabatan may open are drawn (`IMMAuth.visibleMenus`).

### KPI card (`kc`)
The Home and dashboard unit. `surface`, `--r-lg`, card shadow, 132 px minimum, padding 14/14/16.
- **Head row:** 36 px icon tile (tinted `good`/`warn`/`crit` by state), a date pill (`kc-d`) and a chevron when it links somewhere. The label (13px/700 `ink-2`) sits under the head row, never squeezed beside it.
- **Figure:** 30px/800 tabular, unit in `small`; optional 8 px progress bar (`kc-bar`) and one sub-line (12px `ink-3`).
- **States:** loading draws two skeleton bars (`kc-sk`); error shows a `crit` line "Data belum bisa dimuat" with "Ketuk untuk coba lagi"; missing shows an info line "Belum tersambung ke data". A card never shows 0 for data it could not read.
- `kc.wide` spans both columns.

### Not wired (`notWired`)
A plain card with an info icon, a bold title and one sentence saying which source is missing. Used for figures the owner has not supplied a sheet for yet; the full list is in Settings → Data yang belum tersedia.

### BU filter (`buChip` / `openBU`)
A chip showing the brand logos of the selected BU (28 px high on a fixed light plate `#F6F7F4`, 8 px radius, so logos stay legible in dark mode) or a grid icon with "Semua BU". It opens a sheet of 56 px options: logo stack, BU code (bold) and brand names (12px `ink-3`), a check on the selected one. HCI = Informa, Informa Custom, Informa Electronics, Selma; AHI = Azko, Ataru; KWI = Krisbow; TGI = Toys Kingdom; FBI = Chatime.

### Login gate
A full-screen dialog over the scrim with one 28 px-radius card (max 420 px): app mark, "Mini Monitoring / DC Tallo Makassar", a strip of eight brand logos, a single NIK field (text keyboard with capitals, since some NIK start with a letter, 44 px+) and a block primary button. Errors appear under the field in `crit`. The NIK is checked against the Master User APK sheet; only the signed-in user's own name is kept, the user list is cached as NIK, role and jabatan only.

### Notification banner
A 56 px `mark-soft` row at the top of Home with a 36 px icon, a one-line message and a chevron; it opens the notification sheet.

### Forms (Work Order, Observasi, Jadwal)
`mm-form` fields reuse the Inbound form field. Choice lists use chips (`kchips`) that wrap; photos use a three-column thumbnail grid (`ph-grid`, 1–4 photos) with Kamera and Galeri buttons. Status changes are buttons in the detail sheet, shown only when the signed-in user may make that move; a refused move explains why in a toast.

### Sheets
Bottom sheet with a grab handle, 26 px top corners and a scrim (`rgba(8,12,15,.45)`), sliding in over 450 ms; a centred dialog from 760 px. The header carries an 18px/800 title, a meta line and a 40 px close button.

### Motion
One easing, `--ease: cubic-bezier(.22,.8,.24,1)`. Page children rise 16 px and fade in over 600 ms with a 60 ms stagger; bars grow from their origin over 600–1000 ms; week bars stagger 45 ms. State changes (press, colour, knob, pill) run 160–450 ms. Both `prefers-reduced-motion: reduce` and the in-app "Kurangi animasi" switch (`html.calm`) collapse all animation and transition durations.

## Do's and Don'ts

### Do:
- **Do** open every legacy page (Inbound, Demand Storing/Outbound, Monitoring Kontainer, LPPBDO) with exactly one answer card: a sentence, one figure with its unit, and the page's tone (`mark`, `stock`, `out`, `mon`). Home and the department dashboards use KPI cards instead.
- **Do** show "Belum tersambung" rather than a zero when a figure has no source sheet.
- **Do** put what needs action directly under the answer card, at most three items, and show the calm green line when there are none.
- **Do** keep text at 12 px or larger, controls at 44 px or taller, and icon-only buttons at 40 px.
- **Do** set codes and clock times in JetBrains Mono, and all figures in tabular numerals with a unit.
- **Do** use the status colour on its own tint (`warn` on `warn-bg`, `crit` on `crit-bg`, `good` on `good-bg`).
- **Do** collapse zero-value rows into one dashed zero line.
- **Do** give a section a one-line explanation and a glossary "i" when it uses a warehouse term.
- **Do** define every new colour for both themes, in both dark blocks (`prefers-color-scheme` and `data-theme="dark"`), and add text tokens to the contrast test.
- **Do** build with `minmax(0,1fr)` tracks and wrapping or ellipsis so nothing scrolls sideways at 360, 400 and 1280 px.

### Don't:
- **Don't** put a second accent-coloured card on a page; the answer card is the only inverted surface.
- **Don't** use a flow or BU colour for anything but its flow or BU.
- **Don't** add gradients beyond the answer card's tone glow, or shadows beyond the vocabulary above.
- **Don't** draw borders around cards in light mode; separate with the ground, the shadow and tonal insets.
- **Don't** use the `ink-*` tokens for dimmed text on the answer card; mix `accent-ink` into `accent` as the build does.
- **Don't** put white text on `mark`; use the dark brown on-mark ink.
- **Don't** load fonts or icons from the network; fonts stay in `www/fonts/` and icons stay inline SVG.
- **Don't** show a figure without its unit, or a personal customer name anywhere.
