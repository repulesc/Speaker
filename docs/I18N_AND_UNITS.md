# Internationalisation & Units (v1)

Status: Phase 0 draft.

## 1. Languages

- **v1:** English (`en`) and Hungarian (`hu`). Both complete at launch. No feature ships with only one language.
- **Detection:** first visit uses `navigator.language` (`hu*` → Hungarian, otherwise English). After that, the user's choice is remembered (localStorage, wrapped in try/catch).
- **Switching** is instant, with no reload and no data loss.

## 2. Translation files

```
src/i18n/
  en.ts        // source of truth: export const en = { … } as const
  hu.ts        // export const hu: Messages = { … }  (type derived from en)
  index.ts     // t(key, params), current locale store, formatters
  glossary.md  // EN ↔ HU terminology (section 5), for translators and reviewers
```

- **Typed objects, not JSON:** `type Messages = DeepStringRecord<typeof en>`. A missing or misspelt Hungarian key is a **compile error**.
- **Keys** are namespaced by feature: `room.width.label`, `findings.G01.redFlag.title`, `findings.G01.redFlag.body`, `why.P04.formula`.
- **Interpolation:** `{name}` placeholders only. Values are formatted by the unit helpers **before** interpolation (the engine passes SI numbers; the UI formats them).
- **Plurals:** `Intl.PluralRules` with `{ one, other }` forms. In Hungarian a noun after a number stays singular ("3 javaslat"), so `hu` entries are often identical across forms. That's allowed.
- **CI checks:**
  1. key sets identical;
  2. placeholder sets identical per key;
  3. no unused keys;
  4. no hard-coded user-facing strings in `.svelte` files (lint rule: text nodes must come from `t()`, except a small allow-list of symbols).

## 3. Writing rules (both languages)

- **Whole sentences per key.** Never concatenate fragments. Hungarian word order and suffixes differ from English.
- **No suffixes on interpolated values in Hungarian.** "`{distance}`-re" breaks for different units ("cm-re", "m-re", "ft-ra"…). Rephrase so the value stands alone, e.g. "Távolság a faltól: {distance}" rather than "{distance}-re a faltól".
- Plain language on the surface, technical terms in "Why?" panels.
- Engine findings have three texts: `title` (≤ 60 characters), `body` (≤ 2 sentences) and `why` (the expandable part with assumptions).
- **Hungarian register: informal (tegezés, "te").** Owner decision, final. Keep it warm and respectful, never slangy ("Próbáld előrébb hozni a hallgatási pontot").
- **Translation process:** Claude drafts the Hungarian; a native-speaking hi-fi listener (the owner, or someone they nominate) reviews all strings before launch. Strings carry a `// reviewed` marker in `hu.ts` blocks once checked; CI reports the unreviewed count (a warning, not a failure).

## 4. Units

### 4.1 Storage and engine

- Internally **SI only**: metres, hertz, seconds, degrees, °C.
- The engine never sees display units. Conversion happens only in `src/units/` (parse and format), at the UI edge.

### 4.2 Display preferences

| Preference | Default |
|---|---|
| Length system: metric / imperial | From locale (`en-US`, `en-LR`, `en-MM` → imperial; all others metric), user can switch |
| Temperature: °C / °F | Follows the length system |

### 4.3 Formatting

| Quantity | Metric display | Imperial display |
|---|---|---|
| Room dimensions | `4.25 m` (2 decimals) | `13′ 11½″` (nearest ½ in) |
| Positions and distances (speakers, seat, reflections) | `62 cm` (integer cm); `1.24 m` if ≥ 1 m | `2′ 0½″` (nearest ¼ in) |
| Heights | `110 cm` | `3′ 7¼″` |
| Frequency | `43 Hz`; `1.2 kHz` above 999 Hz (same in both systems) | same |
| Level | `−3.8 dB` (1 decimal) | same |
| Time | `4.2 ms`; reverberation as a range `0.3–0.4 s` | same |
| Angles | `30°` (integer) | same |

- Locale-aware decimal separators via `Intl.NumberFormat`: Hungarian shows `4,25 m`, English `4.25 m`. Hungarian uses a non-breaking space between number and unit (as does English output, so values never wrap).
- **Displayed precision never exceeds the input certainty.** Results derived from "estimated" inputs are rounded one step coarser (e.g. 5 cm instead of 1 cm, and frequencies to 2 significant figures).

### 4.4 Parsing (forgiving input)

The parser is a small pure function `parseLength(input, context) → { ok: true, metres } | { ok: false, reason }`, with exhaustive unit tests.

Accepted forms:

| Input | Result |
|---|---|
| `3.5`, `3,5` | bare number → the field's display unit: metres for room dimensions in metric; feet for room dimensions in imperial. **Metric positions (M3):** a bare number below 10 is metres (`2.4`) and 10 or more is centimetres (`62`), because positions are displayed as "62 cm" below 1 m and "2.40 m" above. Imperial positions: inches. |
| `3.5 m`, `3,5m`, `350 cm`, `350cm`, `3500 mm` | explicit metric |
| `11'6"`, `11′ 6″`, `11 ft 6 in`, `11ft6in`, `11' 6`, `138"`, `138 in`, `11.5 ft` | imperial, any spacing, straight or typographic primes |
| `11 6` | rejected: ambiguous ("Did you mean 11′ 6″?") |
| `3,500` | interpreted as 3.5 (comma is always a decimal separator in length fields; room dimensions never need thousands separators) |
| empty | "unknown" state, not zero |
| negative, zero, non-numeric | rejected, with a reason shown under the field |

- Explicit units always win over the display unit. Mixing systems is allowed ("350 cm" typed in imperial mode is accepted and shown back as 11′ 6″ in a room-dimension field, or 11′ 5¾″ in a position field).
- Unit words in Hungarian are accepted too: `méter`, `centi`, `cm`, `láb`, `hüvelyk`.
- On blur the field reformats to the canonical display, so the user sees what was understood.

### 4.5 Conversion constants

- `1 in = 0.0254 m` exactly; `1 ft = 0.3048 m` exactly.
- `°F = °C × 9/5 + 32`.

Round-trip test: for a sample of values, `parse(format(x))` stays within half the display precision of `x`.

## 5. Glossary (EN ↔ HU)

⚠ The terminology is a draft for native review. Where Hungarian hi-fi usage varies, the alternatives are listed; pick one and use it consistently.

| English | Hungarian (proposed) | Notes |
|---|---|---|
| speaker (the box) | hangfal | **Not** "hangszóró", which is the driver unit |
| driver | hangszóró | |
| tweeter / woofer | magassugárzó / mélysugárzó | "mély-közép sugárzó" for a mid-bass driver |
| coaxial driver | koaxiális hangszóró | KEF's own name "Uni-Q" kept as-is |
| bass reflex port | basszreflex-nyílás | alternatives: reflexnyílás, reflexcső |
| sealed box | zárt doboz | |
| listening position / seat | hallgatási pont | alternative: hallgatói pozíció |
| front wall (behind speakers) | hangfalak mögötti fal | avoid "elülső fal", which is ambiguous |
| back wall (behind listener) | hallgató mögötti fal | |
| side wall | oldalfal | |
| room mode / standing wave | állóhullám (szobamódus) | first use with both terms |
| first reflection | első visszaverődés | alternative: korai reflexió |
| reflection point | visszaverődési pont | |
| speaker-boundary interference | falközeli kioltás | plain-language rendering; the technical "SBIR" is in "Why?" only |
| soundstage | hangszínpad | |
| imaging | leképezés | alternative: térleképezés |
| toe-in | befordítás (a hallgató felé) | |
| frequency response | frekvenciamenet | |
| reverberation time | utózengési idő | |
| Schroeder frequency | Schroeder-frekvencia | |
| absorption / absorber | elnyelés / hangelnyelő | |
| diffuser | diffúzor | |
| dip / peak | letörés / kiemelés | in plain text: "gyengébb / erősebb basszus ezen a hangon" |
| confidence (meter) | megbízhatóság | |
| red flag | kerülendő | lit. "to be avoided"; alternative "figyelmeztetés" |
| caution | figyelem | |
| Physics / Guideline / Rule of thumb / Your ears | Fizika / Irányelv / Ökölszabály / A füled | informal register |
| Do this first | Kezdd ezzel | |
| variant | változat | |
| guidance, not a guarantee | iránymutatás, nem garancia | |
