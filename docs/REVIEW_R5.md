# R5 · Final audit

Scope (docs/REVAMP_PLAN.md): physics audit of the whole product, a hunt for bad advice, accessibility, performance and launch. Findings are numbered; each fix has a test or a check that would have caught it.

## Fixed

| # | Severity | What was wrong | Fix |
|---|---|---|---|
| F1 | High | **Default walls had the wrong data** (R0's M3). "Plastered brick", the default for walls and ceiling, carried the absorption of plaster *on wooden lath* (0.14 at 125 Hz), about ten times that of plaster on masonry. The predicted bass was too well damped: peaks and dips too shallow in most rooms. | Masonry values (0.013, 0.015, 0.02, 0.03, 0.04, 0.05), confirmed by two independent tables; "plaster on wooden lath (old house)" is now its own choice. Busy-ness re-anchored by +0.1 m² per m² of floor so the mid-band reverberation of a typical room is unchanged (0.56 s with some furniture). Bass reverberation in that room rises from 0.48 to 0.86 s. Golden scenarios: scores drop 0.03–0.06, near-tied best spots reorder, two rooms gain a bass caution at the current seat. The best spot still has a bass caution in only 3 of 20 test rooms (R0's H1 not reintroduced). |
| F2 | High | **"Best spot" when nothing may move.** With both the seat and the speakers fixed, the current setup came back as the "best spot found", sometimes red-flagged by the app's own rules. Found by the sweep (F7). | No best spots then; the Why panel says nothing can move and points to the findings and the Treat tab. |
| F3 | Medium | **Compromise spots looked like good ones.** When the user's limits leave no spot free of red flags, the search falls back to the least bad spots without saying so. | Such spots carry `compromise`, and the panel says so above the list. Sweep test. |
| F4 | Medium | **D05 told the user to move speakers they had marked as fixed.** | A `fixed` variant: check the manual for port plugs or a near-wall setting. EN and HU. |
| F5 | Medium | **Citation errors.** [ALL74] was given as 22(5); it is 22(6), June 1974. The typical-room reverberation range was attributed to Toole without a checked passage. | Corrected; the range now rests on dwelling surveys [DWELL] (0.33–0.51 s). Every other reference got its pages, issue or revision (RULE_CATALOGUE, References). |
| F6 | Low | **The frequency slider was 16 px tall on phones.** Found by the new phone check. | 44 px hit area (36 px on desktop). |
| F7 | — | **No test looked at everything at once.** | `tests/app/sweep.test.ts`: random rooms, speakers, seats, surfaces, furniture, goals and limits. For each it checks every score (finite, 0–1), every best spot (valid, red-flag-free unless marked a compromise, "move" only when it scores better), every layer, every advice number (positive sizes, real frequencies, T60 after treatment in the right direction, map marks inside the room), and every sentence in EN and HU, metric and imperial (no NaN, no empty placeholder, no negative length). Run in R5 on about 2,000 random projects; 60 per CI run. |
| F8 | Low | Large rooms (15 × 20 m and up) take seconds with no explanation (R0's M10). | The update notice says a room this large takes a few seconds. Typical rooms: 0.2 s on a desktop. |
| F9 | Low | The offline cache grew with every release (R0's M14). | Keeps the newest 60 files. |
| F10 | Low | Two quick pushes to `main` could deploy out of order (R0's L13). | A `concurrency` group on the deploy job. |

## Checked

- **Bass model vs a different method.** `tools/reference/image_check.py` sums image sources (Allen & Berkley) for Room R and compares with the modal model after the engine's smoothing (`docs/verification/image-source.md`): correlation 0.98–0.99, mean difference about 1 dB, largest 3.5–4.2 dB near 110 Hz. The gap does not shrink with longer image paths, so it is a real model difference. The likely cause is that the engine gives every mode the same damping. It is inside what P09 already treats as uncertain. The comparison with a measured room (REW) is still open.
- **Sources.** All references were checked through search results; book chapters and standards could not be opened from the build environment (only package registries are reachable). Every ⚠ in RULE_CATALOGUE is now resolved: confirmed, corrected, derived from physics in the catalogue, or relabelled as a 🟡 heuristic. H03 (Cardas) stays out of v1.
- **Absorption table** compared row by row with [PRA] (pyroomacoustics' materials database): five rows agree closely, plaster on lath and plasterboard are of the same order (single vs double board), plastered brick fixed (F1), window glass differs between tables (thin panes resonate; noted, kept). The two shelf and canvas rows are labelled estimates with nothing to compare.
- **Accessibility.** axe (WCAG 2.2 AA, light and dark, EN and HU) passes on every section, dialog and tab, the Treat and Listen tabs, and the bass-note explorer. The 44 px touch-target check now also covers the Treat and Listen tabs and the explorer.
- **Performance.** Desktop timings for a full analysis: 4 × 5 m 0.19 s, 6 × 8 m 0.22 s, 12 × 12 m 0.44 s, 15 × 20 m 1.2 s, 20 × 30 m 4.7 s. A phone is about 3–5 times slower, so typical rooms stay inside the 1.5 s budget. The engine runs in a worker, so the page stays responsive. JavaScript: 110 KB gzip of the 150 KB budget.

## Left open

- **Hungarian review (R4).** All text is drafted; none is marked reviewed. `npm run hu:review` lists the blocks (47, about 680 strings).
- **Measured-room comparison** (R0's M12): needs a REW measurement of a real room, ideally the owner's.
- **Mode-dependent damping.** A modal model with damping per mode type (axial modes decaying slower) would close most of the 3–4 dB gap to the image method. Not needed for v1.
- **Furniture absorption** for the new kinds remains a labelled estimate. Sofa and armchair values are on the high side of what upholstered-seat data suggest (RULE_CATALOGUE, P08).
- R0's low items L1, L2, L4–L9, L11, L12, L14 stay as proposals; none can make advice wrong for a symmetric setup.
