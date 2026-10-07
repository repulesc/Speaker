# Prompt for another AI: collecting speaker data

Copy everything between the lines into the other AI (one batch of 5–10 speakers at a time; the AI
must be able to open web pages, not only answer from memory). Paste what it returns back to Claude:
each entry is then checked against the real page (`tools/speakers/check-draft.ts`), so a wrong or
invented number is caught instead of shipped.

---

You are collecting facts about loudspeakers for a free, open-source speaker placement app. Accuracy
matters more than completeness. A wrong number is worse than a missing one.

SPEAKERS (make and exact model):
1. …
2. …

RULES
- Open and read a real web page for each speaker. Never answer from memory. If you cannot open a
  page, say "no page" for that speaker. Do not guess.
- Best source: the maker's spec page or manual (including archived copies on web.archive.org).
  Next: a retailer or review page with a spec table. State which kind each source is.
- Facts only. Copy no descriptions, tables, photos or review text beyond the short quotes below.
- One speaker = one page URL (the page you actually read), plus the date you read it.

FOR EACH SPEAKER return this JSON (use null when the page does not say it; never fill a gap):

{
  "brand": "", "model": "", "otherNames": ["names people also type"],
  "status": "current | discontinued | vintage",
  "category": "passive | active | all-in-one",
  "kind": "bookshelf | floorstander | monitor | desktop | wall",
  "url": "the exact page you read", "retrieved": "YYYY-MM-DD",
  "sourceKind": "maker | archived maker page | manual | retailer | review",
  "size": { "heightMm": 0, "widthMm": 0, "depthMm": 0,
            "quote": "the exact words from the page that give the size, with their unit" },
  "cabinet": { "value": "sealed | ported | passive-radiator | open-baffle",
               "quote": "exact words" },
  "drivers": { "value": "two-way | three-way | coaxial | full-range | other",
               "quote": "exact words" },
  "bass": { "hz": 0, "dbLevel": "-3 | -6 | -10 | not stated",
            "quote": "exact words, e.g. 'Frequency response 48 Hz – 22 kHz (-6 dB)'",
            "isInRoomFigure": false },
  "portPosition": { "value": "front | rear | down | side | none",
                    "quote": "exact words that say where the port is" },
  "minimumWallDistanceMm": { "value": 0, "quote": "exact words" },
  "positionOrWallSetting": { "value": true, "quote": "exact words naming the switch or setting" },
  "toneControls": { "bass": false, "treble": false, "quote": "exact words" },
  "designedForCorner": { "value": true, "quote": "exact words" }
}

EXTRA CARE
- Size: say which order the page uses (H x W x D, or W x H x D). If the page does not label the
  order, set size to null. Convert nothing: give the number and unit exactly as printed.
- Bass: copy the dB level the page prints (−3, −6 or −10 dB). A "±3 dB" band is not a bass limit;
  put null. An "in-room" figure: set isInRoomFigure true.
- Port position: only if the page says it in words. A picture alone is not enough: put null.
- Only fill bass, port, wall distance, settings, controls and corner when the source is the maker,
  an archived maker page or a manual. From a retailer or review give only size, cabinet and drivers.
- Where two pages disagree, return both values and both URLs.

At the end list, per speaker: what you could not find, and anything you are unsure about.

---
