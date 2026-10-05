# How the app talks

Owner feedback after V5.1: the advice read "like a phone book". These rules keep every new text
friendly and short, in English and Hungarian alike.

1. **Talk to a person.** Say what to do and why, in one or two short sentences. "The room
   swallows high notes. If your amplifier has a treble control, turn it up a little, then listen."
2. **No technical units in the main text.** No hertz, seconds of reverberation, decibels, square
   metres or angles. Keep only distances the reader acts on ("move the seat 20 cm forward").
3. **Numbers live one tap away.** Every tip has a plain sentence (`advicePlain.*`) and the
   original numeric one (`advice.*`), shown under "Details" on the Tips tab. Reasons in the Why
   tab may keep numbers: that tab is for people who ask why.
4. **Honest, never certain.** "Try it, then listen." Never promise a result. Never name products,
   shops or prices.
5. **Cheap first.** Tips anyone can try today come first; panels and bass traps only after the
   "ready to invest" box (docs/ROADMAP_V5.md, V5.1).
6. **Same meaning in both languages**, same key order (a test checks the order).

A test (`tests/app/findings.test.ts`) fails if a plain tip contains a technical number.
