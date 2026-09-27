# Supabase

SQL migrations land here in **Phase 1** (PLAN §§7–23):

- tables + indexes + FKs + constraints for users, profiles, conversations,
  messages, evidence, claims, claim_versions, claim_evidence,
  human_context_snapshots, objectives, development_plans,
  development_plan_items, experiences, experience_recommendations,
  experience_attempts, experience_reports, agent_runs, safety_events,
  model_versions, prompt_versions (+ research tables, logically separate)
- Row Level Security: a user can only access their own data
- Supabase Auth integration

Keep migrations numbered (`001_...`, `002_...`) and never edit an applied one.
