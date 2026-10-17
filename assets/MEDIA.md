# 포트폴리오 시각 자료

## 가볼래

- 홈, 여행 조건 입력, 경로 사진: 팀 저장소의 `docs/demo/home.jpg`, `plan-basic.jpg`, `route-map.jpg`.
- `gabolle-highlight.mp4`: 사용자가 제공한 `가볼래_시연.mp4` (7분 46.5초)에서 00:00–00:06, 01:58–02:08, 02:56–03:04, 05:11–05:23 구간을 연결한 36초 영상.
- 배속 없음. 무음, H.264, 540×1140, 24 FPS, faststart. 원본 파일은 수정하지 않았습니다.

## 삐용

- `bbiyong-mapping.mp4`와 `bbiyong-alert.mp4`: 발표 20·28번 슬라이드의 `image9.gif`(9.83초)와 `image20.gif`(8.9초)를 H.264, 20 FPS로 변환. 원래 속도, 무음. JPG는 원본 중간 프레임.

- `bbiyong-console.png`: 팀 저장소 `docs/assets/readme/patrol-console.png` 전체 화면. 자르지 않고 표시.
- `bbiyong-driving.mp4`: 같은 저장소의 `autonomous-driving.mp4`. 실제 로봇 촬영 원본의 01:00–01:20 발췌본을 그대로 사용.

## 빈자리

- `binjari-inference.mp4`: `parking_best.mp4`의 110–140초 구간을 실제 `best_seo.pt` 모델과 `parking_lot_A`의 20개 주차면 판정 코드로 다시 추론한 30초 영상. 모델이나 주차 상태를 모의로 구성하지 않았습니다. B5 전환 시각은 원본 128.5195초입니다.
- `binjari-detail-transition.mp4`: 기존 Flutter 웹 빌드의 실제 상세정보 화면 녹화(430×850, 5 FPS, 30초). 같은 추론 JSON을 로컬 API로 순서대로 재생했습니다. 상세 화면의 10초 자동 조회 주기를 유지했습니다. 실제 UI에서 B5의 색상과 빈자리 수·점유율이 바뀝니다. 운영 CCTV 중계는 아닙니다.

- `binjari-map-status.png`: 팀 앱의 지도·주차장 선택 화면.
- `binjari-space-status.png`: 프로젝트 `docs/images/app-space-status.png`의 주차면별 상세 상태 화면.
- 앱 캡처와 추론 영상은 각각의 시연 자료이며 서로 같은 시각에 기록한 화면은 아닙니다.
