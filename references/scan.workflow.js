/**
 * field-mastery · Phase 1（地形测绘）+ Phase 2（证据核验）并行脚本骨架
 *
 * 通用版：按领域类型（archetype）切换六条侦查线。类型判定见 references/field-archetypes.md。
 *
 * 用法：
 *   1. 整个文件内容作为 workflow 工具的 `script` 参数。
 *   2. `args` 传：
 *      {
 *        field:      "研究领域名",
 *        slug:       "kebab-case-slug",
 *        outdir:     "输出目录绝对路径",
 *        archetype:  "A" | "B" | "C" | "D" | "E" | "F",   // 缺省 A
 *        scope:      "边界约束（包含/不包含）",
 *        negative:   "要排除的同名不同物，逗号分隔"
 *      }
 *   3. meta 用下面的对象（phases 标题必须与脚本里的 phase() 完全一致）：
 *
 * meta = {
 *   "name": "field-mastery-scan",
 *   "description": "六路并行测绘一个领域，再对候选断言做独立核验",
 *   "phases": [
 *     { "title": "地形测绘", "detail": "六条独立侦查线并行检索" },
 *     { "title": "证据核验", "detail": "逐条独立复核，四态判定" }
 *   ]
 * }
 *
 * 注意：脚本内没有文件/网络/定时器 API —— 所有检索都由子代理完成。
 * agent() 失败时 resolve 成 null，因此每一步都要 filter(Boolean)。
 */

// ── 参数 ────────────────────────────────────────────────────────────────
const field = args.field;
const outdir = args.outdir;
const scope = args.scope || "（未指定，自行按主流定义收敛）";
const negative = args.negative || "（未指定——请自行找出 1-2 个同名不同物的歧义词并主动排除）";
const archetype = args.archetype || "A";

// ── 六类领域的侦查线（A/B 是默认；C-F 按 field-archetypes.md 换线）──────────
const ARCHETYPES = {
  A: {
    label: "算法/模型",
    lanes: [
      { key: "01-survey", title: "综述与知识骨架", ask: "找近 3 年的权威综述/survey/review，并**逐篇给出目录结构（章节标题）**——综述目录就是这个领域公认的知识骨架。再指出这些综述在「领域该分成几块」上的分歧。" },
      { key: "02-origin", title: "起源与里程碑", ask: "奠基工作 + 不超过 4 次关键突破/范式转换。每条说清：之前怎么做、它改了什么、为什么这次改变能发生（数据？算力？理论？）。" },
      { key: "03-methods", title: "方法族与技术路线", ask: "当前有哪几大技术路线？逐条给核心思想、代表工作、**代价**（算力/数据/可解释性/工程复杂度），并指出**它们彼此的分歧点**，而不只是罗列优点。" },
      { key: "04-bench", title: "基准、指标与 SOTA", ask: "标准数据集、评测指标、公认榜单，**当前 SOTA 数字及出处**。**如果这个领域其实没有统一 benchmark，请明确说出来并给出证据**——这比编一张 SOTA 表有价值得多。" },
      { key: "05-frontier", title: "近 12 个月前沿", ask: "最近 12 个月在动什么？哪些已形成共识、哪些还在争？有没有让旧结论失效的新结果、或被证伪的热门方向？" },
      { key: "06-ecosystem", title: "生态、名词辨析、入门资源", ask: "可直接上手的资源：高质量开源实现与框架、权威课程与教材、活跃团队/实验室。另做**名词辨析**：这个领域名在不同圈子里分别指什么（各给 1-2 个代表性来源）。" },
    ],
  },
  B: {
    label: "系统/器件",
    lanes: [
      { key: "01-survey", title: "综述与知识骨架", ask: "找权威综述/review，并给出目录结构（= 领域公认的知识骨架）。指出「领域该分成几块」上的分歧。" },
      { key: "02-origin", title: "起源与里程碑", ask: "奠基工作与不超过 4 次关键突破。**必须区分「原理提出」「首次实验验证」「系统指标突破」三类节点**——它们常被混为一谈。每条说清之前怎么做、改了什么。" },
      { key: "03-methods", title: "系统架构族", ask: "当前有哪几大系统架构/技术路线？逐条给核心原理、代表系统、**代价**（成本、体积、功耗、标定难度、环境适应性），并指出彼此分歧点。" },
      { key: "04-bench", title: "性能极限与标定方法", ask: "这个领域的**物理/工程极限**是什么（给出公式与典型代入值）？各系统的实测指标是多少？**特别注意：指标靠什么方法标定**——不同标定方法的数字不可比较。有没有统一的测试标准？没有就明说。" },
      { key: "05-frontier", title: "近 12 个月前沿", ask: "最近 12 个月在动什么？哪些已形成共识、哪些还在争？有没有实测结果推翻了旧记录？" },
      { key: "06-ecosystem", title: "器件、平台、名词辨析", ask: "关键器件与供应链、实验平台、可复用的标准件/模块、权威课程。另做**名词辨析**：这个领域名在不同圈子里分别指什么（各给 1-2 个代表性来源）。" },
    ],
  },
  C: {
    label: "实验科学",
    lanes: [
      { key: "01-survey", title: "综述与知识骨架", ask: "找权威综述/review 与经典教科书，给出目录结构。指出领域分块上的分歧。" },
      { key: "02-origin", title: "起源与里程碑", ask: "奠基发现与不超过 4 次关键突破，**包含仪器/方法的发明**（实验科学的突破常来自新测量手段）。每条说清之前能测什么、之后能测什么。" },
      { key: "03-methods", title: "体系与样品体系", ask: "这个领域研究哪些体系/样品？按什么维度分类？各类体系的**代表性结果与已知异常**是什么？" },
      { key: "04-bench", title: "测量手段与指标", ask: "主流测量手段有哪些？各自能测什么、分辨率/灵敏度、样品要求、成本、典型误差。**这是分工不是排名**。有没有公认的对照标准/参考样品？" },
      { key: "05-frontier", title: "近 12 个月前沿", ask: "最近 12 个月的新现象/新机制/新手段。特别注意**预印本与会议口头报告**，以及有没有结果无法重复的争议。" },
      { key: "06-ecosystem", title: "仪器、试剂、开放数据", ask: "关键仪器与供应商、试剂/材料来源、公开数据库与标准样品库、权威课程。另做**名词辨析**（同名词在不同子领域的含义）。" },
    ],
  },
  D: {
    label: "形式科学",
    lanes: [
      { key: "01-survey", title: "综述与讲义", ask: "找权威综述、讲义、知名课程大纲，并给出目录结构——这些大纲就是这个领域公认的知识骨架。" },
      { key: "02-origin", title: "问题谱系", ask: "这个领域的核心问题是怎么被提出的？如何变形、推广、被特化？不超过 4 次关键转折。**形式科学的进步常表现为「问题被重新表述」**。" },
      { key: "03-methods", title: "方法与工具箱", ask: "证明这个领域结论的**主要技术手段**有哪些？（如对偶、紧致性、随机方法、构造性反例…）各自适用什么类型的问题、局限在哪。" },
      { key: "04-bench", title: "猜想—证明状态", ask: "列出核心猜想及其状态：已证 / 已推翻 / 部分解决 / 仍开放。**必须区分「预印本声称证明」与「已被接受」**。给每条的关键工作与出处。" },
      { key: "05-frontier", title: "近 12 个月前沿", ask: "最近 12 个月的新结果。特别注意：有没有声称解决长期猜想的工作，其状态如何（已发表？有争议？被发现漏洞？）。" },
      { key: "06-ecosystem", title: "教材、讲义、课程", ask: "最好的教材与讲义、公开课程、综述性讲座（survey talk）。另做**名词辨析**：同一术语在不同分支的含义差异。" },
    ],
  },
  E: {
    label: "应用/工程",
    lanes: [
      { key: "01-guideline", title: "指南与共识", ask: "这个领域的官方指南、行业共识、标准（ISO/IEC/GB/ASTM 等）。给出**适用范围、版本年份、发布机构**。不同机构的标准有无冲突？" },
      { key: "02-origin", title: "起源与里程碑", ask: "奠基工作与不超过 4 次关键转变（常由技术或监管驱动）。每条说清之前怎么做、改了什么、驱动因素是什么。" },
      { key: "03-methods", title: "技术路线与合规要求", ask: "主流技术路线有哪些？逐条给核心做法、代表实践、**合规要求与代价**（成本、周期、副作用、可及性）。" },
      { key: "04-bench", title: "终点指标与成本", ask: "这个领域的**终点指标**是什么（临床终点？合格率？寿命？）定义、达标线、当前实践水平、监管要求。**成本与可及性也是指标**。不同地区的标准差异要指出。" },
      { key: "05-frontier", title: "近 12 个月前沿", ask: "最近 12 个月的技术进展与**监管动态**（新批文、新指南、新限制）。哪些做法被否定或撤回？" },
      { key: "06-ecosystem", title: "监管、产业、供应链", ask: "监管机构与流程、主要产业方、供应链关键环节、成本结构。另做**名词辨析**（同名词在监管与学术语境下的差异）。" },
    ],
  },
  F: {
    label: "人文社科",
    lanes: [
      { key: "01-survey", title: "研究综述与书评", ask: "找权威的研究综述（review essay）与书评，给出它们如何划分这个领域的问题域。指出分块上的分歧。" },
      { key: "02-origin", title: "思想史与流派形成", ask: "这个领域的思想史脉络：核心问题怎么被提出、哪些流派在什么背景下形成、不超过 4 次关键转向。" },
      { key: "03-methods", title: "流派与核心争论", ask: "当前有哪几大流派/立场？**逐条给核心主张、依据、以及它反对谁**。重点写清争论的真正焦点在哪，而不只是罗列观点。" },
      { key: "04-bench", title: "史料、案例与原始材料", ask: "这个领域依赖哪些原始材料/档案/数据库/案例集？获取门槛如何？**同一材料的不同解读**有哪些（这是本领域「不可比」的主要来源）。" },
      { key: "05-frontier", title: "近 12 个月前沿", ask: "最近 12 个月的新刊、新史料披露、新译本、新争论。有没有旧结论因新史料而被推翻？" },
      { key: "06-ecosystem", title: "核心文本、译本、档案馆", ask: "必读核心文本及其权威译本（**注明版本差异**）、档案馆与数据库、权威课程。另做**名词辨析**：同一术语在不同流派中的不同含义。" },
    ],
  },
};

const cfg = ARCHETYPES[archetype] || ARCHETYPES.A;

// ── 通用前置约束（不含任何学科假设）────────────────────────────────────
const PREAMBLE = [
  `研究领域：${field}`,
  `领域类型：${cfg.label}（${archetype} 类）`,
  `边界约束：${scope}`,
  `必须排除的同名不同物：${negative}`,
  "",
  "【硬性要求（违反则本次结果作废）】",
  "1) 只写你在本次任务中真正检索到的内容。禁止凭记忆列举文献、作者、年份、数字。",
  "2) sources 必须是真实可访问 URL（DOI、arXiv、期刊页、官方仓库、课程页、标准页）。",
  "   没把握的编号不要写。拿不准的把 confidence 设为 low 并在 notes 说明。",
  "3) items 最多 8 条，宁缺毋滥。条目少但可靠，远好于条目多但掺假。",
  "4) why 用一到两句说清「它是什么 + 为什么重要」，不要复述标题。",
  "5) **如果这一条线在你这个领域根本不存在**（例如领域没有 benchmark、没有开源代码、",
  "   没有统一指标），请直接说「本领域没有 X」并给出你怎么确认的——**这比编一个出来有价值得多**。",
  "6) 详细笔记写进文件（见下），返回的结构化对象只是索引。",
].join("\n");

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

// ── Phase 1：地形测绘 ───────────────────────────────────────────────────
phase("地形测绘");

const built = await parallel(cfg.lanes.map((lane) => async () =>
  agent([
    PREAMBLE,
    "",
    `你只负责这一条线：${lane.title}`,
    lane.ask,
    "",
    "【详细笔记】除了返回结构化对象，还要把详细发现写成 Markdown 文件：",
    `路径：${outdir}\\_scan\\${lane.key}.md`,
    "格式：每条一个三级标题，下面写——出处（完整 URL）、一句话贡献、为什么重要、",
    "关键细节（方法/数据/具体数字/实验条件）、以及【不确定之处】。",
    "这份文件是主报告的主要素材来源，写详细些，但只写你真实检索到的。",
  ].join("\n"), { label: lane.title, phase: "地形测绘", schema: laneSchema }),
));

const lanes = built.filter(Boolean);
log(`侦查线完成 ${lanes.length}/${cfg.lanes.length}`);

if (lanes.length === 0) {
  return { error: "全部侦查线失败，请检查网络或降低并发后重试" };
}

// ── 去重 → 动态决定核验规模 ─────────────────────────────────────────────
const seen = {};
const claims = [];
for (const lane of lanes) {
  for (const it of lane.items || []) {
    const k = String(it.title || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 80);
    if (!k || seen[k]) continue;
    seen[k] = true;
    claims.push({ lane: lane.lane, title: it.title, why: it.why, sources: it.sources, confidence: it.confidence });
  }
}

// 规则：候选 ≤24 全核验；>24 取优先级最高的 32 条（低置信度排后面）
const sorted = claims
  .sort((a, b) => (a.confidence === "low" ? 1 : 0) - (b.confidence === "low" ? 1 : 0));
const CAP = sorted.length <= 24 ? sorted.length : 32;
const CANDIDATES = sorted.slice(0, CAP);

log(`候选 ${claims.length} 条，去重后取 ${CANDIDATES.length} 条进入核验`);

// ── Phase 2：证据核验 ───────────────────────────────────────────────────
phase("证据核验");

const verified = await pipeline(CANDIDATES, async (prev, claim) => {
  const v = await agent([
    `领域：${field}（${cfg.label}）`,
    "",
    "你没有见过任何先前的结论。下面这条真伪未知，请独立检索判定。",
    "",
    `条目：${claim.title}`,
    `草稿声称：${claim.why}`,
    claim.sources && claim.sources.length ? `草稿来源：${claim.sources.join(" | ")}` : "草稿未给来源。",
    "",
    "不要因为草稿给了来源就相信它——自己去打开那个来源，或另找来源。",
    "evidence 必须是**你自己找到**的 URL，找不到就留空。",
    "",
    "verdict 四选一：",
    "  confirmed    = 独立来源支持，存在且描述基本准确",
    "  unconfirmed  = 检索不到，但不能断定不存在",
    "  contradicted = 来源之间冲突，或有明确反证",
    "  incomparable = 有来源，但它与其他来源的口径不可通约（不同标定方法/实验条件/指标定义），",
    "                 因此数字**不能互证也不能互否**",
    "",
    "不要推断。找不到就说找不到——这一条的使命是挡住幻觉，不是凑数。",
    "reason 用一句话，不超过 80 字。",
  ].join("\n"), { label: `核验 ${String(claim.title).slice(0, 34)}`, phase: "证据核验", schema: verdictSchema });

  return {
    lane: claim.lane,
    title: claim.title,
    why: claim.why,
    draftSources: claim.sources || [],
    verdict: v ? v.verdict : "unconfirmed",
    evidence: v ? v.evidence : "",
    reason: v ? v.reason : "核验子代理失败，按未核实处理",
  };
});

const rows = verified.filter(Boolean).map((r) => ({
  lane: r.lane,
  title: r.title,
  why: r.why,
  draftSources: r.draftSources,
  verdict: r.verdict,
  evidence: r.evidence,
  reason: r.reason,
}));

const tally = { confirmed: 0, unconfirmed: 0, contradicted: 0, incomparable: 0 };
for (const r of rows) tally[r.verdict] = (tally[r.verdict] || 0) + 1;
log(`confirmed ${tally.confirmed} / unconfirmed ${tally.unconfirmed} / contradicted ${tally.contradicted} / incomparable ${tally.incomparable}`);

// 止损提示：失败率过高说明关键词或通道选错，不是文献质量问题
const failRate = rows.length ? (tally.unconfirmed / rows.length) : 0;
if (failRate > 1 / 3) {
  log(`⚠ 未核实占比 ${(failRate * 100).toFixed(0)}% > 1/3 —— 按 evidence-rules.md §10，`);
  log(`  应停止核验，回头重做 Phase 0 的关键词矩阵与通道预检，而不是继续扫。`);
}

return {
  field,
  archetype,
  archetypeLabel: cfg.label,
  lanesDone: lanes.map((l) => ({ lane: l.lane, items: (l.items || []).length, notes: l.notes })),
  claimsTotal: claims.length,
  verifiedCount: rows.length,
  notVerified: claims.length - rows.length,
  tally,
  confirmed: rows.filter((r) => r.verdict === "confirmed"),
  incomparable: rows.filter((r) => r.verdict === "incomparable"),
  contradicted: rows.filter((r) => r.verdict === "contradicted"),
  unconfirmed: rows.filter((r) => r.verdict === "unconfirmed"),
};
