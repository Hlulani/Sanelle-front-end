import { EvidenceTopic } from './evidence.model';
import { DRAFT_TOPICS } from './topics.drafts';

/** Topics that have been reviewed and dated by a qualified reviewer. None yet. */
const REVIEWED_TOPICS: EvidenceTopic[] = [];

export const TOPICS: EvidenceTopic[] = [...REVIEWED_TOPICS, ...DRAFT_TOPICS];
