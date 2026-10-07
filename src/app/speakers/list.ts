import { validateEntry, type SpeakerEntry } from '../../engine/speakers/entry';

/**
 * The speaker list shipped with the site (data/speakers/entries, docs/SPEAKER_DATA.md), checked
 * once more on load: an entry that fails is left out, never half-used. Built with
 * `--mode e2e`, the end-to-end tests get invented entries (tests/fixtures/speakers) instead; the
 * build drops the branch it does not take, so no invented speaker reaches the site.
 */
const files =
  import.meta.env.MODE === 'e2e'
    ? import.meta.glob<SpeakerEntry>('../../../tests/fixtures/speakers/*.json', {
        eager: true,
        import: 'default',
      })
    : import.meta.glob<SpeakerEntry>('../../../data/speakers/entries/*.json', {
        eager: true,
        import: 'default',
      });

export const SPEAKER_LIST: readonly SpeakerEntry[] = Object.values(files)
  .filter((e) => validateEntry(e).length === 0)
  .sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));
