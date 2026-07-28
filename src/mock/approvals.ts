import type { Approval } from '@/components/ui/approval-card';

// Two use cases, two approval moments — both from Use Case B's PR-review
// negotiation. Every approval lives IN a chat thread (threadId): the
// agent asks in a bubble and the answer happens right there, never on a
// separate review screen. `items` = what exactly gets touched.
// DEMO DATA WIPED 2026-07-28: the old seeded world lives in git;
// fresh mock data lands here next.
export const initialApprovals: Approval[] = [];
