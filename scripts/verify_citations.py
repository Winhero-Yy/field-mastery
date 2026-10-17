#!/usr/bin/env python3
"""field-mastery · Phase 5 交付前引文自检。

它挡不住"编造了一篇不存在的论文"——那靠 Phase 2 的人工核验。
它能挡住的是更机械的一种失误：**写了引文特征，却没给来源链接**。
这种行读者无法验证，是幻觉最舒服的藏身处。

用法：
    python verify_citations.py <输出目录>

退出码：0 = 通过；1 = 有违规行；2 = 用法错误。
输出全部为 ASCII，避免 GBK 控制台报错。
"""

import os
import re
import sys

# 出现这些特征，说明这一行在讲一条具体的文献/数字事实
CITATION_HINTS = [
    re.compile(r"arXiv\s*:?\s*\d{4}\.\d{4,5}", re.I),
    re.compile(r"\b10\.\d{4,9}/[^\s)\]]+"),          # DOI
    re.compile(r"\bet\s+al\.?", re.I),
    re.compile(r"\b(NeurIPS|ICML|ICLR|CVPR|ECCV|ICCV|ACL|EMNLP|NAACL|SIGGRAPH|AAAI|IJCAI|KDD|OSA|SPIE|Optica)\b"),
    re.compile(r"\b(19|20)\d{2}\b"),                  # 年份
    re.compile(r"\b(SOTA|state[\s-]of[\s-]the[\s-]art)\b", re.I),
]

# 证据标记：[已核实] / [已核实: url] / [多源: a, b] / [单源] / [不可比] / [待核实]
MARKER_RE = re.compile(r"\[(已核实|多源|单源|不可比|待核实)[^\]]*\]")

# 有这些，说明这一行给了可点的来源或明确的未核实标记
SOURCE_PATTERNS = [
    re.compile(r"https?://"),
    MARKER_RE,
    re.compile(r"待核实区"),
]

# 这些文件天然允许没有链接
EXEMPT_FILES = {"06-待核实区.md", "00-定界与计划.md", "进度.md", "evidence-rules.md"}
EXEMPT_DIRS = {"references", "scripts", "assets"}

# 文件级豁免：文件里任意位置出现这个声明，整份跳过。
# 用途：术语对照表、索引表、模板文件——它们是"速查"不是"论证"，
# 里面的人名年份已在正文核验过，逐行挂链接只会毁掉可读性。
#   用法：<!-- citations: index-only -->
INDEX_ONLY_MARK = "<!-- citations: index-only -->"

# 明显的结构行/说明行，不算断言
SKIP_LINE = [
    re.compile(r"^\s*$"),
    re.compile(r"^\s*#{1,6}\s"),          # 标题
    re.compile(r"^\s*\|?\s*-{2,}"),       # 表格分隔行
    re.compile(r"^\s*>"),                 # 引用块（局限声明等）
    re.compile(r"^\s*```"),               # 代码围栏
    re.compile(r"^\s*<!--"),
]


def is_prose(line: str) -> bool:
    for pat in SKIP_LINE:
        if pat.search(line):
            return False
    return True


# 证据可以写在断言的下方/上方一两行（markdown 里很常见：断言一行、`[已核实: url]` 下一行）。
# 只按单行匹配会把这类正确写法全判成违规——实测假阳性率极高，所以按窗口查。
WINDOW = 2


def has_source(context: str) -> bool:
    """Check the claim line plus a small neighbourhood for a source."""
    return any(p.search(context) for p in SOURCE_PATTERNS)


def looks_like_citation(line: str) -> bool:
    return any(p.search(line) for p in CITATION_HINTS)


def scan(root: str):
    violations = []
    stats = {"files": 0, "lines": 0, "citations": 0, "marked": 0, "skipped_index": 0}

    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXEMPT_DIRS and not d.startswith(".")]
        for name in sorted(filenames):
            if not name.endswith(".md"):
                continue
            if name in EXEMPT_FILES:
                continue
            path = os.path.join(dirpath, name)
            rel = os.path.relpath(path, root)
            try:
                with open(path, "r", encoding="utf-8-sig", errors="replace") as fh:
                    lines = fh.readlines()
            except OSError as exc:
                violations.append((rel, 0, "cannot read: %s" % exc))
                continue

            if any(INDEX_ONLY_MARK in ln for ln in lines):
                stats["skipped_index"] += 1
                continue

            stats["files"] += 1

            for i, raw in enumerate(lines, start=1):
                stats["lines"] += 1
                line = raw.rstrip("\n")
                if not is_prose(line):
                    continue
                if MARKER_RE.search(line):
                    stats["marked"] += 1
                if not looks_like_citation(line):
                    continue
                stats["citations"] += 1
                lo = max(0, i - 1 - WINDOW)
                hi = min(len(lines), i + WINDOW)
                context = "".join(lines[lo:hi])
                if not has_source(context):
                    violations.append((rel, i, line.strip()))

    return violations, stats


def clip(text: str, width: int = 110) -> str:
    return text.encode("ascii", "backslashreplace").decode("ascii")[:width]


def main() -> int:
    if len(sys.argv) != 2:
        sys.stderr.write("usage: python verify_citations.py <output-dir>\n")
        return 2

    root = sys.argv[1]
    if not os.path.isdir(root):
        sys.stderr.write("not a directory: %s\n" % clip(root))
        return 2

    violations, stats = scan(root)

    # All output below is deliberately ASCII-only: a GBK console mangles CJK
    # here, and a checker nobody can read is a checker nobody runs.
    print("field-mastery citation check")
    print("  dir        : %s" % clip(os.path.abspath(root)))
    print("  md files   : %d" % stats["files"])
    print("  lines      : %d" % stats["lines"])
    print("  citation-ish lines : %d" % stats["citations"])
    print("  lines carrying an evidence marker : %d" % stats["marked"])
    print("  files skipped via index-only mark : %d" % stats["skipped_index"])
    print("")

    if not violations:
        print("PASS - every citation-like line carries a source link or a [待核实] marker.")
        return 0

    print("FAIL - %d line(s) state a literature/number fact without a source:" % len(violations))
    for rel, lineno, text in violations:
        print("  %s:%d" % (clip(rel, 60), lineno))
        print("      %s" % clip(text))
    print("")
    print("Fix: attach a real URL, or move the claim into 06-<pending>.md and tag it.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
