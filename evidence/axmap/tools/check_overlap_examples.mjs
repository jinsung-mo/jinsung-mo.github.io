// 판정 도식(assets/axmap-overlap-rules.svg)의 예시를 실제 axMap 판정 함수로 다시 확인한다.
// 사용법: node check_overlap_examples.mjs <axmap 설치 폴더>/src/protocol.mjs
import { pathToFileURL } from 'node:url'

const target = process.argv[2]
if (!target) {
  console.error('사용법: node check_overlap_examples.mjs <axmap 설치 폴더>/src/protocol.mjs')
  process.exit(1)
}
const { checkOverlap, claimPathError } = await import(pathToFileURL(target).href)

const now = Date.now()
const held = [{ agent: 'A', session: 'a', since: new Date(now).toISOString(), ttlMs: 30 * 60_000, paths: ['src/auth'] }]
const BS = '\\'

const judge = (path, claims = held) => {
  if (claimPathError(path)) return '입력 거부'
  return checkOverlap({ requested: [path], claims, me: 'B', now, session: 'b' }).ok ? '통과' : '거절'
}

for (const path of ['src/auth/login.ts', 'src', `.${BS}src${BS}auth${BS}`, './src/auth/', 'src/authz', '../x', '/abs']) {
  console.log(`${JSON.stringify(path).padEnd(22)} ${judge(path)}`)
}
const expired = [{ ...held[0], since: new Date(now - 60 * 60_000).toISOString() }]
console.log(`${'만료된 선점 + login.ts'.padEnd(18)} ${judge('src/auth/login.ts', expired)}`)
