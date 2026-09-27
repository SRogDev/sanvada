# SANVADA — MASTER IMPLEMENTATION PLAN

> Implementation Source of Truth

This document defines the architecture, domain model, implementation order, contracts, testing strategy, ML pipeline, research infrastructure, and deployment strategy for Sanvada.

The implementation agent must follow this document unless an explicit architectural conflict is discovered.

The agent must not silently introduce new frameworks, duplicate infrastructure, bypass domain boundaries, or change core architectural decisions.

---

## 0. PRODUCT DEFINITION

### 0.1 What Sanvada is

Sanvada is a conversational AI system that progressively constructs a longitudinal, contextualized representation of a person — Human Context — and uses it to personalize conversations, development decisions, and real-world experiences.

The central product loop is:

```
PERSON
  ↓
INTERACTION
  ↓
EVIDENCE
  ↓
HUMAN CONTEXT
  ↓
PERSONALIZED UNDERSTANDING
  ↓
AGENT DECISION
  ↓
EXPERIENCE
  ↓
REAL-WORLD OUTCOME
  ↓
NEW EVIDENCE
  ↺
```

Sanvada's primary interface is conversation.

The user should not feel like they are operating a database of their personality.

They should feel:

> “This AI is progressively getting to know me.”

---

## 1. NON-NEGOTIABLE PRODUCT PRINCIPLES

1. Human Context is longitudinal.
2. Historical interpretations are never silently erased.
3. Contradictions are legitimate information.
4. The user owns and controls their representation.
5. Sanvada learns progressively rather than interrogating the user during onboarding.
6. Experiences happen in the real world.
7. Chat is the center of the product.
8. Sentient UI exposes contextual actions and information.
9. No artificial personality/mental-health score.
10. No diagnosis or replacement of professional care.
11. Human Context is structured data, not one giant prompt.
12. PostgreSQL is structured source of truth.
13. Supermemory is semantic memory/retrieval, not a competing source of truth.
14. The custom-trained model is only the Experience Selection Model.
15. Research infrastructure is separated from production infrastructure.
16. Architecture must remain simple enough for a small team/solo developer to maintain.

---

## 2. TECH STACK

### Frontend / Application

- Next.js
- TypeScript
- React
- Vercel AI SDK
- AI Elements / Sentient UI
- PWA
- Biome
- Zod

### Backend / Data

- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage where necessary
- Row Level Security

### Memory

- Supermemory

### ML / Research

- Python
- PyTorch
- Hugging Face ecosystem
- Unsloth
- Qwen small-model family as initial candidate

Initial candidate:

> Qwen3-4B-Instruct-2507

Do not hard-code this as the final research model before benchmarking alternatives.

---

## 3. ARCHITECTURE — SCREAM

Sanvada must use SCREAM Architecture.

The goal is not merely a folder structure. The goal is to ensure:

> business/domain logic does not depend on UI, database implementation, model provider, or a particular AI framework.

Recommended structure:

```
src/
├── app/
│   ├── (auth)/
│   ├── chat/
│   ├── self-map/
│   ├── experiences/
│   ├── evolution/
│   └── settings/
│
├── domains/
│   ├── human-context/
│   ├── experiences/
│   ├── development/
│   ├── conversations/
│   ├── safety/
│   └── users/
│
├── application/
│   ├── mind/
│   ├── companion/
│   ├── development/
│   └── experience-selection/
│
├── infrastructure/
│   ├── database/
│   ├── memory/
│   ├── llm/
│   ├── auth/
│   ├── notifications/
│   └── observability/
│
├── ui/
│   ├── chat/
│   ├── sentient/
│   ├── human-context/
│   ├── experiences/
│   └── evolution/
│
└── shared/
    ├── schemas/
    ├── errors/
    ├── types/
    └── utils/

Research is deliberately outside the application runtime:

research/
├── datasets/
├── generation/
├── training/
├── evaluation/
├── experiments/
└── analysis/
```

---

## 4. DEPENDENCY RULES

These rules are mandatory.

### Domain

May depend on:

- domain types;
- domain logic;
- Zod schemas where appropriate.

Must NOT depend on:

- Next.js;
- React;
- Supabase SDK;
- Vercel AI SDK;
- Supermemory;
- specific LLM providers.

### Application

Coordinates use cases.

Can depend on:

- domain;
- ports/interfaces;
- Zod;
- AI abstractions.

### Infrastructure

Implements ports:

- Database
- Memory
- LLM
- Auth
- Observability

### UI

Calls application/use-case boundaries.

UI must not directly manipulate domain persistence.

---

## 5. ZOD CONTRACT LAYER

Zod is a first-class architectural component.

Use Zod for:

- API inputs;
- API outputs;
- tool inputs;
- tool outputs;
- agent outputs;
- LLM structured outputs;
- environment variables;
- research dataset schemas;
- database-to-domain validation where appropriate.

Example:

```ts
const ExperienceSelectionSchema = z.object({
  experienceId: z.string().uuid(),
  reason: z.string(),
  targetCapability: z.string(),
  fit: z.number().min(0).max(1),
  risk: z.enum(["low", "medium", "high"]),
  confidence: z.number().min(0).max(1),
});
```

The AI SDK must use structured outputs constrained by Zod schemas wherever possible.

Never trust raw LLM JSON.

---

## 6. CORE DOMAIN MODEL

The most important conceptual chain is:

```
Evidence
    ↓
Claim
    ↓
Claim Version
    ↓
Human Context Snapshot
```

Do not create a single human_context table containing everything.

---

## 7. DATABASE SCHEMA

The implementation agent must produce actual SQL migrations.

### 7.1 users

Application identity.

- id
- created_at
- updated_at

Authentication identity should remain compatible with Supabase Auth.

### 7.2 profiles

Basic application profile.

- user_id
- display_name
- avatar_url
- locale
- timezone
- created_at
- updated_at

Do not put Human Context here.

---

## 8. CONVERSATIONS

### conversations

- id
- user_id
- title
- created_at
- updated_at

### messages

- id
- conversation_id
- role
- content
- metadata
- created_at

Roles:

- user
- assistant
- system
- tool

Do not store all structured Human Context inside message metadata.

---

## 9. EVIDENCE

### evidence

Represents information that can potentially teach Sanvada something about the user.

- id
- user_id
- source_type
- source_id
- content
- structured_data
- relevance_status
- created_at

Possible source types:

- conversation
- experience_report
- assessment
- user_confirmation
- user_correction
- system_observation

Relevance status:

- pending
- relevant
- irrelevant
- processed

Evidence is immutable.

If interpretation changes, the evidence remains.

---

## 10. CLAIMS

### claims

Represents an enduring proposition about the user.

- id
- user_id
- category
- current_status
- current_confidence
- created_at
- updated_at

Categories:

- personality
- preference
- value
- interest
- experience
- capability
- behavior_pattern
- emotional_pattern
- social_pattern
- uncertainty

Statuses:

- observed
- inferred
- user_confirmed
- user_rejected
- contradicted
- outdated

---

## 11. CLAIM VERSIONS

### claim_versions

This is critical.

Never overwrite the historical interpretation.

- id
- claim_id
- claim_text
- status
- confidence
- reason
- created_at
- supersedes_version_id

Every meaningful interpretation change creates a new version.

Example:

Claim
"User prefers working alone"

Version 1
confidence .61

Version 2
"User prefers working alone for creative work
but enjoys collaboration in social contexts"
confidence .84

Version 1 remains stored.

---

## 12. CLAIM EVIDENCE

### claim_evidence

Many-to-many relation:

- claim_id
- evidence_id
- relationship
- created_at

Relationship could be:

- supports
- contradicts
- qualifies

This allows Sanvada to answer:

> “Why do you think this about me?”

---

## 13. HUMAN CONTEXT SNAPSHOTS

### human_context_snapshots

Represents a complete representation at a point in time.

- id
- user_id
- version
- snapshot_data
- created_at
- trigger

Triggers:

- major_update
- experience
- user_review
- scheduled
- manual

Snapshot data should reference/version the relevant claims rather than becoming an uncontrolled duplicate database.

---

## 14. OBJECTIVES

### objectives

- id
- user_id
- title
- description
- status
- created_at
- updated_at

Status:

- active
- paused
- completed
- archived

---

## 15. DEVELOPMENT PLANS

### development_plans

- id
- user_id
- title
- summary
- status
- created_at
- updated_at

### development_plan_items

- id
- development_plan_id
- objective_id
- description
- priority
- status
- created_at
- updated_at

Do not turn this into a traditional habit tracker.

---

## 16. EXPERIENCES

### experiences

- id
- title
- description
- objective
- target_capabilities
- context
- social_requirement
- emotional_intensity
- risk
- prerequisites
- estimated_duration
- constraints
- metadata
- created_at
- updated_at

No difficulty field.

---

## 17. EXPERIENCE RECOMMENDATIONS

### experience_recommendations

- id
- user_id
- experience_id
- agent_run_id
- context_snapshot_id
- reason
- fit
- risk
- confidence
- status
- created_at

Status:

- proposed
- accepted
- rejected
- expired

This creates reproducibility:

> “Why was this exact experience recommended at this exact time?”

---

## 18. EXPERIENCE ATTEMPTS

### experience_attempts

- id
- user_id
- experience_id
- recommendation_id
- status
- started_at
- completed_at
- created_at

Status:

- started
- completed
- abandoned

---

## 19. EXPERIENCE REPORTS

### experience_reports

- id
- attempt_id
- content
- structured_reflection
- created_at

The report becomes evidence.

```
experience_report
       ↓
evidence
       ↓
Human Context Engine
```

---

## 20. AGENT RUNS

### agent_runs

Central observability record.

- id
- user_id
- agent_type
- conversation_id
- model
- model_version
- prompt_version
- context_snapshot_id
- input_metadata
- output_metadata
- status
- latency_ms
- input_tokens
- output_tokens
- estimated_cost
- created_at
- completed_at

Agent types:

- mind
- companion
- development
- experience
- human_context
- safety

This is not merely logging.

It is part of research reproducibility.

---

## 21. SAFETY EVENTS

### safety_events

- id
- user_id
- agent_run_id
- category
- severity
- action
- created_at

Do not store unnecessary sensitive content.

---

## 22. MODEL / PROMPT VERSIONING

### model_versions

- id
- provider
- model_name
- version
- purpose
- metadata
- created_at

### prompt_versions

- id
- agent_type
- version
- template
- metadata
- created_at

Never allow important research runs to depend on an unversioned prompt.

---

## 23. RESEARCH TABLES

Research data should remain logically separate.

Potential tables:

- research_runs
- evaluation_cases
- evaluation_results
- model_evaluations

Production tables must never depend on research tables.

---

## 24. HUMAN CONTEXT ENGINE

Implement as an application service.

HumanContextEngine

Input:

- Evidence
- Current Human Context
- Relevant history

Pipeline:

1. Validate evidence
2. Determine relevance
3. Retrieve relevant existing claims
4. Detect possible new information
5. LLM interpretation
6. Generate structured claim proposals
7. Detect contradictions
8. Apply deterministic rules
9. Persist claim versions
10. Create snapshot when appropriate
11. Emit domain events

---

## 25. ASYNCHRONOUS PROCESSING

Normal conversation must not block while Human Context is being updated.

Example:

```
User message
     ↓
Companion response
     ↓
Response streamed immediately
     ↓
Background processing
     ↓
Relevance detection
     ↓
Evidence
     ↓
Human Context Engine
```

The user should not wait five seconds because Sanvada decided whether a sentence was relevant to their personality.

---

## 26. CONTRADICTION ENGINE

When new evidence conflicts with an existing claim:

```
new evidence
     ↓
retrieve related claims
     ↓
semantic/LLM comparison
     ↓
support?
contradict?
qualify?
     ↓
create new claim version
```

Never automatically delete previous claims.

The system should preserve the possibility that both claims are contextually valid.

---

## 27. MIND

Mind is the central orchestrator.

Responsibilities:

- understand current intent;
- determine required agent;
- retrieve appropriate context;
- enforce safety;
- coordinate agent execution;
- return final response/UI actions.

It should not become a giant autonomous reasoning loop.

Prefer:

```
event
 ↓
routing
 ↓
agent
 ↓
result
```

with iterative orchestration only when genuinely necessary.

---

## 28. AGENT CONTRACTS

Each agent gets:

- input schema
- output schema
- allowed tools
- allowed context
- responsibilities
- forbidden responsibilities

Example:

Companion

Can:

- conversation;
- reflection;
- explain Human Context;
- request relevant context.

Cannot:

- directly mutate claims;
- bypass Safety;
- modify database state arbitrarily.

Development

Can:

- analyze objectives;
- update development plan;
- identify areas for exploration;
- request experience recommendations.

Experience

Can:

- evaluate experiences;
- select experiences;
- create recommendations;
- process experience reports.

---

## 29. TOOL PERMISSIONS

Agents should not receive arbitrary database access.

Instead:

- Companion → getRelevantHumanContext → createConversationEvidence
- Development → getDevelopmentContext → updateDevelopmentPlan → requestExperienceSelection
- Experience → getCandidateExperiences → selectExperience → createRecommendation

Tools themselves have Zod schemas.

---

## 30. COMPANION

Primary UX.

Pipeline:

```
message
 ↓
Mind
 ↓
Safety check
 ↓
Relevant context retrieval
 ↓
Companion
 ↓
AI SDK stream
 ↓
Sentient UI events
```

Companion can surface:

- context insight;
- experience recommendation;
- Self Map update;
- reflection prompt.

But it should not overwhelm the user with UI.

---

## 31. DEVELOPMENT AGENT

Input:

- Human Context
- Objectives
- Recent experiences
- Recent evidence
- Current situation

Output:

- current developmental direction
- objective updates
- recommended exploration areas

It does not prescribe a rigid schedule.

---

## 32. EXPERIENCE AGENT

Input:

- Human Context
- Current state
- Development objectives
- Recent experiences
- Candidate experiences

Then:

Experience Selection Model

Output:

```json
{
  "experienceId": "...",
  "reason": "...",
  "targetCapability": "...",
  "fit": 0.0,
  "risk": "low",
  "confidence": 0.0
}
```

Validate with Zod.

---

## 33. EXPERIENCE MODEL

Initial candidate:

> Qwen3-4B-Instruct-2507

Before fine-tuning:

Benchmark against small alternatives.

The benchmark is task-specific.

Not:

> “Which model gets the highest generic benchmark score?”

Instead:

> “Which small model best understands Sanvada's experience-selection task?”

---

## 34. EXPERIENCE SELECTION TASK

Do not train it as an unrestricted chatbot.

Training examples should look like:

```
PERSON CONTEXT
CURRENT STATE
DEVELOPMENT OBJECTIVE
CANDIDATE EXPERIENCES
```

Output:

```
SELECTED EXPERIENCE
REASON
FIT
RISK
CONFIDENCE
```

Potentially also train ranking capability.

Example:

```
A → 0.42
B → 0.87
C → 0.31
D → 0.71

Selected → B
```

---

## 35. DATASET GENERATION

Hybrid:

- Curated experience catalog
- Synthetic scenarios
- LLM-assisted generation
- Human validation

Synthetic generation must be independently validated.

Do not use the same generation model blindly as the evaluator.

---

## 36. TRAINING DATA FORMAT

Use JSONL.

Each example should have a versioned schema.

Conceptually:

```json
{
  "context": {},
  "current_state": {},
  "objectives": [],
  "candidates": [],
  "label": {
    "selected": "...",
    "reason": "...",
    "fit": 0.0,
    "risk": "low"
  }
}
```

Zod schema should validate dataset records before training.

---

## 37. TRAINING

Use Unsloth.

Pipeline:

```
Dataset
 ↓
Validation
 ↓
Train/validation/test split
 ↓
Tokenizer
 ↓
LoRA/QLoRA fine-tuning
 ↓
Validation
 ↓
Task benchmark
 ↓
Model artifact
```

The final model must be versioned.

---

## 38. EVALUATION

Compare:

- Baseline A — General LLM prompted for selection.
- Baseline B — Small base model prompted.
- Experimental — Fine-tuned small model.

Metrics:

- personal relevance;
- contextual appropriateness;
- developmental alignment;
- safety;
- novelty;
- acceptance;
- calibration.

Use blind human evaluation where possible.

---

## 39. SENTIENT UI

Chat remains central.

The application should expose contextual UI objects through AI SDK.

Potential UI objects:

- ExperienceCard
- HumanContextInsight
- SelfMapInsight
- EvolutionCard
- ReflectionCard
- ConfirmationCard

The AI does not generate arbitrary frontend code.

It produces validated structured UI intents/data.

---

## 40. SELF MAP

MVP:

Así te veo

Sections:

- patterns;
- preferences;
- values;
- interests;
- capabilities;
- contradictions;
- things Sanvada is still learning;
- evolution.

No numeric personality score.

No clinical score.

No graph requirement.

Later:

- graph;
- radial visualization;
- richer timeline.

---

## 41. WHY THIS?

A claim can expose:

```
Claim
 ↓
Evidence
 ↓
History
 ↓
Evolution
```

This should be one of Sanvada's defining interactions.

---

## 42. SECURITY

Implement:

- Supabase Auth;
- RLS;
- user-scoped queries;
- server-only privileged operations;
- no client-side service-role keys;
- encrypted secrets;
- minimum necessary context;
- explicit future API scopes.

Every Human Context retrieval must be user-scoped.

---

## 43. FUTURE SOUL API

Do not implement as MVP.

But design Human Context so it can eventually expose:

```
GET relevant-context
```

rather than:

```
GET entire-person
```

External applications should request only relevant context and require permission.

---

## 44. SAFETY

Safety must be invoked before risky experiences or sensitive responses.

Possible actions:

- continue
- soft-caution
- redirect
- professional-support
- block-experience

No diagnosis.

No hidden mental-health score.

No pretending emotion recognition is clinical truth.

---

## 45. NOTIFICATIONS

PWA notifications should be contextual.

Examples:

> “I have an experience I think you might like.”

> “How did that conversation go?”

Avoid streak mechanics.

---

## 46. TESTING STRATEGY

Every layer needs tests.

### Unit

- claim versioning;
- contradiction handling;
- snapshot creation;
- experience validation;
- permission checks;
- safety decisions.

### Integration

- evidence → Human Context;
- experience → report → evidence;
- agent → tool;
- Mind → agent;
- PostgreSQL;
- Supermemory.

### Contract tests

Validate all Zod contracts.

### AI tests

Versioned fixtures:

- input
- expected structured properties

Not exact natural-language string matching wherever avoidable.

### End-to-end

Critical flows:

1. sign up;
2. conversation;
3. evidence extraction;
4. Human Context update;
5. Self Map;
6. experience recommendation;
7. accept;
8. complete;
9. report;
10. context evolution.

---

## 47. OBSERVABILITY

Record:

- agent
- model
- model_version
- prompt_version
- context_snapshot
- latency
- tokens
- cost
- tool calls
- structured output
- errors
- user feedback

Do not log unnecessary private content.

---

## 48. ERROR HANDLING

AI failures must degrade gracefully.

Examples:

- LLM unavailable → continue with basic response
- Memory unavailable → continue without semantic memory
- Human Context update fails → queue/retry asynchronously
- Experience model unavailable → fallback to general model or safe curated selection

The application should not collapse because one AI subsystem failed.

---

## 49. COST CONTROL

Important because the product is AI-heavy.

Use:

- async Human Context processing;
- relevance filtering;
- structured context retrieval;
- caching where appropriate;
- small model for specialized selection;
- larger model only where needed;
- no unnecessary full-context injection.

The system should never send the complete Human Context into every request.

---

## 50. IMPLEMENTATION PHASES

### Phase 0 — Repository & Architecture

Deliver:

- project;
- dependency setup;
- architecture directories;
- Biome;
- Zod;
- test framework;
- environment schema;
- documentation.

Acceptance: clean build + tests + lint/typecheck.

---

### Phase 1 — Supabase

Implement:

- Auth;
- migrations;
- tables;
- indexes;
- FK;
- constraints;
- RLS.

Acceptance: user can only access own data.

---

### Phase 2 — Domain Layer

Implement:

- Evidence;
- Claim;
- ClaimVersion;
- Snapshot;
- Objective;
- Experience;
- Recommendation;
- Attempt;
- Report.

No UI yet.

Acceptance: domain tests pass independently.

---

### Phase 3 — Human Context Engine

Implement:

- relevance detection;
- evidence creation;
- claim retrieval;
- LLM interpretation;
- contradiction detection;
- claim versioning;
- snapshots.

Acceptance: synthetic scenarios correctly preserve historical claims.

---

### Phase 4 — Memory

Implement:

- Supermemory adapter;
- indexing;
- retrieval;
- relevance processing;
- asynchronous pipeline.

Acceptance: semantic memory failure does not break product.

---

### Phase 5 — Mind

Implement:

- routing;
- agent contracts;
- tool permissions;
- safety interception;
- observability.

Acceptance: no agent can bypass architectural boundaries.

---

### Phase 6 — Companion

Implement:

- streaming;
- context retrieval;
- conversation;
- evidence generation;
- contextual UI events.

Acceptance: user can have a complete conversation and generate context.

---

### Phase 7 — Development

Implement:

- objectives;
- development plans;
- trajectory;
- contextual analysis.

Acceptance: development plan evolves from evidence without becoming a habit tracker.

---

### Phase 8 — Experiences

Implement:

- catalog;
- recommendation lifecycle;
- attempts;
- reports;
- evidence generation.

Initially use general LLM selection.

Acceptance: complete experience loop works without custom ML.

---

### Phase 9 — Sentient UI

Implement:

- chat;
- contextual cards;
- experience card;
- Human Context insight;
- Self Map;
- evolution view.

Acceptance: user can operate the entire core loop through chat.

---

### Phase 10 — Research Infrastructure

Implement:

- experiment runner;
- dataset schemas;
- dataset generation;
- validation;
- model benchmark harness;
- experiment tracking.

---

### Phase 11 — Model Benchmark

Evaluate:

- Qwen candidate;
- Llama candidate;
- Phi candidate;
- any additional justified small candidate.

Acceptance: documented model-selection decision.

---

### Phase 12 — Fine-tuning

Implement:

- dataset preparation;
- LoRA/QLoRA;
- Unsloth training;
- evaluation;
- artifact versioning.

Acceptance: experimental model has measurable performance against baselines.

---

### Phase 13 — Production Model

Integrate selected model behind:

```
ExperienceSelectionModel
```

The rest of the application must not know whether the implementation is:

- Qwen;
- another model;
- hosted API;
- local inference.

This is crucial.

---

### Phase 14 — Research Evaluation

Run:

- baseline;
- fine-tuned model;
- human evaluation;
- metrics;
- statistical analysis.

---

### Phase 15 — Hardening

- security;
- RLS;
- error handling;
- observability;
- cost controls;
- performance;
- PWA;
- notifications.

---

### Phase 16 — Thesis

Generate:

- methodology;
- architecture diagrams;
- database model;
- experiments;
- results;
- limitations;
- discussion;
- reproducibility package.

---

## 51. CODING AGENT EXECUTION PROTOCOL

Muse should execute each implementation task with this structure:

1. Read relevant architecture section.
2. Inspect current repository.
3. Identify existing implementation.
4. Implement smallest correct change.
5. Run typecheck.
6. Run lint.
7. Run relevant tests.
8. Run integration tests if applicable.
9. Verify architecture boundaries.
10. Summarize changes.
11. Move to next task only after acceptance criteria pass.

Muse must not implement 20 phases in one giant uncontrolled operation.

---

## 52. ARCHITECTURAL CHANGE PROTOCOL

If Muse encounters a conflict:

DO NOT silently change architecture.

Instead report:

- Architectural Conflict
- Current decision:
- Problem:
- Why it conflicts:
- Options:
- Recommended option:
- Impact:

Only then modify the plan.

---

## 53. DEFINITION OF DONE

A task is not done because code exists.

It is done when:

Implementation
+
Types
+
Zod validation
+
Tests
+
Error handling
+
Architecture compliance
+
Documentation where necessary

all pass.

---

## 54. FINAL PRODUCT LOOP

The finished MVP must support:

```
User talks to Sanvada
        ↓
Mind
        ↓
Companion
        ↓
Relevant Human Context retrieved
        ↓
Conversation
        ↓
Async evidence processing
        ↓
Human Context evolves
        ↓
Development Agent recognizes opportunity
        ↓
Experience Agent
        ↓
Experience Selection Model
        ↓
Personalized experience
        ↓
User accepts
        ↓
User lives experience
        ↓
User reports
        ↓
Evidence
        ↓
Human Context evolves again
```

That is the system we are actually building.
