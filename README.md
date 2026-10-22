# 모진성 포트폴리오

Java·Spring Boot 백엔드 개발 직무 지원을 위한 포트폴리오입니다.

- [포트폴리오 보기](https://jinsung-mo.github.io/)
- 연락처: [ahwlstjd57@gmail.com](mailto:ahwlstjd57@gmail.com)
- 프로젝트: 가볼래, 삐용, 빈자리

각 프로젝트에서 맡은 일과 검증 결과를 먼저 보여주고, 문제 해결 과정과 추가 시연은 펼쳐 읽을 수 있도록 구성했습니다. 팀 결과물과 프로젝트 종료 후 개인 개선은 구분해 적었습니다. 협업 섹션에는 메시지 규격 유지, Jira 작업 연결, 로봇 연동 경험과 다음 협업에서 보완할 점을 담았습니다.

## 파일 구성

- `index.html`: 소개, 프로젝트, 협업 경험과 이력
- `styles.css`: 화면 구성과 모바일 스타일
- `script.js`: 상세 시연으로 직접 이동, 영상 정지, 인쇄 시 상세 설명 표시
- `assets/`: 프로젝트 화면, 구조도, 시연 영상

GitHub Pages는 `main` 브랜치의 루트(`/`)를 배포합니다.

## 로컬 확인

별도 설치나 빌드 없이 실행할 수 있습니다.

```sh
python -m http.server 8766 --bind 127.0.0.1
```

브라우저에서 `http://127.0.0.1:8766/`를 엽니다. `인쇄·PDF 저장`을 누르면 기술 설명을 펼친 인쇄 화면을 열고, 종료하면 원래 펼침 상태로 돌아갑니다. 추가 영상은 인쇄에서 제외합니다.

## 성과 수치의 출처

- 가볼래: [PostgreSQL 통합 테스트](https://github.com/jinsung-mo/gabolle-busan-travel/blob/main/backend/src/test/java/com/gabolle/backend/itinerary/ItineraryPersistenceIntegrationTest.java)
- 삐용: [프로젝트 종료 후 개인 검증 기록](https://github.com/jinsung-mo/-BBIYONG-autonomous_driving_factory_patrol_robot/blob/main/docs/post-project/README.md). 합성 데이터 쿼리 측정 환경과 개인 저장소에서만 진행한 작업임을 본문에 함께 표시했습니다.
- 빈자리: [모델·실행 기록](https://github.com/jinsung-mo/Smart-Parking-Lot-Monitoring-Service_BINJAIR/blob/main/docs/MODEL.md). 프레임 감소율과 실제 처리 성능, 기록 재생 시연과 운영 중계를 구분했습니다.
