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
5. **An open licence of our own** for the list (proposed CC0; the owner decides).

## The entry (`src/engine/speakers/entry.ts`)

Each fact is `{ value, url, retrieved }`: where it was read and when. Sizes stay in millimetres, as
spec sheets print them, so a value can be compared with its page; the app converts at its edge.
Fields: brand, model, status (current, discontinued, vintage), category (passive, active,
all-in-one), kind (bookshelf, floorstander, monitor, desktop, wall), size (h, w, d), cabinet
(sealed, ported, passive radiator, open baffle), port position, driver layout, tweeter type, bass
limit with the dB level it refers to (−3, −6, −10, or unstated). Weight is not kept: the model
does not use it. Dispersion is not stored: for now the tweeter type stands in for it, in three
rough classes. `special` flags ribbon, AMT, planar, dipole and horn speakers, which the box model
does not describe well: they are listed and flagged, not pretended.

## The checker (`src/engine/speakers/verify.ts`)

An AI (or a person) reads a page and proposes a **draft**: every value with the exact words it was
read from. The checker trusts nothing:

- the quote must really appear in the page text (case, spaces, dashes and quotes normalised);
- the value must really be in the quote: sizes in mm, cm or inches within rounding, Hz as printed,
  decimal commas and thousands read both ways; an `H x W x D` header fixes which number is which
  and a swap is rejected; "port", "sealed", "two-way" and the like must be words in the quote;
- a bass limit must name its dB level; a ± band is a tolerance, not a limit, and is flagged;
- the whole entry must be believable (a 30 cm "floorstander" or a sealed box with a port fails).

What passes becomes an entry with **only the value and the link**; the quote is used and dropped.
What fails is left out with the reason. Passed-but-uncertain fields are flagged for a person.
`node tools/speakers/check-draft.ts draft.json page.txt [--write]` runs it by hand; the tests use
an invented page, never a real product (`tests/engine/speakerData.test.ts`).

## Order of work

1. Format, checker, tests, issue form, candidate list: **done** (this change).
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
