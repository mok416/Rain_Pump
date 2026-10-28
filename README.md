# Rain_Pump · 철도공사 임시 양수펌프 설계 도구

Huff 3분위 강우와 집수정 저류를 이용해 단계기동, 최소 펌프 용량, 토출관경별 TDH·동력·발전기 용량을 검토하는 브라우저용 도구입니다.

## GitHub Pages로 공개 실행

1. 저장소의 **Settings → Pages**를 엽니다.
2. **Source: Deploy from a branch**를 선택합니다.
3. **Branch: main**, **Folder: /(root)**를 선택하고 **Save**를 누릅니다.
4. 배포 완료 후 Pages 화면에 표시되는 웹 주소를 공유합니다.

주소 형식: `https://mok416.github.io/Rain_Pump/` — 이 README를 올리는 것만으로 Pages가 활성화되지는 않습니다. 위 설정과 배포 완료 후 접속할 수 있습니다.

이 웹사이트는 별도의 앱 로그인이나 서버 프로그램 없이 실행됩니다. PC·휴대폰 화면에 맞춰 배치가 바뀝니다. 입력값은 방문자 자신의 브라우저에 저장되며, 기기 간 이동은 결과 내보내기 메뉴의 JSON 저장·불러오기를 이용합니다.

## 로컬 실행

현재 앱은 ES 모듈과 모듈 Worker를 사용하므로 `index.html`을 파일로 직접 여는 대신 HTTP 서버로 실행합니다. Python이 설치되어 있다면 저장소 폴더에서 다음 명령을 실행하세요.

```bash
python -m http.server 8000
```

그런 다음 브라우저에서 `http://localhost:8000`을 엽니다. 실행 시 추가 JavaScript 패키지는 필요하지 않습니다.

## 검증

Node.js가 설치되어 있다면 다음 명령으로 23개 테스트를 실행할 수 있습니다.

```bash
node --test tests/*.test.mjs
```

화면의 **검증 테스트 실행** 버튼에서는 14개 핵심 검증을 실행합니다. 자동 테스트에는 별도로 구현한 0.02초 Euler 적분과의 대조, 해석적 일정 유입 검산, 100개 난수 조건의 물수지 검증이 포함됩니다.

## 주요 기능

- 10·20·30·50년 확률강우 및 빈도별 최대 12개 지속기간 입력
- Huff 누가분포 수정, 10분 강우 구간 내 기동·정지 이벤트 계산
- 동일 용량 펌프 1→2→3대 단계기동 및 공통 정지수위 적용
- 허용수위를 지키는 최소 대당 용량 탐색과 전체 강우조건의 지배조건 표시
- D200·250·300·350·400별 유속, 손실, TDH, 모터 kW, 발전기 kVA 비교
- 독립 토출관/공통 토출관 선택, CSV·JSON 내보내기

기본 강우와 Huff 분포는 예시입니다. 현장 채택 자료를 입력하고, 실제 장비 선정 시 제조사 Q–H 곡선과 발전기 기동 성능을 확인하세요.

## 계산 가정 및 출처


- Area: ha, intensity: duration-average mm/h, rainfall duration: minutes, flow: m³/h per pump; SI internally.
- Huff III default: cumulative `[0,3,6,9,12,15,19,23,27,32,38,45,57,70,79,85,89,92,95,97,100]` at 5% time increments, derived from Illinois EPA Cedar Creek TMDL Table 3-6. This is an example, not an adopted regional Korean distribution. User-supplied rainfall and Huff points take precedence.
- Ten-minute constant inflow blocks, shortened final rainfall block, and 120 minutes after rainfall. Rain volume is conserved by differencing interpolated cumulative depths. No catchment travel-time or drainage-network routing.
- Rectangular sump. Each identical fixed-flow pump latches when its ON threshold is reached; all stop at the common OFF threshold. Event times inside each rainfall block are solved exactly. Identical cycling is aggregated algebraically.
- Allowable level = depth − freeboard; actual spill crest = depth. Minimum sizing respects both the allowable level and permanent groundwater capacity. Each input return-period/duration pair is searched independently; maximum unit requirement governs. Recommended flow is rounded upward to whole m³/h after the capacity margin.
- Darcy–Weisbach with a user-entered fixed Darcy friction factor, minor-loss K sum and additional head. Dedicated outlets carry unit flow; common outlet carries simultaneous duty-pump flow. Static head is the maximum at OFF level, held conservative and constant.
- Motor output rating is selected from an illustrative standard list after pump-efficiency and motor-margin calculation. Actual electrical input additionally includes motor efficiency.
- Generator rating includes `N−1` running motors and one starting motor; starting multiplier applies to per-motor kVA. Illustrative upper rating after generator margin. Manufacturer transient performance is outside this model.
- Diameter recommendation is the smallest D200/250/300/350/400 actual bore satisfying the user velocity band; no economic optimization. No recommendation is issued when none qualifies.
- Manufacturer Q–H curves, parallel pump duty, delayed starting, failures, standby equipment, sediment blockage and simultaneous electrical restart must be checked for equipment selection.

Inputs persist only in browser localStorage. JSON and BOM-prefixed CSV exports are generated locally. No input data is sent to a server.
