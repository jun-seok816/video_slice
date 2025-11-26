# Waveform Region Render

> 보이는 구간만 렌더링해 **INP 548→170 ms(−69%)**로 낮춘 WaveSurfer.js 기반 Region 렌더링 최적화 데모.

- 스택: TypeScript, React, Webpack, WaveSurfer.js, Lodash/throttle

## Problem → Solution → Impact
- 문제: 자막 Region 1000개 이상에서 스크롤/줌마다 전체 DOM 재생성 → INP 500 ms+, Scripting 80 ms, 체감 버벅임.
- 해법: 가상스크롤 구현으로 뷰포트+±30 s 버퍼만 생성·유지, `lodash/throttle(500 ms)`로 이벤트 폭주 차단, 드래그 중 `isUpdating` 가드로 중복 렌더 방지.
- 결과:

| 지표 | 개선 전 | 개선 후 | 개선율 |
| --- | --- | --- | --- |
| INP | 548 ms | **170 ms** | −69 % |
| Script 실행 | 80 ms | **28 ms** | −65 % |
| FPS | 30↓ | **60 고정** | +100 % |

## 실행 & 데모
- 데모: http://eedensoft.com:3000/
- 로컬 실행
```bash
git clone https://github.com/jun-seok816/video_slice.git
cd video_slice/front-end
npm install
npm run dev    # webpack-dev-server, 기본 8080
```

## 체험 포인트
- Region 100개 자동 로드 후 스크롤·줌 → 렌더 폭주 없이 부드럽게 동작.
- Region 드래그 시 `isUpdating` 가드로 중복 렌더가 발생하지 않는지 확인.
- DevTools Performance Insights에서 INP·Scripting 수치 감소 확인.

## 배운 점
- “보이는 것만 그린다”가 대량 렌더링 최적화의 출발점.
- 스크롤·드래그 등 과열 구간에는 `throttle`·플래그 등 가드 로직이 필수.
- DevTools 지표로 개선 효과를 수치화해야 설득력이 높아진다.

## 라이선스 & 참고
- clipSeek 내부 기능을 스터디·포트폴리오 목적으로 단순화·비공개화한 코드로, 상업적 사용은 금지됩니다.
- WaveSurfer.js https://wavesurfer.xyz/docs/ © MIT license
