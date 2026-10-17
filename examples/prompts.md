# Prompt examples

What actually invokes this skill, and what does not.

---

## Full research run

**Chinese**

```
帮我系统研究一下「<领域>」领域。我目前是<阶段>，希望从基础原理开始，
全面掌握它的发展历史、关键论文、核心算法、技术路线、前沿趋势，以及目前尚未解决的问题。
最后帮我制定学习路线。
```

Variants that also work:

- `带我入门 <领域>，我要能听懂组会`
- `<领域> 的全景地图，从零开始`
- `帮我调研 <领域> 方向并制定学习计划，我每周能投入 8 小时`
- `我是转方向的，<原方向> 转 <新方向>，先把新方向摸清楚`

**English**

```
Systematically research the field of <FIELD>. I'm a <stage> in <background>.
I want to go from fundamentals to a full picture: history, key papers, core methods,
technical routes, frontier trends, and what remains unsolved — then give me a reading plan.
```

- `Give me the lay of the land in <FIELD> — I need to hold my own in a lab meeting`
- `Research <FIELD> for me; I'm choosing a thesis topic`

## Follow-up mode

Use after a report exists, or when you just want the judgement without a full run.

```
根据这个研究报告，<复合词> 现在还是空白吗？可能的方向有哪些？
```

```
Reading the report — is <X> still a blank? What could I actually do, given what I have?
```

- `这个方向能不能发文章 / 值不值得做`
- `我该做什么？手上只有 <资源描述>`
- `<X> 是空白吗`（最容易被用错的问法——见下）

## What will *not* invoke it

The skill explicitly declines these, and that is intentional:

| Request | Why not |
|---|---|
| "Give me 5 papers on X" | Use a literature search tool. This is 30× the cost for the same answer |
| "What is a proximal operator?" | Single-concept question. Use the concept skill or just ask |
| "Summarise this PDF" | Read the PDF |
| "Is this abstract good?" | Not a field question |

## A note on "is X still a blank?"

This phrasing is the single most common way to get a wrong answer, because **X is almost always a compound
term** and its components differ wildly in maturity.

Worked example, from a real run:

> "Is **multimodal fusion** still a blank [in this field]?"

Decomposed:

| Component | Verdict |
|---|---|
| Multi-view / multi-angle | **Not a gap at all** — it *is* the field's own subject matter |
| Cross-sensor fusion | **Real gap** in this field; already solved in an adjacent one |
| Intensity + time-of-flight | Half-gap: the data contains both, nobody inverts jointly |
| Waveform shape | **Real gap** — encodes surface orientation, everyone discards it |
| Multi-wavelength / polarisation | Retrieval blind spot — cannot confirm either way |

Answering "yes" or "no" to the compound question would have been wrong in five different ways at once.

So if you ask the compound question, expect the skill to **decompose it first and answer per component.**
That is not evasion; it is the only answer that is not misleading.

## Getting a useful answer faster

Three things make the output materially better, in order of impact:

1. **Say what you already have.** "I have the lab's simulation code and 4 GB of synthetic data, but no raw
   acquisitions" changes the direction ranking more than any other single sentence.
2. **Say what you want to do with it.** "I need to pick a thesis topic in three months" and "I need to
   understand this for a meeting next week" produce different documents.
3. **Say your background honestly.** "Maths is shaky" changes the depth of the layered explanations; claiming
   otherwise gets you a report you cannot read.
