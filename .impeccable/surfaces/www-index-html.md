---
version: 1
slug: "www-index-html"
primary_target: "www/index.html"
related_targets: ["www/inbound.js","www/ui.js","www/ui.css"]
---

# Surface brief — IMM app (www/index.html and its page modules)

Scope: every authenticated-style app screen (Beranda, Inbound, Role, Monitoring, Pengaturan, sheets, gates). Visitor mode: Operate.
Audience and job: DC Tallo inbound team on Android phones at the warehouse floor, plus managers glancing. Task: know today's and tomorrow's inbound state, act on what needs attention, document putaway and handovers.
Proof/content: figures computed from the team's own Google Sheets; synthetic fixtures for preview. Constraints: Indonesian copy, no native change, no data or logic change, incumbent visual world kept (user chose "naikkan gaya sekarang").
Memorable moment: the week strip inside the answer card — seven CBM bars from yesterday to five days ahead; tapping a day moves the whole page to that date.
Unresolved: none.

## Direction contract

THESIS: Answer first, detail after. Each page's first viewport states the day's situation as one plain sentence with one large figure, then offers the work lists. It refuses the uniform stack of equal cards and rows of zeros.

OWN-WORLD: Warm-grey ground, borderless white cards, one near-black answer card per page that inverts in dark mode, amber mark, Plus Jakarta Sans with JetBrains Mono for codes. A tone glow on the answer card names the page: amber Beranda and Inbound, green Storing, orange Outbound, blue Monitoring. BU and flow colors stay as assigned.

STORY: The reader learns what is coming and how it compares with a normal day, sees up to three things that need action, then reaches the list they work from.

FIRST VIEWPORT: App bar and filter chips (44 px). Answer card: sentence, 46 px figure with unit, comparison pill, composition bar, three stats, week strip. Directly below: attention items. Primary action is a tap on a day or an attention item.

FORM: Extension inside an established world; no concept roll (no seed key).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
