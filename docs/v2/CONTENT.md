# V2 content changes — ESL content developer

Status: data corrections applied; new lesson enrichment is **pending specialist approval** (0/4 required review passes complete).

## Pedagogical basis

- British Council A1-A2 grammar pages use a cycle of initial practice/test, clear explanation, then re-test. The enrichment tasks follow that controlled-to-clear-rule sequence.
- British Council A1 speaking lessons introduce language in context, check understanding, and practise useful language. The new tasks use mini-dialogues, classroom context, and personalised production rather than isolated filler.
- Cambridge speaking guidance describes a continuum from controlled practice to freer role play/production, with learners adding more language of their own as fluency focus increases. The enrichment schema marks each task by `taskType` so the frontend can place controlled, guided, or production work later.

## Enrichment schema

File: `src/data/lesson-enrichment.json`

```ts
type LessonEnrichment = {
  schemaVersion: 'lesson-enrichment.v1';
  reviewStatus: 'pending_specialist_approval';
  reviewRequirement: { requiredPasses: 4; completedPasses: number; status: string };
  pedagogicalBasis: string[];
  tasks: Array<{
    id: string;
    unitId: string;
    level: 'A1' | 'B1';
    taskType: string;
    objective: string;
    prompt: string;
    modelAnswer: string;
    explanation: string;
    reviewStatus: 'pending_specialist_approval';
  }>;
}
```

Added task IDs: a1-01-prod-01, a1-03-context-01, a1-08-map-01, a1-15-now-01, b1-03-plans-01, b1-05-advice-01, b1-15-deduction-01.

## Programmatic counts

```json
{
  "whyStringNormalization": 330,
  "mcqItemCorrection": 4,
  "grammarPracticeCorrection": 1,
  "whyLengthCorrection": 1,
  "answerKeyCorrection": 1,
  "readingFeedbackCorrection": 2,
  "readingItemCorrection": 6,
  "lessonEnrichmentTaskAdded": 7,
  "documentationCreated": 1,
  "evidenceManifestCreated": 1
}
```

## Evidence

Machine-readable before/after manifest: `docs/v2/content-evidence.json`.
