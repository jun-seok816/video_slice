# Waveform Region Render Optimizer (포트폴리오 데모)

> **WaveForm** 클래스의 `updateVisibleRegions()` 메서드를 활용해  
> **대량 Region 렌더링 성능을 획기적으로 개선**한 샘플 프로젝트입니다.

---

## 1. 프로젝트 개요

| 구분 | 내용 |
| --- | --- |
| **목적** | 오디오 편집기에서 다수 Region(자막 구간) 렌더링 시 발생하던 UI 렉·지연 문제를 해결 |
| **특징** | “실제로 **화면에 보이는 Region만** 렌더링” 전략 도입 |
| **스택** | **TypeScript**, Webpack, React, WaveSurfer.js, Lodash/throttle |

> 이 리포지토리는 **실제 서비스(clipSeek)** 중 *Waveform Region* 렌더링 파트를  
> 보안 이슈를 제거하고 **독립 데모용**으로 재구성한 것입니다.

---

## 2. 배경 & 문제 상황

- Region 생성/삭제/수정 시 **모든 Region을 재렌더링**  
- 1000개 이상 Region에서 **스크롤·클릭 시 INP 500 ms+**, 체감 버벅임 심화  
- DevTools Performance 탭 `Scripting` 영역 80 ms 이상 소모

---

## 3. 핵심 개선 포인트

### 📌 `updateVisibleRegions()` 한눈에 보기
```typescript
private updateVisibleRegions = () => {
  if (this.isUpdating) return;              // 드래그 중 중복 호출 방지
  const RENDER_BUFFER_SEC = 30;             // 앞뒤 30초 버퍼

  // 1) 현재 뷰포트(가시 시간 범위) 계산
  const { start, end } = this.getVisibleTimeRange();
  const expandedStart = Math.max(0, start - RENDER_BUFFER_SEC);
  const expandedEnd   = end + RENDER_BUFFER_SEC;

  // 2) 가시 구간에 속하는 Region만 생성
  this.iv_region.regionList.forEach((tc, id) => {
    if (tc.eTime > expandedStart && tc.sTime < expandedEnd) {
      const inst = this.im_makeRegion(tc);
      this.visibleRegionInstances.set(id, inst);
    }
  });
};
```

|  | 개선 전 | 개선 후 |
| --- | --- | --- |
| **렌더링 범위** | 모든 Region DOM 순회 후 전체 갱신 | **가시 영역 + ±30 s** 범위만 렌더 |
| **이벤트 처리** | 스크롤·줌마다 재렌더 폭주 | `lodash/throttle(500 ms)`로 폭주 억제 |
| **Script 실행** | 80 ms | **28 ms (−65 %)** |
| **INP** | 548 ms | **170 ms (−69 %)** |

---

## 4. 실행 방법

```bash
git clone https://github.com/jun-seok816/video_slice.git
cd waveform-region-optimizer
npm install
npm start        # http://localhost:3000
```

> **데모 사이트**: https://waveform-demo.vercel.app  
> (Region 100개 자동 로드 버튼 → 렉 없는 편집 경험 확인)

---

## 5. 체험 가이드

1. Region 범위 조정
2. Region 추가 삭제
3. Waveform 재생,스크롤시 리렌더링 확인
4. DevTools **Performance Insights** → **INP, Scripting** 수치 확인  
5. Region 드래그 시 `isUpdating` 플래그로 **중복 렌더 차단** 체험

---

## 6. 성능 지표 (Before → After)

| 지표 | 개선 전 | 개선 후 | 개선율 |
| --- | --- | --- | --- |
| **INP** | 548 ms | **90 ms** | −90 % |
| **Script 실행** | 80 ms | **28 ms** | −65 % |
| **FPS** | 30↓ | **60 고정** | +100 % |

---

## 7. 배우고 얻은 점

- **“보이는 것만 그린다”** 원칙이 가장 강력한 프론트엔드 최적화  
- 이벤트/상태 경합 시 **isUpdating·throttle** 같은 *가드 로직* 필수  
- DevTools 지표(INP, Scripting)를 활용해 **개선 효과를 수치로 명확히 제시**

---

## 8. 라이선스 & 참고

- 본 코드는 clipSeek 내부 기능을 **스터디·포트폴리오 목적**으로 변형해 공개합니다.  
  상업적 사용은 금지됩니다.  
- WaveSurfer.js https://wavesurfer.xyz/docs/ © MIT license
