# 포트폴리오 추가 검증 자료

2026-10-27에 실제 실행한 테스트를 확인하고 재현하기 위한 자료입니다. 2026-10-28 사용자 승인에 따라 포트폴리오 저장소의 별도 `codex/portfolio-verification` 브랜치에 공개합니다. 원격 main·기존 사이트·각 서비스의 운영 배포는 변경하지 않습니다. PDF의 검증 링크는 이 README의 HTTPS 주소로 연결합니다. `index.html`은 내려받아 볼 수 있는 보조 자료입니다.

[PostgreSQL](#gabolle) · [가볼래 재현](#gabolle-reproduce) · [AI 도우미](#assistant) · [세션 개선](#bbiyong) · [삐용 재현](#bbiyong-reproduce) · [주차면 수](#parking) · [실행 항목별 결과](#execution-details)

## 실행 결과

| 묶음 | 실행 수 | 실패 | 오류 | 스킵 |
| --- | ---: | ---: | ---: | ---: |
| 추가 PostgreSQL 동시성·롤백 | 11 | 0 | 0 | 0 |
| 기존 PostgreSQL 저장소 | 13 | 0 | 0 | 0 |
| 기존 AI 도우미 | 42 | 0 | 0 | 0 |
| 삐용 세션·관련 단위 테스트 | 44 | 0 | 0 | 0 |

실행 수에는 반복 실행이 포함됩니다. 삐용 44회는 새 레지스트리 테스트 35회와 기존 단위 테스트 9회입니다. 모든 테스트를 이번에 새로 작성했다는 뜻이 아닙니다.

## Gabolle

### 가볼래: 입력 조건과 판정

- 동일 사용자·요청 키·본문 A로 8개 서비스 호출을 동시에 시작: 생성 1건, 기존 결과 반환 7건, 모두 같은 여행 ID·스냅샷 ID, DB 여행 1행.
- 동일 사용자·요청 키로 본문 A 4건과 본문 B 4건을 동시에 시작: A/B는 예산만 10만 원·20만 원으로 다릅니다. 먼저 키를 확보한 본문의 4건 중 생성 1건·기존 결과 반환 3건, 다른 본문 4건은 충돌합니다. A와 B 중 어느 쪽이 먼저 성공하는지는 고정하지 않았습니다. **8개의 본문이 전부 다른 테스트가 아닙니다.**
- 같은 일정의 baseVersion=1로 8개 편집을 동시에 시작: 성공 1건·충돌 7건, 최종 latest_version=2, 고아 판·복사항목 없음.
- 위 세 경합을 각각 3회 실행했습니다. 별도로 포인터 조건 불일치 시 판·복사항목 롤백, 여행 생성 실패 시 여행·요청 키 롤백을 확인했습니다.

새 테스트는 [PortfolioPostgresConcurrencyTest.java](gabolle/src/com/gabolle/verification/PortfolioPostgresConcurrencyTest.java)에 있습니다. 실행 결과는 [JUnit XML 발췌](results/postgres-concurrency/TEST-com.gabolle.verification.PortfolioPostgresConcurrencyTest.xml)와 [실행 항목별 결과](#execution-details)에서 확인할 수 있습니다.

기준 앱은 `yeaseunglee96/gabolle`의 `36bad5d7a945f054a40c4007fabfa3664f361b4d`입니다. 앱 소스를 바꾸지 않고 실제 Spring 트랜잭션 서비스와 Jpa 저장소를 호출했습니다. PostgreSQL 16.15, READ COMMITTED, Flyway 150개, 연결 풀 상한 12, Java 17, Gradle 9.7.1, macOS arm64에서 실행했습니다.

HTTP 동시 요청·인증 필터·모바일 네트워크·장시간 성능 테스트가 아닙니다. 409는 원본 예외 핸들러의 상태 매핑으로 별도 확인했습니다. AI 도우미 42건은 실제 Gemini 호출이 없는 기존 모의 테스트입니다.

## Gabolle-reproduce

### 가볼래 환경과 재현

필수: Git, JDK 17, Docker, 외부 Gradle 의존성을 받을 네트워크. 이 저장소의 `codex/portfolio-verification` 브랜치를 내려받고, 아래 명령의 `BUNDLE`을 그 안의 **verification 폴더의 절대 경로**로 바꿉니다. 셸에서 JDK 17을 선택해 둡니다. 다음은 POSIX 셸 예시입니다.

```sh
BUNDLE="/absolute/path/to/verification"
TASK_RUNROOT="$(mktemp -d)"
git clone --filter=blob:none --sparse --no-checkout https://github.com/yeaseunglee96/gabolle.git "$TASK_RUNROOT/gabolle"
git -C "$TASK_RUNROOT/gabolle" sparse-checkout set backend
git -C "$TASK_RUNROOT/gabolle" checkout 36bad5d7a945f054a40c4007fabfa3664f361b4d

# 검증 전용 새 DB. 운영·개발 DB 주소를 사용하지 마십시오.
TASK_PG_ID="$(docker run --detach --rm -e POSTGRES_DB=portfolio_gabolle_test -e POSTGRES_USER=portfolio_test -e POSTGRES_PASSWORD=portfolio_test_only -p 127.0.0.1::5432 postgres:16.15-alpine)"
until docker exec "$TASK_PG_ID" pg_isready -U portfolio_test -d portfolio_gabolle_test >/dev/null; do sleep 1; done
TASK_PG_PORT="$(docker port "$TASK_PG_ID" 5432/tcp | sed 's/.*://')"
export GABOLLE_TEST_DB_URL="jdbc:postgresql://127.0.0.1:$TASK_PG_PORT/portfolio_gabolle_test"
export GABOLLE_TEST_DB_USERNAME=portfolio_test
export GABOLLE_TEST_DB_PASSWORD=portfolio_test_only
export PORTFOLIO_VERIFY_SRC="$BUNDLE/gabolle/src"
cd "$TASK_RUNROOT/gabolle/backend"

bash gradlew test --init-script "$BUNDLE/gabolle/verification.init.gradle" --tests 'com.gabolle.verification.PortfolioPostgresConcurrencyTest' --no-daemon --rerun-tasks
# 위 실행의 test-results/test와 reports/tests/test를 보관한 뒤 다음 실행을 진행합니다.
bash gradlew test --tests 'com.gabolle.backend.trip.TripPersistenceIntegrationTest' --tests 'com.gabolle.backend.itinerary.ItineraryPersistenceIntegrationTest' --no-daemon --rerun-tasks
# 다시 보고서를 보관합니다. Gradle은 다음 실행에서 같은 보고서 폴더를 사용합니다.
bash gradlew test --tests 'com.gabolle.backend.assistant.*' --no-daemon --rerun-tasks

# 이 명령에서 새로 만든 DB만 종료합니다. 작업 폴더는 결과 확인을 위해 남깁니다.
docker stop "$TASK_PG_ID"
```

원본 테스트 도우미는 테스트 DB 표를 정리할 수 있습니다. 이름에 `test`가 있다는 검사만으로 운영 DB를 안전하게 판별하는 것은 아닙니다. 위처럼 새 컨테이너로 만든 DB에만 연결하십시오. 재현 명령은 기존 실행을 이식 가능한 형태로 정리한 안내이며, 이 안내 전체를 새 PC에서 다시 실행한 결과를 주장하지 않습니다.

## Assistant

### AI 도우미 기존 테스트 42건

팀 저장소의 기존 테스트를 재실행했습니다. 변환·서비스·컨트롤러의 모의 테스트이며, 실제 Gemini 호출·모델 정확도·환각률·응답 지연 측정이 아닙니다. [원본 테스트](https://github.com/yeaseunglee96/gabolle/tree/36bad5d7a945f054a40c4007fabfa3664f361b4d/backend/src/test/java/com/gabolle/backend/assistant), [XML 발췌](results/assistant/), [실행 항목별 결과](#execution-details)를 확인할 수 있습니다. 실행 명령은 [가볼래 재현](#gabolle-reproduce)에 있습니다.

## BBIYONG

### 삐용: 수정 전후와 테스트

기준 앱은 `jinsung-mo/-BBIYONG-autonomous_driving_factory_patrol_robot`의 `a6ae2a44a934ce70be4ebe6934d44c2ac2b94395`입니다.

- 이전: 독립적인 두 ConcurrentHashMap을 갱신하고, 종료 시 robotId만으로 현재 세션을 삭제했습니다.
- 이후: 공통 락으로 양방향 맵의 소유권을 함께 갱신하고, 현재 세션 ID가 같으며 조건부 제거가 성공했을 때만 robotId를 반환합니다. 닫기 I/O는 락 밖에서 실행합니다.
- 새 테스트: 늦은·중복·동기 콜백, 이미 시작한 종료와 재등록, 느린 닫기, 소유권, 16개 동시 재접속 25회, 새 세션 명령 전달, 핸들러의 오래된 종료 콜백을 검증합니다.
- mock WebSocketSession과 실제 스레드를 사용한 단위 테스트입니다. 실제 네트워크를 검증하지 않았습니다. 현재 세션 제거 직후 새 연결이 등록되고 이전 OFFLINE 방송만 늦게 도착하는 순서 경합은 별도 과제입니다.

파일: [수정 전](bbiyong/before/RobotWebSocketSessionManager.java), [수정 후](bbiyong/after/RobotWebSocketSessionManager.java), [실제 diff](bbiyong/session-manager.patch), [추가 테스트](bbiyong/RobotWebSocketSessionManagerTests.java).

## BBIYONG-reproduce

### 삐용 환경과 재현

별도의 새 checkout에 검증한 파일과 테스트를 복사합니다. 기존 개발 작업을 덮어쓰지 않도록 아래의 새 임시 폴더를 사용합니다.

```sh
BUNDLE="/absolute/path/to/verification"
TASK_BB_RUNROOT="$(mktemp -d)"
git clone --filter=blob:none --sparse --no-checkout https://github.com/jinsung-mo/-BBIYONG-autonomous_driving_factory_patrol_robot.git "$TASK_BB_RUNROOT/bbiyong"
git -C "$TASK_BB_RUNROOT/bbiyong" sparse-checkout set BE_system
git -C "$TASK_BB_RUNROOT/bbiyong" checkout a6ae2a44a934ce70be4ebe6934d44c2ac2b94395
cp "$BUNDLE/bbiyong/after/RobotWebSocketSessionManager.java" "$TASK_BB_RUNROOT/bbiyong/BE_system/src/main/java/com/bbiyong/server/wss/RobotWebSocketSessionManager.java"
cp "$BUNDLE/bbiyong/RobotWebSocketSessionManagerTests.java" "$TASK_BB_RUNROOT/bbiyong/BE_system/src/test/java/com/bbiyong/server/wss/RobotWebSocketSessionManagerTests.java"
cd "$TASK_BB_RUNROOT/bbiyong/BE_system"
bash gradlew test --tests 'com.bbiyong.server.wss.RobotWebSocketSessionManagerTests' --tests 'com.bbiyong.server.wss.RobotWebSocketBinaryTests' --tests 'com.bbiyong.server.wss.RobotHandshakeAuthInterceptorTests' --tests 'com.bbiyong.server.wss.dto.H264BinaryFrameTests' --no-daemon --rerun-tasks
```

Java 17을 사용합니다. 최초 의존성이 없는 환경을 위해 재현 명령에는 `--offline`을 넣지 않았습니다. 이전 최종 실행은 캐시를 준비한 뒤 `--offline`으로 44회 모두 통과했습니다. 전체 컨텍스트·외부 MySQL을 사용하는 테스트는 포함하지 않았습니다.

## Parking

### 56면과 57면

확인된 것은 공개 기본 좌표 설정의 55호관 20면·도서관 36면, 합계 56면입니다. 앱은 저장된 좌표로 기본값을 덮어쓸 수 있습니다. 57면은 과거 이력서의 표기이며, 당시 57면을 실제 운영했다는 설정 이력은 아직 없습니다. 따라서 두 숫자가 서로 다른 운영 범위를 뜻한다고 단정하지 않습니다. 현재 문서는 **공개 기본 설정 56면**으로 한정하며 과거 원본 PDF는 보존했습니다.

[확인한 공개 기본 설정](https://github.com/jinsung-mo/Smart-Parking-Lot-Monitoring-Service_BINJAIR/blob/31e8275bf75434131cb200ff5defe1611e154480/app_v1.py)의 `PARKING_SPACES` 할당값을 Python AST로 읽어 주차장별 항목을 셌습니다. 해당 파일 blob은 `0b697271e4ff748438eca53891c4002024ade804`입니다. 개인정보가 포함될 수 있는 과거 이력서 원본과 파일명은 공개 자료에서 제외했습니다.

## 증빙의 범위와 출처

- XML은 원본 JUnit 결과에서 호스트 이름·로컬 경로·시스템 로그·properties를 제거한 **발췌**입니다. 테스트 이름·실행 수·실패·오류·스킵·시간은 유지했습니다. 원본 전체는 공개하지 않았습니다.
- `provenance.json`은 원본 XML의 SHA-256과 발췌 파일 대응을 기록합니다. `SHA256SUMS`는 별첨 파일 간 변경을 확인하기 위한 해시이며, 독립 기관의 인증·서명이 아닙니다.
- 새 실행 결과를 만든 작업이 아닙니다. 이전에 실행한 2026-10-27 결과를 원본 XML에서 읽어 묶었습니다. 최초 캐시 권한·의존성 부족 실패 후 재실행한 성공 결과와 범위를 구분합니다.
- 가볼래 원본은 MIT License이며 [라이선스](gabolle/LICENSE)를 보존했습니다. 팀 전체 코드·전체 테스트를 개인 작성물로 표시하지 않습니다. 삐용 코드는 사용자 소유 저장소에서 제공한 검증 사본이며 기존 코드와 추가 수정·테스트를 구분했습니다. 이 문서가 팀 프로젝트 전체에 새로운 재사용 라이선스를 부여하는 것은 아닙니다.
- 공개 대상은 이 폴더의 검증 자료뿐입니다. 이력서·원본 시스템 로그·환경 파일·개인 경로·서비스 토큰은 포함하지 않습니다. 재현 명령의 `portfolio_test_only`는 새 로컬 테스트 컨테이너만을 위한 예시 비밀번호이며 운영 자격 증명이 아닙니다.


## Execution-details

실행 항목별 원본 결과 발췌입니다. 반복 실행도 별도 행으로 표시합니다.

### 추가 PostgreSQL 동시성·롤백

| 실행 항목 | 초 | 결과 | 근거 |
| --- | ---: | --- | --- |
| same-base itinerary edit [1/3] | 0.394 | 통과 | [XML 발췌](results/postgres-concurrency/TEST-com.gabolle.verification.PortfolioPostgresConcurrencyTest.xml) |
| same-base itinerary edit [2/3] | 0.039 | 통과 | [XML 발췌](results/postgres-concurrency/TEST-com.gabolle.verification.PortfolioPostgresConcurrencyTest.xml) |
| same-base itinerary edit [3/3] | 0.028 | 통과 | [XML 발췌](results/postgres-concurrency/TEST-com.gabolle.verification.PortfolioPostgresConcurrencyTest.xml) |
| mixed-body same-key create [1/3] | 0.021 | 통과 | [XML 발췌](results/postgres-concurrency/TEST-com.gabolle.verification.PortfolioPostgresConcurrencyTest.xml) |
| mixed-body same-key create [2/3] | 0.035 | 통과 | [XML 발췌](results/postgres-concurrency/TEST-com.gabolle.verification.PortfolioPostgresConcurrencyTest.xml) |
| mixed-body same-key create [3/3] | 0.019 | 통과 | [XML 발췌](results/postgres-concurrency/TEST-com.gabolle.verification.PortfolioPostgresConcurrencyTest.xml) |
| serviceCreationParticipatesInTransactionAndLeavesNoKeyOrTripAfterRollback() | 0.015 | 통과 | [XML 발췌](results/postgres-concurrency/TEST-com.gabolle.verification.PortfolioPostgresConcurrencyTest.xml) |
| failedPointerCompareAndSwapRollsBackCandidateVersionAndCopiedItems() | 0.028 | 통과 | [XML 발췌](results/postgres-concurrency/TEST-com.gabolle.verification.PortfolioPostgresConcurrencyTest.xml) |
| identical same-key create [1/3] | 0.029 | 통과 | [XML 발췌](results/postgres-concurrency/TEST-com.gabolle.verification.PortfolioPostgresConcurrencyTest.xml) |
| identical same-key create [2/3] | 0.022 | 통과 | [XML 발췌](results/postgres-concurrency/TEST-com.gabolle.verification.PortfolioPostgresConcurrencyTest.xml) |
| identical same-key create [3/3] | 0.02 | 통과 | [XML 발췌](results/postgres-concurrency/TEST-com.gabolle.verification.PortfolioPostgresConcurrencyTest.xml) |

### 기존 PostgreSQL 저장소

| 실행 항목 | 초 | 결과 | 근거 |
| --- | ---: | --- | --- |
| duplicateVersionIsRejectedAsConflict() | 0.304 | 통과 | [XML 발췌](results/existing-postgres/TEST-com.gabolle.backend.itinerary.ItineraryPersistenceIntegrationTest.xml) |
| pointerMoveIsVisibleInTheSamePersistenceContext() | 0.01 | 통과 | [XML 발췌](results/existing-postgres/TEST-com.gabolle.backend.itinerary.ItineraryPersistenceIntegrationTest.xml) |
| pointerMovedElsewhereIsRejectedAndRollsBack() | 0.011 | 통과 | [XML 발췌](results/existing-postgres/TEST-com.gabolle.backend.itinerary.ItineraryPersistenceIntegrationTest.xml) |
| appendMovesLatestVersionPointer() | 0.054 | 통과 | [XML 발췌](results/existing-postgres/TEST-com.gabolle.backend.itinerary.ItineraryPersistenceIntegrationTest.xml) |
| 🔴 다시 고르면 고른 시각이 옮겨진다 — C 를 골랐다가 A 로 되돌아오면 A 가 확정이 되는 근거 | 0.008 | 통과 | [XML 발췌](results/existing-postgres/TEST-com.gabolle.backend.itinerary.ItineraryPersistenceIntegrationTest.xml) |
| 일정이 생기면 고른 시각이 채워진다 — 일정을 만드는 길 어디서도 따로 적지 않아도 된다 | 0.006 | 통과 | [XML 발췌](results/existing-postgres/TEST-com.gabolle.backend.itinerary.ItineraryPersistenceIntegrationTest.xml) |
| sameKeyDifferentFingerprintIsRejected() | 0.035 | 통과 | [XML 발췌](results/existing-postgres/TEST-com.gabolle.backend.trip.TripPersistenceIntegrationTest.xml) |
| tripRoundTripsThroughPostgres() | 0.012 | 통과 | [XML 발췌](results/existing-postgres/TEST-com.gabolle.backend.trip.TripPersistenceIntegrationTest.xml) |
| ownerIsPersistedAsMember() | 0.012 | 통과 | [XML 발췌](results/existing-postgres/TEST-com.gabolle.backend.trip.TripPersistenceIntegrationTest.xml) |
| unknownTripIdIsEmpty() | 0.004 | 통과 | [XML 발췌](results/existing-postgres/TEST-com.gabolle.backend.trip.TripPersistenceIntegrationTest.xml) |
| preferenceAnswerAndConstraintRoundTrip() | 0.026 | 통과 | [XML 발췌](results/existing-postgres/TEST-com.gabolle.backend.trip.TripPersistenceIntegrationTest.xml) |
| codedAllergyConstraintRoundTrips() | 0.012 | 통과 | [XML 발췌](results/existing-postgres/TEST-com.gabolle.backend.trip.TripPersistenceIntegrationTest.xml) |
| sameIdempotencyKeyReturnsSameTrip() | 0.013 | 통과 | [XML 발췌](results/existing-postgres/TEST-com.gabolle.backend.trip.TripPersistenceIntegrationTest.xml) |

### 기존 AI 도우미

| 실행 항목 | 초 | 결과 | 근거 |
| --- | ---: | --- | --- |
| 🔴 시간 제한을 밀리초로 건다 — 앱이 끊는 12초 안이어야 한다 | 0.023 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| 목록 밖 지역·취향 코드와 모양이 틀린 날짜는 뺀다 | 0.003 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| /plan 이고 days·people 이 있으면 쿼리 파라미터로 실어 보낸다 | 0.001 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| 🔴 주소가 비면 안 건다 — 그때는 예전처럼 구글을 직접 부른다 | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| 🔴 모델이 label 을 비우면 '/field/transit' 도 기본 문구로 채운다 | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| navigate + '/field/exchange-rate' 는 허용된 href 로 통과한다 | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| navigate + 허용된 href 는 그대로 통과한다 | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| navigate + '/field/transit' 는 허용된 href 로 통과한다 | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| 🔴 재시도를 끈다 — 한 번만 부른다 (S15P21E201-1749) | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| 🔴 navigate 인데 href 가 허용 목록 밖이면 HELP 로 낮춘다 | 0.001 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| days·people 이 없으면 물음표 없이 href 그대로다 | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| 주소를 정하면 그 주소로 건다 | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| phrase 는 korean·pronunciation 만 채워진다 | 0.001 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| 🔴 기본 설정은 중계 주소와 그 중계에 열려 있는 모델을 같이 쓴다 | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| /trips 에는 지역을 싣지 않는다 | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| 🔴 모델이 모르는 kind 를 지어내면 HELP 로 낮춘다 | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| 🔴 모델이 label 을 비우면 '/field/exchange-rate' 도 기본 문구로 채운다 | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| 🔴 범위 밖 숫자를 지어내면 그 파라미터만 조용히 뺀다 | 0.001 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| 🔴 /plan 이면 지역·취향·출발일도 싣는다 — 광안리 맛집 2명 (S15P21E201-1825) | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| 🔴 모델이 label 을 비우면 href 별 기본 문구로 채운다 | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| /trips·/field/translate 는 days·people 이 있어도 무시한다 | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiAssistantAdapterTest.xml) |
| 🔴 vi 요청에는 베트남어로 쓰라는 지시가 붙는다 — 빈 지시면 모델이 한국어로 답한다 | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.adapter.GeminiVietnameseDirectiveTest.xml) |
| itineraryId 가 없으면 동의를 확인하지도, 일정을 조회하지도 않는다 | 0.381 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.application.AssistantChatServiceTest.xml) |
| 🔴 1분 한도를 넘기면 벤더를 부르지 않고 거부한다 | 0.005 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.application.AssistantChatServiceTest.xml) |
| 정상 메시지는 벤더를 한 번 불러 답을 그대로 돌려준다 | 0.001 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.application.AssistantChatServiceTest.xml) |
| 🔴 동의가 없으면 벤더를 부르지 않고 그대로 막는다 | 0.015 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.application.AssistantChatServiceTest.xml) |
| 🔴 q값이 섞인 헤더는 첫 태그만 본다 — MR !1066 AI 리뷰로 발견 | 0.001 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.application.AssistantChatServiceTest.xml) |
| 모르는 언어 값은 한국어로 떨어진다 | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.application.AssistantChatServiceTest.xml) |
| 다른 사용자는 서로의 한도에 영향을 주지 않는다 | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.application.AssistantChatServiceTest.xml) |
| itineraryId 가 있으면 동의부터 확인하고, 통과하면 일정을 조회해 벤더에 얹는다 | 0.007 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.application.AssistantChatServiceTest.xml) |
| 히스토리는 설정된 개수만큼만 벤더에 전달된다 | 0.005 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.application.AssistantChatServiceTest.xml) |
| 빈 메시지는 벤더를 부르지 않고 바로 거부한다 | 0.001 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.application.AssistantChatServiceTest.xml) |
| 너무 긴 메시지는 벤더를 부르지 않고 바로 거부한다 | 0.001 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.application.AssistantChatServiceTest.xml) |
| 🔴 업체 호출이 실패하면 그대로 위로 올라간다 — 미리 정해 둔 답으로 숨기지 않는다 | 0.001 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.application.AssistantChatServiceTest.xml) |
| 🔴 프론트가 보내는 5개 언어(ko/en/ja/zh-Hans/zh-Hant)가 각각 그대로 벤더에 전달된다 — S15P21E201-1109 | 0.001 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.application.AssistantChatServiceTest.xml) |
| 🔴 Accept-Language 가 vi 면 답변 언어는 vi 다 — 전에는 ko 로 떨어져 한국어로 답했다 | 0.0 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.application.AssistantLanguageVietnameseTest.xml) |
| 여행 만들기 요청은 200 과 kind=navigate, href=/plan 을 담아 온다 | 0.477 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.presentation.AssistantControllerTest.xml) |
| 빈 메시지는 400 이다 | 0.014 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.presentation.AssistantControllerTest.xml) |
| itineraryId·dayIndex 를 보내면 동의 확인 후 일정 요약을 벤더에 실어 보낸다 | 0.01 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.presentation.AssistantControllerTest.xml) |
| history 를 함께 보내도 그대로 받아 벤더에 전달한다 | 0.009 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.presentation.AssistantControllerTest.xml) |
| 🔴 업체 호출이 실패하면 502 이고 응답에 실패가 분명히 담긴다 — 200 으로 숨기지 않는다 | 0.011 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.presentation.AssistantControllerTest.xml) |
| 🔴 1분 한도를 넘기면 429 다 | 0.009 | 통과 | [XML 발췌](results/assistant/TEST-com.gabolle.backend.assistant.presentation.AssistantControllerTest.xml) |

### 삐용 세션·관련 단위 테스트

| 실행 항목 | 초 | 결과 | 근거 |
| --- | ---: | --- | --- |
| validQueryParamTokenAccepted() | 0.059 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotHandshakeAuthInterceptorTests.xml) |
| wrongTokenRejectedWith401() | 0.004 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotHandshakeAuthInterceptorTests.xml) |
| missingTokenRejectedWith401() | 0.0 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotHandshakeAuthInterceptorTests.xml) |
| blankConfiguredTokenRejectsHandshake() | 0.0 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotHandshakeAuthInterceptorTests.xml) |
| validHeaderTokenAccepted() | 0.0 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotHandshakeAuthInterceptorTests.xml) |
| mismatchedRobotPacketIsDropped() | 0.013 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketBinaryTests.xml) |
| registeredRobotBinaryPacketIsPublishedUnchanged() | 0.001 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketBinaryTests.xml) |
| closeAllClearsBothMapsBeforeExternalCloseCallback() | 0.006 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| currentSessionRemovalReturnsRobotExactlyOnce() | 0.0 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| alreadyEnteredCloseAndReconnectCannotSplitTheTwoMaps() | 0.001 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| synchronousCloseCallbackSeesReplacementAndReturnsNoOfflineRobot() | 0.001 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| staleAndDuplicateCloseCallbacksCannotRemoveReplacement() | 0.016 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| handlerDoesNotPublishOfflineForStaleCallbackAndPublishesCurrentOnlyOnce() | 0.004 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| sameSessionCannotBeReboundToAnotherRobot() | 0.001 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| registeringSameSessionDoesNotPublishAnotherOnlineOrCloseIt() | 0.0 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| failedOldSessionCloseDoesNotRollbackReplacement() | 0.001 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 1 of 25 | 0.008 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 2 of 25 | 0.007 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 3 of 25 | 0.006 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 4 of 25 | 0.005 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 5 of 25 | 0.005 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 6 of 25 | 0.006 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 7 of 25 | 0.008 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 8 of 25 | 0.005 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 9 of 25 | 0.005 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 10 of 25 | 0.004 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 11 of 25 | 0.004 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 12 of 25 | 0.004 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 13 of 25 | 0.003 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 14 of 25 | 0.004 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 15 of 25 | 0.005 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 16 of 25 | 0.003 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 17 of 25 | 0.003 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 18 of 25 | 0.003 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 19 of 25 | 0.004 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 20 of 25 | 0.004 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 21 of 25 | 0.003 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 22 of 25 | 0.005 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 23 of 25 | 0.004 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 24 of 25 | 0.003 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| repetition 25 of 25 | 0.003 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| blockingCloseIoDoesNotHoldRegistryLock() | 0.002 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.RobotWebSocketSessionManagerTests.xml) |
| rejectsLengthMismatchUnknownFlagsAndInvalidUtf8() | 0.001 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.dto.H264BinaryFrameTests.xml) |
| parsesVersionOneEnvelope() | 0.002 | 통과 | [XML 발췌](results/bbiyong/TEST-com.bbiyong.server.wss.dto.H264BinaryFrameTests.xml) |
