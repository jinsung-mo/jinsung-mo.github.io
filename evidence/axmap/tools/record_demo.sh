#!/usr/bin/env bash
# 터미널 시연(assets/axmap-claim-conflict.svg)에 쓴 출력을 다시 만든다.
# 사용법: bash record_demo.sh <작업 폴더> [axmap 실행 명령]
# 예:     bash record_demo.sh /tmp/axmap-demo "node ~/.axmap/app/bin/axmap.mjs"
set -u
DIR=${1:?작업 폴더를 지정하세요}
AX=${2:-axmap}
mkdir -p "$DIR" && cd "$DIR" || exit 1

git init -q --bare -b main remote.git
git clone -q remote.git a 2>/dev/null
(cd a && git config user.name A && git config user.email a@demo && git config core.autocrlf false &&
  mkdir -p src/auth src/authz && echo x > src/auth/login.ts && echo x > src/authz/policy.ts &&
  git add . && git commit -qm init && git branch -M main && git push -q origin main)
git clone -q remote.git b
(cd b && git config user.name B && git config user.email b@demo)
(cd a && AXMAP_SESSION=demoA $AX init > /dev/null 2>&1)
(cd b && AXMAP_SESSION=demoB $AX init > /dev/null 2>&1)

mkdir -p out
run() { # run <번호> <클론> <세션> <명령...>
  local n=$1 dir=$2 ses=$3; shift 3
  (cd "$dir" && AXMAP_SESSION=$ses $AX "$@" > "../out/$n.txt" 2>&1; echo "exit=$?" >> "../out/$n.txt")
}
run 1 a demoA claim src/auth --task 로그인 --intent "토큰 갱신 수정"
run 2 b demoB claim src/auth/login.ts --task 소셜로그인
run 3 b demoB claim src/authz --task 권한정책
run 4 a demoA release
run 5 b demoB claim src/auth/login.ts --task 소셜로그인
echo "출력: $DIR/out/1.txt ~ 5.txt"
echo "SVG:  python -I gen_terminal_svg.py $DIR/out <저장할 경로>/axmap-claim-conflict.svg"
