import type { ListeningAreaKind, Project } from '../../engine/types';

/** Where you listen from: one chair, a sofa, a desk or a bed (a desk also means sitting close). */
export type Place = 'chair' | ListeningAreaKind;
export const PLACES: readonly Place[] = ['chair', 'sofa', 'desk', 'bed'];

export function placeOf(project: Project): Place {
  const area = project.variants.find((v) => v.id === project.activeVariantId)?.listener.area;
  if (project.constraints.listeningDistance === 'near') return 'desk';
  return area && area !== 'desk' ? area : 'chair';
}

/** The listening place belongs to the room, not to one setup: every setup gets it. */
export function setPlace(project: Project, value: Place): void {
  project.constraints.listeningDistance = value === 'desk' ? 'near' : 'room';
  for (const v of project.variants) {
    if (value === 'chair') delete v.listener.area;
    else v.listener.area = value;
  }
}
