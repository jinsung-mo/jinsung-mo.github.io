"""Build an animated two-pane terminal SVG from real axMap demo output."""
import sys
from pathlib import Path
from xml.sax.saxutils import escape

out_dir = Path(sys.argv[1])
dest = Path(sys.argv[2])

def load(i):
    lines = (out_dir / f"{i}.txt").read_text(encoding="utf-8").rstrip("\n").split("\n")
    code = lines[-1].split("=")[1]
    return lines[:-1], code

STEPS = [
    ("A", "①", 'axmap claim src/auth --task 로그인 --intent "토큰 갱신 수정"', 1,
     "① A가 src/auth 폴더를 선점합니다"),
    ("B", "②", "axmap claim src/auth/login.ts --task 소셜로그인", 2,
     "② B가 그 안의 파일을 잡으려 하자, 시작 전에 거절하고 누가·왜 잡았는지 알려줍니다"),
    ("B", "③", "axmap claim src/authz --task 권한정책", 3,
     "③ 이름이 비슷해도 다른 폴더(src/authz)는 막지 않습니다"),
    ("A", "④", "axmap release", 4,
     "④ A가 작업을 마치고 반납합니다"),
    ("B", "⑤", "axmap claim src/auth/login.ts --task 소셜로그인", 5,
     "⑤ 이제 B가 같은 파일을 이어받습니다"),
]

W, PANE_W, GAP, PAD = 1280, 620, 16, 24
LH, TOP = 21, 92
CYCLE = 22.0          # seconds per loop
STEP_T = [0.6, 3.6, 9.6, 12.6, 15.6]  # seconds each step appears
HOLD_END = 20.8       # everything visible until here, then fade out

def color(line):
    s = line.strip()
    if s.startswith("claim 거부") or s.startswith("x "):
        return "err"
    if "성공" in s or "완료" in s or s.startswith("+ "):
        return "ok"
    if s.startswith(("점유자", "작업", "시작", "TTL :", "TTL    :")) or s.startswith("("):
        return "warn"
    if s.startswith("TTL"):
        return "dim"
    if s.startswith(("다음 중", "- ")):
        return "dim"
    return "txt"

panes = {"A": [], "B": []}
for idx, (who, mark, cmd, n, _cap) in enumerate(STEPS):
    body, code = load(n)
    panes[who].append((idx, "cmd", f"{mark} $ {cmd}"))
    for ln in body:
        panes[who].append((idx, color(ln), ln))
    panes[who].append((idx, "err" if code != "0" else "dim", f"→ 종료 코드 {code}"))
    panes[who].append((idx, "txt", ""))

rows = max(len(v) for v in panes.values())
H = TOP + rows * LH + 96

def pct(t):
    return f"{t / CYCLE * 100:.2f}%"

css = [
    "text{font-family:'D2Coding','Cascadia Mono',Consolas,'Malgun Gothic',monospace;font-size:14.5px;white-space:pre}",
    ".bg{fill:#0f1117}.pane{fill:#161b22;stroke:#30363d}.bar{fill:#1f2630}",
    ".title{fill:#e6edf3;font-size:15px;font-weight:700}.sub{fill:#8b949e;font-size:13px}",
    ".cmd{fill:#79c0ff;font-weight:700}.ok{fill:#7ee787}.err{fill:#ff7b72;font-weight:700}",
    ".warn{fill:#e3b341}.dim{fill:#8b949e}.txt{fill:#c9d1d9}",
    ".cap{fill:#ffffff;font-size:16px;font-weight:700}.capbg{fill:#5b3fd6}.cstatic{opacity:0}",
]
for i, t in enumerate(STEP_T):
    css.append(f"@keyframes s{i}{{0%,{pct(t)}{{opacity:0}}{pct(t + 0.25)},{pct(HOLD_END)}{{opacity:1}}100%{{opacity:0}}}}")
    css.append(f".s{i}{{opacity:0;animation:s{i} {CYCLE}s linear infinite}}")
    end = STEP_T[i + 1] if i + 1 < len(STEP_T) else HOLD_END
    css.append(f"@keyframes c{i}{{0%,{pct(t)}{{opacity:0}}{pct(t + 0.25)},{pct(end - 0.1)}{{opacity:1}}{pct(end)},100%{{opacity:0}}}}")
    css.append(f".c{i}{{opacity:0;animation:c{i} {CYCLE}s linear infinite}}")
sel_s = ",".join(f".s{i}" for i in range(len(STEP_T)))
sel_c = ",".join(f".c{i}" for i in range(len(STEP_T)))
css.append(f"@media (prefers-reduced-motion:reduce){{{sel_s}{{animation:none;opacity:1}}{sel_c}{{animation:none;opacity:0}}.cstatic{{opacity:1}}}}")

parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" '
         f'aria-label="axMap 선점 충돌 시연: A가 src/auth를 선점하고, B의 src/auth/login.ts 선점은 거절되며, src/authz는 통과하고, A 반납 뒤 B가 이어받는다">',
         f"<style>{''.join(css)}</style>",
         f'<rect class="bg" width="{W}" height="{H}" rx="14"/>',
         f'<text class="title" x="{PAD}" y="34">axMap · 작업 선점 충돌 판정</text>',
         f'<text class="sub" x="{PAD}" y="56">실제 axmap-cli 1.4.0 출력 · 같은 원격을 공유하는 두 클론(A, B)</text>']

for k, who in enumerate(["A", "B"]):
    x = PAD + k * (PANE_W + GAP)
    parts.append(f'<rect class="pane" x="{x}" y="68" width="{PANE_W}" height="{rows * LH + 34}" rx="8"/>')
    parts.append(f'<rect class="bar" x="{x + 1}" y="69" width="{PANE_W - 2}" height="22" rx="7"/>')
    parts.append(f'<text class="dim" x="{x + 12}" y="85">터미널 {who} — 에이전트 {who}</text>')
    for r, (idx, cls, ln) in enumerate(panes[who]):
        if not ln:
            continue
        y = TOP + 18 + r * LH
        parts.append(f'<text class="{cls} s{idx}" x="{x + 14}" y="{y}">{escape(ln)}</text>')

cy = H - 46
parts.append(f'<rect class="capbg" x="{PAD}" y="{cy}" width="{W - 2 * PAD}" height="34" rx="8"/>')
for i, step in enumerate(STEPS):
    parts.append(f'<text class="cap c{i}" x="{PAD + 16}" y="{cy + 23}">{escape(step[4])}</text>')
parts.append(f'<text class="cap cstatic" x="{PAD + 16}" y="{cy + 23}">① 선점 → ② 겹치면 시작 전에 거절 → ③ 다른 폴더는 통과 → ④ 반납 → ⑤ 이어받기</text>')
parts.append("</svg>")
dest.write_text("\n".join(parts), encoding="utf-8")
print(dest, W, H, rows)
