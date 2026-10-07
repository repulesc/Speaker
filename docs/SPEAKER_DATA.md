# The speaker list: how it is made, and what keeps it honest

Decided with the owner (V10 follow-up): a list of popular **stereo** speakers, so people can pick
theirs instead of answering the generic questions. Lifestyle products (Bluetooth boxes, smart
speakers, soundbars) are out. Vintage models come in a second batch. Nothing is typed in by hand,
and nothing is entered from memory.

## Rules (cautious by design; not legal advice)

1. **Facts only.** A size, a port position, a bass limit are facts. We record the number and a link
   to its page. Never copied descriptions, tables, photos or review text.
2. **One entry at a time.** No scraping of a site's whole catalogue (Europe also protects the
   compilation of a database). Each entry starts from a model on our list or a link someone sent.
3. **No third-party measurement data without an explicit open licence.** Spinorama-style
   dispersion data is not used until its terms allow it (or its maintainers say yes).
4. **Respect the sites.** Read only pages that allow it, slowly, in line with their terms.
5. **An open licence of our own:** CC0 1.0, public domain (owner's decision).

## What to collect (review, V10 follow-up)

Traced from what the engine reads (`src/engine/context.ts → resolveSpeaker`): four facts drive
almost everything a user sees: **depth** (the wall-dip distance and rear clearance), the **bass
figure**, **sealed or ported**, and the **port position**. The rest is second order, and precision
finer than about 5 mm is noise next to how precisely people place speakers. So the list collects
less, not more, in three tiers:

- **A, required** (nearly every spec sheet, checked automatically): size H × W × D, cabinet
  (sealed, ported, passive radiator, open baffle), driver layout.
- **B, when the maker states it:** the bass figure with its dB level (and whether it depends on a
  setting), port position, the maker's minimum wall distance, a wall or position setting (switch
  or app), bass and treble controls, a corner design.
- **C, rarely published:** tweeter height above the base. Estimated by the app when missing, and
  shown as an estimate.
- **Left out on purpose:** dispersion (it only feeds the echo estimate, P10, and toe-in advice is by
  ear anyway), tweeter type (coaxial is kept, through the driver layout), weight, power,
  sensitivity, impedance, price.

## The entry (`src/engine/speakers/entry.ts`)

Each fact is `{ value, url, retrieved, via }`: where it was read, when, and how. `via` is
`spec-text` or `manual` (checked against a quote), or `photo-confirmed`. Sizes stay in millimetres,
as spec sheets print them; the app converts at its edge. `aka` holds other names people type, for
the search. `special` flags ribbon, AMT, planar, dipole and horn speakers, which the box model does
not describe well: listed and flagged, not pretended.

**Port position from photos (owner's decision).** Often only the photos show where the port is.
The checker cannot verify a photo, so such a value is never accepted automatically: it is kept only
with the name of the person who confirmed it, and says `photo-confirmed`. No picture is kept. In
the app, the person who picks the speaker sees the port as an answer they can check on their own
speaker and change.

**The bass figure (`src/engine/speakers/bass.ts`).** Stored as printed, with its level (−3, −6,
−10 dB, or unstated). The engine moves it to −6 dB along the same Butterworth roll-off P09 draws
(2nd order sealed, 4th order otherwise): from −3 dB about ×0.76 sealed and ×0.87 ported; from
−10 dB about ×1.32 and ×1.15. An unstated level is taken as −6 dB and marked as assumed. A test puts
each converted figure exactly at its printed level on P09's own curve.

## The checker (`src/engine/speakers/verify.ts`)

An AI (or a person) reads a page and proposes a **draft**: every value with the exact words it was
read from. The checker trusts nothing:

- the quote must really appear in the page text (case, spaces, dashes and quotes normalised);
- the value must really be in the quote: sizes in mm, cm or inches within rounding, Hz as printed,
  decimal commas and thousands read both ways; an `H x W x D` header fixes which number is which
  and a swap is rejected; "port", "sealed", "two-way" and the like must be words in the quote;
- a bass figure must name its dB level to be read as one; a ± band is a tolerance, not a limit,
  and is flagged; "depends on a setting" must be said in the quote;
- a minimum wall distance must mention a wall, a position setting must name one, tone controls
  must name bass or treble, a tweeter height must mention the tweeter;
- the whole entry must be believable (a 30 cm "floorstander" or a sealed box with a port fails).

What passes becomes an entry with **only the value, the link and how it was read**; the quote is
used and dropped. A failed required fact means no entry; a failed optional one is left out, with
the reason. Passed-but-uncertain fields are flagged for a person.
`node tools/speakers/check-draft.ts draft.json page.txt [--write]` runs it by hand; the tests use
an invented page, never a real product (`tests/engine/speakerData.test.ts`).

## On the site (owner's choices, 7 Oct 2026)

- **Survey, screen 3:** search first. "Not listed? Describe it instead" swaps in the three
  questions; "Find it in the list instead" brings the search back. While the shipped list is empty
  the search is hidden and the questions are all there is.
- **Search** (`src/engine/speakers/search.ts`): empty, it lists the brands to browse; a brand lists
  its models. Case, accents, punctuation and word order do not matter; a word may be cut short; one
  slip is forgiven from 4 letters, two from 8, none in plain numbers (8020 is not 8030). "Mk II",
  "MkII", "Mark 2", "mk2" and "II" are the same; "LS50" and "LS 50" too. `aka` names count.
  ARIA combobox with an always-visible listbox; 44 px rows.
- **Card** (Room & speakers and the survey): name, one facts line (kind · cabinet · −6 dB point),
  "From the maker's page, read on <date>" linking to the size's source, Change, "They stand on",
  and the fold renamed "Edit details". A value changed by hand adds "Changed by you." A port from
  the maker's photos adds a quiet "Check the back of yours."; a special design (AMT, planar, dipole,
  horn) says the advice is less certain. No bass figure from the maker: the line leaves bass out.
- **What a pick stores** (`src/app/state/speakerList.ts`): a copy of the values, not a link
  (`speaker.listed` holds the id, source and date). Stated values are `measured`; a photo-confirmed
  port, a bass figure with no stated level and the driver heights (unless the tweeter height is
  stated) are `estimated`. The bass figure goes to −6 dB with `f6From`.
- **Tests:** the e2e build (`vite build --mode e2e`) uses invented entries from
  `tests/fixtures/speakers`; the site build never includes them (checked by grepping `dist`).

## Order of work

1. Format, checker, tests, issue form, candidate list: **done**. Tiers, photo-confirmed port,
   bass conversion: **done**.
2. Open the network to the makers' sites (below), then run **5 speakers** and read the output.
3. Run the other 45 of the pilot; spot-check about one in ten; look at everything flagged.
4. Search box in the speaker questions (loads the list only when opened), "from the maker's
   page, read on …" on every entry. A monthly job rechecks every link and flags changed pages.
5. Vintage batch (scans and archives: lower confidence label), then the special types.

## Sites to allow (for the pilot)

The cloud environment blocks outbound sites by default (Network access → Allowed domains).
From memory, so some may redirect: kef.com, buchardtaudio.com, dynaudio.com, klipsch.com,
audioengine.com, edifier.com, elac.com, bowerswilkins.com, genelec.com, neumann.com,
adam-audio.com, yamaha.com, jblpro.com, jbl.com, kaliaudio.com, wharfedalehifi.com,
qacoustics.co.uk, monitoraudio.com, dali-speakers.com, harbeth.co.uk, spendoraudio.com, focal.com,
polkaudio.com, svsound.com, trianglehifi.com, sonusfaber.com. The proxy names any host it blocks.
