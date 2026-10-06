import { beforeAll, describe, expect, it, vi } from 'vitest';
import { analyze } from '../../src/engine/analyze';
import { listeningMessageKeys } from '../../src/engine/listening';
import type { AnalysisOk } from '../../src/engine/types';
import {
  pendingTry,
  putBack,
  setAnswer,
  setTryResult,
  tryExperiment,
} from '../../src/app/listen/check';
import { projectSchema } from '../../src/app/state/schema';
import { MESSAGES, translate } from '../../src/i18n/translate';
import { makeProject } from '../fixtures/projects';

beforeAll(() => vi.stubGlobal('document', { documentElement: {} }));

describe('the listening check in the app', () => {
  it('every change has a sentence and a reason, in English and Hungarian', () => {
    for (const locale of ['en', 'hu'] as const) {
      for (const key of listeningMessageKeys()) {
        expect(translate(locale, key), key).not.toBe(key);
        const why = key.replace('listen.exp.', 'listen.why.');
        expect(translate(locale, why), why).not.toBe(why);
      }
    }
    expect(MESSAGES.hu).toBeDefined();
  });

  it('an answer is kept; the same answer again clears it', () => {
    const p = makeProject();
    setAnswer(p, 'bass', 'boomy');
    expect(p.listening?.answers.bass).toBe('boomy');
    setAnswer(p, 'bass', 'boomy');
    expect(p.listening?.answers.bass).toBeUndefined();
    expect(projectSchema(p, 'project')).toBeNull();
  });

  it('trying a move makes it, asks how it was, and "worse" can put it back exactly', () => {
    const p = makeProject({ clearance: 0.2 });
    setAnswer(p, 'bass', 'boomy');
    const exp = (analyze(p) as AnalysisOk).listening[0]!;
    expect(exp.id).toBe('L01.out');
    const y = p.variants[0]!.speakers.left.base.y;
    expect(tryExperiment(p, exp)).toBe(true);
    expect(p.variants[0]!.speakers.left.base.y).toBeCloseTo(y + 0.2, 9);
    const t = pendingTry(p)!;
    expect(t.by).toBe(0.2);
    setTryResult(p, t.id, 'worse');
    expect(pendingTry(p)).toBeNull();
    putBack(p, t.id);
    expect(p.variants[0]!.speakers.left.base.y).toBeCloseTo(y, 9);
    expect(projectSchema(p, 'project')).toBeNull();
  });

  it('a change without a move is just noted as tried', () => {
    const p = makeProject();
    setAnswer(p, 'treble', 'bright');
    const control = (analyze(p) as AnalysisOk).listening.find((e) => !e.change)!;
    const before = JSON.stringify(p.variants);
    expect(tryExperiment(p, control)).toBe(true);
    expect(JSON.stringify(p.variants)).toBe(before);
    expect(p.listening!.tries).toHaveLength(1);
  });
});
