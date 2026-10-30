# axMap 사례 근거 자료

포트폴리오의 [axMap](https://jinsung-mo.github.io/#axmap) 항목에 쓴 수치와 그림의 원본입니다.

## 수치

| 항목 | 값 | 원본 |
| --- | --- | --- |
| npm 누적 다운로드 | 23,794회 (2026-08-28 ~ 10-25) | [`npm/point_2026-08-28_2026-10-25.json`](npm/point_2026-08-28_2026-10-25.json) |
| 같은 기간 일별 다운로드 | 59일, 합계가 위 값과 같음 | [`npm/range_2026-08-28_2026-10-25.json`](npm/range_2026-08-28_2026-10-25.json) |
| 최근 1주 (2026-10-16 ~ 10-22) | 795회 | [`npm/point_last-week.json`](npm/point_last-week.json) |
| 조회 시각 | 2026-10-26T03:35:37Z | [`npm/queried_at_utc.txt`](npm/queried_at_utc.txt) |
| 가볼래 선점 장부 (2026-08-25 ~ 09-30) | 선점 3,629회 · 반납 2,224회 · 연장 68회 | 팀 저장소의 장부 브랜치 커밋 수 (아래 명령) |

- npm 응답은 `https://api.npmjs.org/downloads/point/<기간>/axmap-cli`, `.../range/<기간>/axmap-cli`를 그대로 저장했습니다.
- npm 집계에는 CI 서버, 미러, 봇의 다운로드가 포함됩니다. 이 기간에 21개 버전이 배포돼 미러 다운로드도 함께 늘었습니다. 사용자 수가 아닙니다.
- 장부 수치는 팀 저장소의 장부 브랜치에서 `git log origin/axmap/claims --format=%s | grep -oE '^(claim|release|renew)\(' | sort | uniq -c`로 셌습니다. 거절된 선점은 장부에 남지 않아, 막은 충돌 횟수는 셀 수 없습니다.

## 그림

| 그림 | 만든 방법 |
| --- | --- |
| [`assets/axmap-claim-conflict.svg`](../../assets/axmap-claim-conflict.svg) | [`tools/record_demo.sh`](tools/record_demo.sh)로 시연용 저장소 두 개에서 axmap-cli 1.4.0을 실행하고, 출력([`demo-output/`](demo-output))을 [`tools/gen_terminal_svg.py`](tools/gen_terminal_svg.py)로 변환했습니다. 출력 문장은 그대로이고 단계 번호, 색, 자막만 덧붙였습니다. |
| [`assets/axmap-overlap-rules.svg`](../../assets/axmap-overlap-rules.svg) | axMap 코드(`src/protocol.mjs`, `bin/axmap.mjs`의 `cmdClaim`)를 읽고 직접 그렸습니다. 그림 속 판정 예시는 [`tools/check_overlap_examples.mjs`](tools/check_overlap_examples.mjs)로 실제 판정 함수에 넣어 확인했습니다. |

## 다시 확인하기

```sh
# 판정 예시 확인 (axmap-cli 설치 폴더의 protocol.mjs)
node tools/check_overlap_examples.mjs ~/.axmap/app/src/protocol.mjs

# 시연 출력과 SVG 다시 만들기
bash tools/record_demo.sh /tmp/axmap-demo "node ~/.axmap/app/bin/axmap.mjs"
python -I tools/gen_terminal_svg.py /tmp/axmap-demo/out axmap-claim-conflict.svg
```

## 기여 범위

axMap의 아이디어와 처리 흐름은 가볼래 팀 회의에서 함께 정했습니다. 저는 그중 선점이 서로 겹치는지 판단하는 규칙을 설계하고, 만들어진 코드가 규칙대로 동작하는지 검증했습니다. 토큰 비용 때문에 팀 회의에서 한 사람의 개인 계정으로만 코드를 생성하기로 정해, [공개 저장소](https://github.com/rl2aderjoon/axmap)에는 작성자가 팀원 한 명으로 표시됩니다.
