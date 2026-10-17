# Design notes

Why this skill is shaped the way it is. Every rule here exists because of a specific failure — if you
delete a rule, read the section that says what comes back.

---

## 1. Why verification needs a *different* agent

Asking a model to "check its own work" fails for the same reason a student marking their own exam fails:
the reasoning that produced the claim is still in context, and it anchors the checking.

The concrete failure mode is **anchoring by supplied evidence**. If you hand a checker the draft *plus its
sources* and ask "is this right?", the cheapest path is "the source is there, so yes". The checker confirms
presence, not correctness.

So the verification prompt is built around three sentences:

> You have not seen any prior conclusions. Independently retrieve, and answer only whether this claim exists
> and whether the numbers are supported. Give a URL **you** found. If you cannot find it, say you cannot.

And it is issued to a *fresh* agent per claim — not one agent checking a batch, where the first few verdicts
set the tone.

### What this actually caught

A smoke test on classifier-free guidance (CFG), a topic with no ambiguity about being well documented,
produced a draft with three real errors:

| Draft | After independent verification |
|---|---|
| "CFG is a 2022 paper" | A short version appeared at the **NeurIPS 2021 Workshop**; the arXiv posting is 2022. First presentation was late 2021. |
| "Classifier guidance was introduced by Dhariwal & Nichol" | Named and popularised there, but the gradient-guidance idea appears earlier (Sohl-Dickstein 2015; Song 2021). "Named it" ≠ "invented it". |
| "Raising guidance always trades diversity for fidelity" | Not a law. Follow-up work shows restricting guidance to an intermediate noise band can improve both. |

None of these were fabrications. All three were the *plausible compression* a model produces when it
summarises from memory. That is the more common failure and it is invisible without a second retrieval.

## 2. Why four verdicts, not two

`confirmed` / `unconfirmed` is the obvious pair. `contradicted` covers the interesting conflict case.
The one that matters most is missing from nearly every verification scheme:

**`incomparable` — two sources that are both real and both correct, whose measurements cannot be compared.**

A real example from an imaging field: three independent groups each reported "centimetre-scale resolution".
Three different calibration methods, three different target complexities, three different atmospheric
conditions. Nothing contradicted anything. Nothing corroborated anything either.

If you mark that `confirmed`, a downstream reader writes "A is better than B" into a manuscript. That
sentence is unsupported, and it is exactly the kind of sentence reviewers destroy.

The skill therefore forces the report to carry `[incomparable]` and to state **what differs**. The cost is
a less impressive-looking table. The benefit is a defensible one.

### Recognition signals used to trigger it

1. Same metric name, different definition or formula across papers.
2. Similar or "better than" numbers, but different conditions, samples or calibration.
3. Multiple mutually unrecognised evaluation regimes co-existing in the field.

## 3. Why field archetypes

The first version of this skill produced eight documents and worked well — on a machine-learning field.

Given a hardware field it produced a chapter titled "benchmarks, metrics and SOTA" that had nothing to put
in it. That field has no leaderboard: its progress is measured by *how close a measurement gets to a
physical limit*, with the limit's denominator stated explicitly. Given a mathematics field it would have
failed harder still: there are no datasets and no SOTA at all, only conjectures becoming theorems or
counterexamples.

The fix is a mandatory type decision at Phase 0, based on two questions that cut across disciplines:

- **How is "good" quantified here?** (leaderboard / instrument vs physical limit / reproducible measurement /
  theorem / compliance / argument)
- **When two practitioners disagree, what adjudicates?** — this one decides the report structure, because it
  is what the field actually treats as proof.

Six types follow, and each one changes six things: the reconnaissance lanes, chapter 4, chapter 5, the
verification channels, the proof standard, and the common traps.

Chapter 5 has four alternative layouts for fields without a leaderboard (see
`references/field-archetypes.md`). The generalised terminology matters too: 形式化 becomes
"formalisation **or operationalisation**" — because in an experimental field the useful equivalent of
"write the equation" is "state how you measure it, in what unit, at what typical magnitude".

## 4. Why a separate opportunity map

This was the second real failure of version 1, and it came from an actual user question:

> "Based on this report — is multimodal fusion still a blank? What directions exist?"

The report contained all the raw material. It could not answer the question, for three reasons:

1. **The compound term was never decomposed.** "Multimodal" turned out to mean three different things in
   that field, at three completely different levels of maturity — one of them was not a gap at all, it was
   the field's own subject matter. A verdict on the compound word is necessarily wrong.
2. **"Open problems" is not "opportunities".** Chapter 7 listed six unresolved problems with no way to tell
   which were attackable: no first step, no cost, no dependency on resources the user might already have.
3. **The information was scattered** across the frontier chapter, the open-problems chapter and an appendix,
   and was never assembled *for that question*.

Hence a separate document with a fixed sequence — decompose, four-way verdict per dimension, card per
direction, rank by feasibility — and fixed card fields. The two fields that carry most of the value:

- **First falsifiable step**: something completable in ≤2 days or ≤1 week that can *fail*. "Look into it
  further" is not a step; "check whether the two sinograms are separable; if not, stop" is.
- **Assets, verified on disk**: not "you probably have data" but a path, a shape, a variable name.

The four verdicts for a direction are deliberately not just blank / not-blank:

| Verdict | Why it is separate |
|---|---|
| Real gap | Physically possible, someone could do it, it would publish — and nobody has |
| Fake gap | People are doing it, under a different name, in a language you did not search |
| Physically/logically impossible | People *did* think of it and computed that the payoff is negative. "Nobody did it" ≠ "nobody thought of it" |
| Retrieval blind spot | May well exist; your channels cannot reach it (paywalls, Chinese databases, theses) |

Collapsing the last two into "blank" is what produces proposals that a supervisor kills in one sentence.

## 5. Why local assets come before search

The most useful evidence in one real run came from the user's own disk: an unpublished manuscript containing
the field's reference skeleton, and source code revealing which methods the group had actually implemented.

Neither was discoverable online. Both were more authoritative than anything retrieved.

The rule that follows: **inventory what the user already has before searching**, and — the harder half —
**verify assets by listing directories and inspecting data, never by inferring from the report**. In the same
run, the direction ranking changed twice after inspection: a "we have waveform data" assumption turned out to
be projection-level data only, and a simulator assumed to be configurable turned out to be single-wavelength
with no noise model.

A report cannot know what is on the user's disk. Only a directory listing can.

## 6. Why a stop-loss rule

Verification is the expensive phase. When it starts failing wholesale the instinct is to push through.

But a high `unconfirmed` rate is almost never "the literature is bad". It is one of two things: the keyword
matrix is wrong (searching the wrong vocabulary, or missing the field's alternate names), or the retrieval
channels are wrong (hammering publisher pages that return 403 while a structured API sits unused).

So: **>1/3 unconfirmed → stop, return to Phase 0.** Continuing to verify with a broken keyword matrix produces
a long list of "not found" that looks like diligence and is actually wasted budget.

Same logic for the verification cap: verify everything when there are ≤24 candidates, otherwise the top 32
with the remainder explicitly reported as unverified. A report that says "16 claims were not verified" is
honest; one that quietly verified 32 of 48 and implies completeness is not.

## 7. What this does not solve

Being explicit, because overclaiming here would be ironic:

- **Paywalls.** Abstract-level evidence only, for many fields. The skill says so rather than filling gaps.
- **Non-indexed literature.** Chinese databases, theses, patents, conference abstracts, standards behind
  paywalls. The skill treats these as a *retrieval blind spot* and hands them to a user with access.
- **Domain judgement.** It can tell you a direction is not contradicted by the literature. It cannot tell you
  whether the idea is good.
- **Archetypes C–F are designed but not field-tested.** A and B have been run end to end.
- **Cost.** Six parallel lanes plus per-claim adversarial verification is intentionally wasteful. If you want
  cheap, this is the wrong tool.

---

## Testing

The workflow script has no filesystem or network API of its own — all work happens in subagents. That makes
it testable: **stub the hooks and run the control flow for real.** No API calls, no cost, and it catches the
bugs that matter (wrong lane set, missing tally keys, broken cap logic).

```js
// stub-harness.mjs — wrap the script body in an async IIFE and inject the hooks
const args = { field: "TEST", slug: "test", outdir: "C:\\tmp\\out",
               archetype: process.argv[2], scope: "s", negative: "n" };
const phase = () => {};
const log = (m) => console.log("  [log]", m);
const agent = async (p, o) => {
  const pr = o.schema.properties;
  if (pr.lane) return { lane: "L", items: [
    { title: "t1", why: "w", sources: ["https://e.com/1"], confidence: "high" }], notes: "n" };
  return { verdict: "confirmed", evidence: "https://e.com/2", reason: "r" };
};
const parallel = async (thunks) => Promise.all(thunks.map((t) => t().catch(() => null)));
const pipeline = async (items, ...stages) => Promise.all(items.map(async (it, i) => {
  let prev = it;
  for (const s of stages) { try { prev = await s(prev, it, i); } catch { return null; } }
  return prev;
}));
const __r = await (async () => {
  /* <- paste references/scan.workflow.js here */
})();
console.log(JSON.stringify({ archetype: __r.archetypeLabel, lanes: __r.lanesDone.length,
  tally: __r.tally, notVerified: __r.notVerified }, null, 1));
```

```bash
for a in A B C D E F; do node stub-harness.mjs $a; done
```

Note: `node --check` on the raw script fails with `Illegal return statement` — the body is a function body,
not a module. Wrap it before syntax-checking.

To exercise the cap and the stop-loss, make the stub return 8 items per lane and `unconfirmed` for every
verdict: you should see 48 candidates, 32 verified, 16 not verified, and the stop-loss log line.
