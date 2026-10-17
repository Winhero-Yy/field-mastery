/**
 * field-mastery · smoke test
 *
 * A deliberately small version of the Phase 1 + Phase 2 pipeline: 2 lanes instead of 6,
 * ≤3 claims per lane, ≤4 claims verified. Purpose is not research output — it is to confirm that
 * the machinery works in *your* agent: parallel fan-out, schema validation, dedup, independent
 * verification, four-way tally.
 *
 * Run it on a narrow, well-documented topic so the agents finish quickly. The example topic below
 * (classifier-free guidance) is used because it is small and every claim is easy to check — which
 * makes it a good calibration target: if your run reports `confirmed` for something you know is
 * wrong, your verification wiring is broken, not the topic.
 *
 * How to run (DSH example):
 *   workflow({ script: <this file's body without the leading comment block>,
 *              args:   { field: "classifier-free guidance in diffusion models",
 *                        scope: "CFG only; not diffusion models generally, not image editing apps" },
 *              meta:   <see below> })
 *
 * meta = {
 *   "name": "field-mastery-smoke",
 *   "description": "Smoke test: parallel fan-out, structured schemas, independent verification",
 *   "phases": [
 *     { "title": "地形测绘", "detail": "2 narrow lanes in parallel" },
 *     { "title": "证据核验", "detail": "independent re-retrieval, four-way verdict" }
 *   ]
 * }
 */

const field = args.field;
const scope = args.scope;

const LANES = [
  {
    key: "origin",
    title: "起源与关键论文",
    ask: "Who proposed it, in which paper, what is the core formulation, and why does it work " +
         "(the training-time conditioning-dropout argument). Give the paper and its arXiv link.",
  },
  {
    key: "effect",
    title: "作用与代价",
    ask: "What happens when the guidance scale goes up versus down — effects and costs " +
         "(diversity, saturation, over-exposure). Give sources that support these claims.",
  },
];

const itemSchema = {
  type: "object", additionalProperties: false,
  required: ["title", "why", "sources", "confidence"],
  properties: {
    title: { type: "string" },
    why: { type: "string" },
    sources: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
};

const laneSchema = {
  type: "object", additionalProperties: false,
  required: ["lane", "items", "notes"],
  properties: {
    lane: { type: "string" },
    items: { type: "array", items: itemSchema },
    notes: { type: "string" },
  },
};

const verdictSchema = {
  type: "object", additionalProperties: false,
  required: ["verdict", "evidence", "reason"],
  properties: {
    verdict: {
      type: "string",
      enum: ["confirmed", "unconfirmed", "contradicted", "incomparable"],
    },
    evidence: { type: "string" },
    reason: { type: "string" },
  },
};

phase("地形测绘");

const built = await parallel(LANES.map((lane) => async () =>
  agent([
    `研究领域：${field}`,
    `边界：${scope}`,
    `你只负责这一条线：${lane.title}`,
    lane.ask,
    "",
    "硬性要求：",
    "1) 只写你本次真实检索到的内容，禁止凭记忆列举文献或数字。",
    "2) sources 必须是真实可访问 URL。",
    "3) items 最多 3 条，宁缺毋滥。",
    "4) why 用一句话说清为什么重要，不要复述标题。",
  ].join("\n"), { label: lane.title, phase: "地形测绘", schema: laneSchema }),
));

const lanes = built.filter(Boolean);
log(`侦查线完成 ${lanes.length}/2`);

const seen = {};
const claims = [];
for (const lane of lanes) {
  for (const it of lane.items || []) {
    const k = String(it.title || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!k || seen[k]) continue;
    seen[k] = true;
    claims.push({ lane: lane.lane, title: it.title, why: it.why, sources: it.sources, confidence: it.confidence });
  }
}
const CANDIDATES = claims.slice(0, 4);
log(`候选 ${claims.length} 条，取前 ${CANDIDATES.length} 条核验`);

phase("证据核验");

const verified = await pipeline(CANDIDATES, async (prev, claim) => {
  const v = await agent([
    `领域：${field}`,
    "你没有见过任何先前的结论。下面这条真伪未知，请独立检索判定。",
    `条目：${claim.title}`,
    `草稿声称：${claim.why}`,
    claim.sources && claim.sources.length ? `草稿来源：${claim.sources.join(" | ")}` : "草稿未给来源。",
    "不要因为草稿给了来源就相信它——自己打开或另找来源。evidence 必须是**你自己找到**的 URL，找不到就留空。",
    "verdict：confirmed（独立来源支持）/ unconfirmed（检索不到但不能断定不存在）/",
    "         contradicted（来源冲突或有反证）/ incomparable（各有来源但口径不可通约）。",
    "不要推断。找不到就说找不到。",
  ].join("\n"), { label: `核验：${String(claim.title).slice(0, 30)}`, phase: "证据核验", schema: verdictSchema });
  return {
    title: claim.title,
    lane: claim.lane,
    verdict: v ? v.verdict : "unconfirmed",
    evidence: v ? v.evidence : "",
    reason: v ? v.reason : "核验子代理失败",
  };
});

const rows = verified.filter(Boolean);
const tally = { confirmed: 0, unconfirmed: 0, contradicted: 0, incomparable: 0 };
for (const r of rows) tally[r.verdict] = (tally[r.verdict] || 0) + 1;
log(`confirmed ${tally.confirmed} / unconfirmed ${tally.unconfirmed} / contradicted ${tally.contradicted} / incomparable ${tally.incomparable}`);

return {
  smoke: "ok",
  lanesReturned: lanes.length,
  claimsDeduped: claims.length,
  verified: rows,
  tally,
};
