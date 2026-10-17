# field-mastery

**A field-research skill that refuses to invent papers.**

Give it a field name. It gives back ten ready-to-use documents — including a **research opportunity map**
that says which gaps are real, which are mirages, and what your first falsifiable step would be.

English | [中文](README.zh-CN.md)

> ⚠️ **Language note**: the agent-facing instructions (`SKILL.md` and everything under `references/`)
> are written in **Chinese**, because that is the language the deliverables are produced in.
> The mechanism works in any language; the prose is Chinese. An English port is welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## The problem

Ask any capable model to "systematically research field X" and it will hand you a confident, well-organised
survey. It will also contain papers that do not exist, DOIs that resolve to something else, numbers off by
an order of magnitude, and attributions that are wrong in a way you cannot detect without checking every one.

This is not a rare failure. It is the *default* failure, and it is worst exactly where the output looks best.

Two more failures that nobody talks about:

- **"Solved problems" lists are not opportunities.** A list of open problems does not tell you whether a
  problem is physically possible, whether anyone has the resources to attack it, or whether *you* have
  anything to start from.
- **Not every field has a SOTA table.** Force a leaderboard table onto a field with no leaderboard and you
  get either an empty table or a fabricated one.

## What makes this different

| Design decision | What it prevents |
|---|---|
| **Every claim must carry a source retrieved in this session.** No source → it goes into a "pending verification" file, not the report. | Fabricated literature |
| **Verification is done by a *different* agent that never saw the draft.** It is told to find its own source or say "not found". | The model grading its own homework |
| **Four verdicts, not two**: confirmed / unconfirmed / contradicted / **incomparable** | Conflating "two papers disagree" with "two papers can never be compared" — which is far more common and far more damaging |
| **Six field archetypes** decide what chapter 4 and 5 even *are* | Writing a SOTA table for a field that has none |
| **A dedicated opportunity map** with fixed fields: blankness type, first falsifiable step, assets (verified on disk, not inferred) | Confusing "nobody wrote it down" with "nobody can do it" |
| **Local assets are inventoried before searching** | Missing the unpublished draft / dataset / code sitting on the user's own machine, which is often stronger evidence than anything online |

## The `incomparable` verdict, in one example

Three papers each report "centimetre-scale resolution". Different calibration methods, different targets,
different weather conditions. This is **not** a contradiction and **not** corroboration — it is
*apparent consensus that is in fact incomparable*. If you label it `confirmed`, the user writes
"A beats B" into a manuscript and gets destroyed in review. This skill has a fourth state for it and
forces the report to say what differs.

## Install

**Via the skills CLI** (works for Claude Code, Cursor, Codex, Amp, Cline, DSH and other agents that read
`SKILL.md`):

```bash
npx skills add https://github.com/<you>/field-mastery --skill field-mastery
```

**Manually** — copy this folder to your agent's global skills directory:

```bash
git clone https://github.com/<you>/field-mastery.git
cp -r field-mastery ~/.agents/skills/field-mastery
```

Directories used by common agents: `~/.agents/skills/` (DSH, Amp, Cline, generic), `~/.claude/skills/`
(Claude Code). The folder name must match the `name:` in `SKILL.md` frontmatter.

**Verify the install** without burning API budget first — see [examples/smoke-test.workflow.js](examples/smoke-test.workflow.js),
a two-lane version of the pipeline you can run on any narrow topic.

## Usage

Just describe the field and your situation:

> Systematically research the field of **X**. I'm a first-year grad student in Y. I want to go from
> fundamentals to a full picture: history, key papers, core algorithms, technical routes, frontier trends,
> and what is still unsolved — then give me a study plan.

Or, if a report already exists:

> Now that you've read the report — **is X still a blank? What directions could I take?**

The second form is **follow-up mode**: it decomposes the compound term you asked about into dimensions,
rules each one blank/fake-blank/physically-impossible/blind-spot, **verifies what you actually have on
disk**, and updates the opportunity map.

See [examples/prompts.md](examples/prompts.md) for more phrasings.

## What you get

Ten files under `<workspace>/field-research/<slug>/`:

| File | Contents |
|---|---|
| `README.md` | One-page entry point: what to read first, what each file is for |
| `00-scope.md` | Scope card, **field type**, keyword matrix incl. negative keywords, channel probe, **local assets** |
| `01-report.md` | Main report: lineage → routes → representative work → evaluation schemes → frontier → open problems |
| `02-core-concepts.md` | Every concept in five parts: intuition → formalisation → minimal example → prerequisites → common misconception |
| `03-knowledge-map.md` | Acyclic dependency graph + three layers + bilingual glossary |
| `04-reading-path.md` | Three stages ordered by *conceptual dependency*, with time estimates and one action for today |
| `05-self-test.md` | 30 questions in three tiers, all with answers |
| `06-pending.md` | Unverified / bibliographic-only / **incomparable** / negative results |
| `07-opportunity-map.md` | Blankness verdicts, direction cards, feasibility ranking |
| `progress.md` | What's done, what's next |

Then written to Mnemon long-term memory in three layers: report → project documents, atomic claims →
memory space, one-line pointer → hot memory.

## How it works

```
Phase 0  Scope + field type + local-asset inventory + channel probe
   │
Phase 1  Six parallel reconnaissance lanes  ──┐  (lanes differ by field type)
   │                                          │  each ≤8 claims, source URLs required
Phase 2  Adversarial verification  ───────────┘  a *fresh* agent per claim, four verdicts
   │                                             stop-loss: >1/3 unconfirmed → go back to Phase 0
Phase 3  Write 10 deliverables
   │
Phase 4  Persist to long-term memory (3 layers)
   │
Phase 5  Self-check, incl. a mechanical citation lint
```

## Six field archetypes

The step that most surveys get wrong.

| Type | Chapter 5 becomes | What counts as proof |
|---|---|---|
| **A** Algorithm / model | Leaderboard / SOTA table | Beat baselines on a benchmark + ablation |
| **B** System / device | **Physical limit vs measured value**, with the denominator written out | Field measurement + calibration method stated |
| **C** Experimental science | **Measurement-technique division of labour** | Someone else can reproduce it |
| **D** Formal science | **Conjecture–proof status** | Proof or counterexample |
| **E** Applied / engineering | **Compliance and endpoint metrics** | Meets standard / clinical endpoint / cost |
| **F** Humanities / social science | **Schools of thought and their disputes** (listed, not adjudicated) | Argument + sources |

Read [references/field-archetypes.md](references/field-archetypes.md) for the full substitution tables.

## Tested

Not "written", tested:

- The workflow script was executed with a **stubbed agent layer** across all six archetypes — each produces
  six lanes with the correct labels and a four-key tally.
- The dynamic verification cap was exercised: 48 candidates → 32 verified, 16 reported as not verified.
- The stop-loss rule was confirmed to fire at a 100 % unconfirmed rate.
- `scripts/verify_citations.py` was regression-tested on four fixtures: index-only exemption, `[incomparable]`
  acceptance, and two bare-citation failures it correctly catches.
- An end-to-end run on a real field (a specialised imaging subfield) produced 24/24 confirmed claims, zero
  fabrications, and **caught two errors in the reconnaissance output** that were resolved against a
  primary source.
- A smoke test on classifier-free guidance caught three errors in the draft: a paper dated to the wrong year
  (workshop version predates the arXiv posting), a technique misattributed to the wrong originators, and an
  over-strong claim about a quality/diversity trade-off.

## Limitations

Stated plainly:

- **Chinese literature is a blind spot by design.** CNKI, Weipu and optics-journal portals block automated
  access. The skill will tell you this and hand the task to a user with campus access rather than pretend.
- **Paywalls win.** Many claims will be abstract-level only. Anything the abstract does not state is *not filled in*.
- **Archetypes C–F are designed but not yet field-tested.** A and B have been run end to end; the other four
  have only been exercised through the stub harness.
- **It is slow and expensive.** Six parallel lanes plus adversarial verification is deliberately wasteful.
  The waste is the product.

## Contributions

Most welcome: an archetype you have actually run, a lint rule, or an English translation of `SKILL.md`.
Please read [CONTRIBUTING.md](CONTRIBUTING.md) — the one hard rule is that no example in this repo may
contain unverified claims.

## License

MIT — see [LICENSE](LICENSE).
