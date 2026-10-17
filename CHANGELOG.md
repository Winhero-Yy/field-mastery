# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · [Semantic Versioning](https://semver.org/).

## [2.0.0] — 2026-10-17 · first public release

The version published to GitHub. (1.x existed only as a private working copy; see *Background* below.)

### Added

- **Field archetypes** (`references/field-archetypes.md`): six field types — algorithm/model, system/device,
  experimental science, formal science, applied engineering, humanities/social science — each with its own
  six reconnaissance lanes, chapter-4/chapter-5 substitutions, verification channels, and proof standard.
  Replaces the previous assumption that every field has a SOTA table and open-source code.
- **Four alternative chapter-5 layouts** for fields with no leaderboard: physical-limit reconciliation,
  measurement-technique division of labour, evaluation-scheme genealogy, conjecture–proof status.
- **`07-研究机会地图.md` (research opportunity map)** — a dedicated deliverable with fixed card fields:
  blankness type, first falsifiable step, verified assets, cost/risk, feasibility, hardest question.
  Includes a mandatory *decompose → four-way verdict → card → rank* sequence.
- **`README.md` entry navigation** as a required deliverable — ten files need a map.
- **Follow-up mode**: a five-step procedure for "is X still a blank? what could I do?" questions,
  including the requirement to verify assets on disk rather than infer them from the report.
- **Local-asset inventory** in Phase 0, plus a hard rule that opportunity-map assets must be verified.
- **Retrieval-channel probe** with a five-tier priority list (structured APIs first, publisher pages last),
  and an explicit hand-off of paywalled/CNKI work to the user with campus access.
- **Fourth evidence verdict `incomparable`** — independent sources whose measurements cannot be compared.
  Three recognition signals documented.
- **Stop-loss rule**: >1/3 unconfirmed means the keyword matrix or channels are wrong; go back to Phase 0.
- **Dynamic verification cap**: ≤24 candidates verified in full, otherwise the top 32, with the remainder
  reported as not verified.
- **File-level lint exemption** `<!-- citations: index-only -->` for glossaries and index tables.
- `docs/design-notes.md` — the reasoning and the failure modes each decision targets.
- `examples/smoke-test.workflow.js` — a two-lane pipeline for verifying an install without spending
  a full run's budget.

### Changed

- Workflow script is now archetype-aware: `args.archetype` selects the lane set.
- Verification prompt now offers four verdicts and explicitly instructs the agent to report
  "this does not exist in my field" rather than fabricate.
- Lane prompts now tell the agent that "this field has no benchmark / no open code" is a **valuable answer**.
- Citation lint checks a ±2-line window rather than a single line (multi-line evidence markers were being
  mis-reported as violations at a very high rate).
- Terminology generalised away from machine learning: 论文→成果, SOTA→评价口径, 形式化→形式化或操作化.

### Fixed

- Candidate-statement counts hard-coded at 40 regardless of how many candidates existed.
- Hot-memory writes silently rejected when the payload contained the reserved `§` delimiter.

## Background

Version 1 produced eight documents and worked, but failed two real tests:

1. **It could not answer "is this still a blank?"** The information was in the report, scattered across
   the frontier chapter, the open-problems chapter and an appendix — never assembled for that question,
   and missing the three fields that make a gap actionable.
2. **It assumed a machine-learning-shaped field.** Given a hardware field with no leaderboard, chapter 5
   had nothing to say.

Both are addressed above. The opportunity map and the archetype table exist because of those two failures,
not in spite of them.
