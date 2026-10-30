# 모진성 포트폴리오

Java·Spring Boot 백엔드 개발 직무 지원을 위한 포트폴리오입니다.

- [포트폴리오 보기](https://jinsung-mo.github.io/)
- 연락처: [ahwlstjd57@gmail.com](mailto:ahwlstjd57@gmail.com)
- 프로젝트: 삐용, 가볼래, 로보터블 기업연계(요리 영상 구간 분할, 진행 중), 빈자리, 써트맵

이력 다음에 프로젝트를 두고, 프로젝트는 카드로 하나씩 골라 보게 했습니다. 각 프로젝트에서 맡은 일과 검증 결과를 먼저 보여주고, 문제 해결 과정과 추가 시연은 펼쳐 읽을 수 있도록 구성했습니다. 팀 결과물과 프로젝트 종료 후 개인 개선은 구분해 적었습니다.

## 파일 구성

- `index.html`: 소개, 이력, 프로젝트
- `styles.css`: 화면 구성과 모바일 스타일
- `script.js`: 프로젝트 하나씩 전환, 상세 시연으로 직접 이동, 영상 정지, 인쇄 시 상세 설명 표시
- `portfolio-print.html`: 제출용 PDF(A4 가로 8쪽)의 원본 페이지
- `portfolio.pdf`: 위 페이지를 Chrome으로 인쇄한 제출용 PDF
- `assets/`: 프로젝트 화면, 구조도, 시연 영상
- `evidence/`: 성과 수치의 원본 응답과 그림 재현 스크립트

GitHub Pages는 `main` 브랜치의 루트(`/`)를 배포합니다.

## 로컬 확인

별도 설치나 빌드 없이 실행할 수 있습니다.

```sh
python -m http.server 8766 --bind 127.0.0.1
```

브라우저에서 `http://127.0.0.1:8766/`를 엽니다. 첫 화면의 `포트폴리오 PDF`는 `portfolio.pdf`를 엽니다. 브라우저 인쇄를 쓰면 기술 설명을 펼친 상태로 인쇄되고, 추가 영상은 제외됩니다.

## PDF 다시 만들기

로컬 서버를 띄운 상태에서 실행합니다.

```sh
chrome --headless=new --no-pdf-header-footer --print-to-pdf=portfolio.pdf http://127.0.0.1:8766/portfolio-print.html
```

## 성과 수치의 출처

- 가볼래: [PostgreSQL 통합 테스트](https://github.com/jinsung-mo/gabolle-busan-travel/blob/main/backend/src/test/java/com/gabolle/backend/itinerary/ItineraryPersistenceIntegrationTest.java)
- 가볼래 axMap: [npm 통계 원본과 재현 스크립트](evidence/axmap/README.md)(2026-10-26 조회, CI·미러 포함)와 팀 저장소 선점 장부 커밋 수. 판정 코드는 [axMap 공개 저장소](https://github.com/rl2aderjoon/axmap/blob/f4609cb139fe97d06e6c3014cdf3b32ca22b4380/src/protocol.mjs#L10-L165)에 있으며, 토큰 비용 때문에 한 사람의 개인 계정으로만 AI 코드 생성을 진행해 커밋 작성자는 팀원 한 명으로 표시됩니다.
- 로보터블 기업연계: SSAFY GitLab 비공개 저장소(S15P31E109)의 실험 보고서. 영상 조각 판독은 S15P31E109-253, 사람 검수 정답 재확인은 S15P31E109-275, 경계 검출 방법 비교는 S15P31E109-139 실험 폴더의 README와 실행 기록입니다. 모두 팀 결정 전 제안이며, 16편은 개발 중 여러 번 본 자료라는 한계를 본문에 함께 적었습니다.
- 삐용: [프로젝트 종료 후 개인 검증 기록](https://github.com/jinsung-mo/-BBIYONG-autonomous_driving_factory_patrol_robot/blob/main/docs/post-project/README.md). 합성 데이터 쿼리 측정 환경과 개인 저장소에서만 진행한 작업임을 본문에 함께 표시했습니다.
- 빈자리: [모델·실행 기록](https://github.com/jinsung-mo/Smart-Parking-Lot-Monitoring-Service_BINJAIR/blob/main/docs/MODEL.md). 프레임 감소율과 실제 처리 성능, 기록 재생 시연과 운영 중계를 구분했습니다.
