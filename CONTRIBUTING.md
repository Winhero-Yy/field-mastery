# Contributing

Thanks for considering it. This repo is small, so the rules are short.

## The one hard rule

**No example, demo, fixture or documentation snippet in this repository may contain an unverified claim.**

That sounds obvious for a project about verification, so concretely it means:

- If you add a sample report, every paper title, year, venue, author and number in it must either be real
  and cited, or obviously fictional (e.g. `Smith et al., Journal of Imaginary Results, 2024`).
- Do **not** paste real output from a real research run unless you re-verified every claim in it.
  Real runs contain abstracts-only items, `[single source]` markers and `[incomparable]` entries —
  those are correct *inside a run* but become false statements when lifted into a repo file.
- Never include a user's unpublished material (drafts, internal design docs, datasets) in an example.
  Use synthetic data or public sources only.

## What is most welcome

1. **A new field archetype you have actually run.** Open an issue with: the field, which of the six
   types it turned out to be, what chapter 5 ended up being, and what broke. Archetypes C–F are designed
   but not yet field-tested — evidence beats argument here.
2. **English translation of `SKILL.md`** (and the references). The mechanism is language-agnostic; the prose
   is currently Chinese. A faithful port, not a paraphrase — the wording carries a lot of the discipline.
3. **Lint rules** for `scripts/verify_citations.py`. Useful directions: detect tables whose rows cite
   people/years, detect `[single source]` used on a claim that drives a conclusion, detect numbers with
   units but no denominator.
4. **Additional archetypes** (e.g. clinical medicine as distinct from general applied engineering,
   or law as distinct from humanities).

## Adding an archetype

An archetype is four things, all in `references/field-archetypes.md`:

1. **Detection**: how to recognise it — the "how is good measured" and "what adjudicates disagreement" questions.
2. **Six lanes**: what the reconnaissance lanes become (they are rarely the default six).
3. **Chapters 4 and 5**: what those chapters *are* when there is no leaderboard.
4. **Proof standard and common traps**: what counts as established, and what people get wrong.

Then add the lane set to `ARCHETYPES` in `references/scan.workflow.js`.

## Testing

Before opening a PR:

```bash
# 1. Syntax + all six archetypes, with a stubbed agent layer (no API calls)
node --check references/scan.workflow.js        # wrap in an async IIFE; top-level return is intentional
# ...or run the stub harness described in docs/design-notes.md § Testing

# 2. Citation lint regression
python scripts/verify_citations.py examples/    # must exit 0
```

If you change the verification prompt or the verdict enum, re-run the stub harness across all archetypes
and paste the tally output into the PR.

## Style

- Prose: Chinese for `SKILL.md` and `references/`; English or Chinese for `docs/`.
- Prefer tables over paragraphs when comparing options.
- Every rule should name the failure it prevents. A rule without a failure behind it gets deleted in review.
- No emoji in the agent-facing instructions. They cost tokens and add nothing.

## Reporting a bad run

The most useful bug report for this project is a **run where the skill produced something false**.
Please include: the field, what it claimed, what the truth was, and at which phase the error should have
been caught. That last one is the actionable part.
