# 포트폴리오 시각 자료

## 가볼래

- 홈, 여행 조건 입력, 경로 사진: 팀 저장소의 `docs/demo/home.jpg`, `plan-basic.jpg`, `route-map.jpg`.
- `gabolle-trip-create.png`: 팀 저장소 `docs/architecture/trip-create.png`. 여행 생성 API의 요청 키 선점과 동일 요청 재시도 흐름을 설명하는 다이어그램입니다.
- `gabolle-highlight.mp4`: 사용자가 제공한 `가볼래_시연.mp4` (7분 46.5초)에서 00:00–00:06, 01:58–02:08, 02:56–03:04, 05:11–05:23 구간을 연결한 36초 영상.
- 배속 없음. 무음, H.264, 540×1140, 24 FPS, faststart. 원본 파일은 수정하지 않았습니다.
- `gabolle-award.jpg`: 사용자가 제공한 SSAFY 특화프로젝트 발표회 수상 사진(15기 부울경 2반 2등). 원본 그대로 사용.
- `gabolle-flyasia.jpg`: 사용자가 제공한 FLY ASIA 2026(부산 BEXCO, 2026.10.07~08) 가볼래 부스 사진. 원본 그대로 사용.

## 로보터블 기업연계

- `robotable-frame-1~4.jpg`: 팀 중간발표에 쓴 조리 영상 예시 프레임(00:00 준비, 00:20 달걀 투입, 00:30 채소 넣고 볶기, 01:10 밥 투입). 720×720.
- `robotable-video-chunk.svg`: S15P31E109-253 실험 README의 16편 요약 표(토큰, F1±5)를 기준으로 새로 그린 막대그래프. 팀 방식 3,442,715토큰, 사진 선별 1,819,062, 영상 조각 1fps·60초 608,946, 0.5fps·120초 324,842.

## 삐용

- `bbiyong-mapping.mp4`와 `bbiyong-alert.mp4`: 발표 20·28번 슬라이드의 `image9.gif`(9.83초)와 `image20.gif`(8.9초)를 H.264, 20 FPS로 변환. 원래 속도, 무음. JPG는 원본 중간 프레임.

- `bbiyong-console.png`: 팀 저장소 `docs/assets/readme/patrol-console.png` 전체 화면. 자르지 않고 표시.
- `bbiyong-alert-flow.svg`: 서버 코드(EventLogService, AsyncConfig)를 기준으로 새로 그린 경보 수신, 중복 판정과 저장, 전달 흐름도입니다.
- `bbiyong-driving.mp4`: 같은 저장소의 `autonomous-driving.mp4`. 실제 로봇 촬영 원본의 01:00–01:20 발췌본을 그대로 사용.

## 빈자리

- `binjari-inference.mp4`: `parking_best.mp4`의 110–140초 구간을 실제 `best_seo.pt` 모델과 `parking_lot_A`의 20개 주차면 판정 코드로 다시 추론한 30초 영상. 모델이나 주차 상태를 모의로 구성하지 않았습니다. B5 전환 시각은 원본 128.5195초입니다.
- `binjari-inference.jpg`: 위 실제 추론 영상의 한 프레임으로, 차량 탐지 결과와 서버의 주차면 판정을 나란히 보여줍니다. 웹과 제출용 PDF의 빈자리 대표 이미지로 사용합니다.
- `binjari-detail-transition.mp4`: 기존 Flutter 웹 빌드의 실제 상세정보 화면 녹화(430×850, 5 FPS, 30초). 같은 추론 JSON을 로컬 API로 순서대로 재생했습니다. 상세 화면의 10초 자동 조회 주기를 유지했습니다. 실제 UI에서 B5의 색상과 빈자리 수·점유율이 바뀝니다. 운영 CCTV 중계는 아닙니다.

- `binjari-map-status.png`: 팀 앱의 지도·주차장 선택 화면.
- `binjari-space-status.png`: 프로젝트 `docs/images/app-space-status.png`의 주차면별 상세 상태 화면.
- `binjari-architecture.svg`: 프로젝트 `docs/images/system-architecture.svg`. 영상 분석부터 상태 저장과 앱 조회까지의 구조도입니다.
- 앱 캡처와 추론 영상은 각각의 시연 자료이며 서로 같은 시각에 기록한 화면은 아닙니다.
