// SI internally: seconds, metres, m³/s. User pump and groundwater rates: m³/h.
export const HUFF=[0,3,6,9,12,15,19,23,27,32,38,45,57,70,79,85,89,92,95,97,100];
export const DEFAULTS={area:1.2,c:0.85,gw:20,length:6,width:5,depth:3,freeboard:0.3,initial:0.5,off:0.35,on:[0.85,1.4,1.95],count:3,head:12,pipeLength:80,f:0.025,k:5,extra:0,etaPump:65,etaMotor:90,pf:0.8,start:3,genMargin:20,capacityMargin:15,motorMargin:10,vmin:0.6,vmax:3,topology:'dedicated',mode:'auto',manual:300,huff:HUFF,rains:[{year:10,durations:'60,120,180',intensities:'65,48,38'},{year:20,durations:'60,120,180',intensities:'75,56,44'},{year:30,durations:'60,120,180',intensities:'82,61,49'},{year:50,durations:'60,120,180',intensities:'90,68,54'}]};
export function list(v){return Array.isArray(v)?v.map(Number):String(v).trim().split(/[,，\s]+/).filter(Boolean).map(Number);}
export function validate(p){
 const e=[];const check=(key,label,min,max)=>{if(typeof p[key]!=='number'||!Number.isFinite(p[key])||p[key]<min||p[key]>max)e.push(`${label}: ${min}–${max} 범위의 숫자를 입력하세요.`);};
 [['area','집수면적 (ha)',0,1000],['c','유출계수',0,1],['gw','지하수 (m³/h)',0,100000],['length','집수정 길이 (m)',0.1,200],['width','집수정 폭 (m)',0.1,200],['depth','집수정 깊이 (m)',0.2,30],['freeboard','여유고 (m)',0,29],['initial','초기수위 (m)',0,30],['off','정지수위 (m)',0,30],['count','운전 가능 대수',1,3],['head','실양정 (m)',0,500],['pipeLength','관로 연장 (m)',0,20000],['f','Darcy 마찰계수',0.005,0.1],['k','국부손실계수 ΣK',0,1000],['extra','추가손실 (m)',0,500],['etaPump','펌프 효율 (%)',1,100],['etaMotor','전동기 효율 (%)',1,100],['pf','역률',0.1,1],['start','기동 kVA 배율',1,10],['genMargin','발전기 여유 (%)',0,100],['capacityMargin','용량 여유 (%)',0,100],['motorMargin','모터 여유 (%)',0,100],['vmin','최소 권장유속',0,10],['vmax','최대 권장유속',0.1,20],['manual','수동 펌프 용량 (m³/h·대)',0,1000000]].forEach(a=>check(...a));
 if(!Number.isInteger(p.count))e.push('펌프 대수는 1·2·3의 정수여야 합니다.');
 if(p.freeboard>=p.depth)e.push('여유고는 집수정 깊이보다 작아야 합니다.');
 const limit=p.depth-p.freeboard;
 if(p.initial>limit)e.push('초기수위가 허용수위(깊이−여유고)를 넘습니다.');
 if(!Array.isArray(p.on)||p.on.length!==3||p.on.some(x=>!Number.isFinite(x)||x<0))e.push('세 단계 기동수위를 모두 입력하세요.');
 else{let prev=p.off;for(let i=0;i<p.count;i++){if(p.on[i]-prev<0.01-1e-12||p.on[i]>=limit)e.push(`${i+1}대 기동수위: 앞 단계보다 0.01 m 이상 높고 허용수위보다 낮아야 합니다.`);prev=p.on[i];}}
 if(p.off>=limit)e.push('정지수위는 허용수위보다 낮아야 합니다.');
 if(p.vmin>=p.vmax)e.push('권장유속 최솟값은 최댓값보다 작아야 합니다.');
 if(!['auto','manual'].includes(p.mode)||!['dedicated','common'].includes(p.topology))e.push('운전 모드 또는 토출관 구성이 올바르지 않습니다.');
 if(!Array.isArray(p.huff)||p.huff.length!==21||p.huff.some((x,i)=>!Number.isFinite(x)||x<0||x>100||(i>0&&x<p.huff[i-1]))||p.huff[0]!==0||p.huff[20]!==100)e.push('Huff 누가분포: 0부터 100까지 감소하지 않는 21개 값(5% 시간 간격)이 필요합니다.');
 if(!Array.isArray(p.rains)||p.rains.length!==4)e.push('10·20·30·50년 강우 행이 필요합니다.');
 else for(const [idx,r] of p.rains.entries()){
  if(r.year!==[10,20,30,50][idx])e.push('강우 빈도는 10·20·30·50년 순서로 입력하세요.');
  const ds=list(r.durations),is=list(r.intensities);
  if(!ds.length||ds.length>12||ds.length!==is.length)e.push(`${r.year}년: 지속기간과 강우강도를 같은 개수로 1–12쌍 입력하세요.`);
  if(ds.some(x=>!Number.isFinite(x)||x<1||x>2880))e.push(`${r.year}년 지속기간은 1–2880분입니다.`);
  if(new Set(ds).size!==ds.length)e.push(`${r.year}년 지속기간에 중복값이 있습니다.`);
  if(is.some(x=>!Number.isFinite(x)||x<0||x>1000))e.push(`${r.year}년 평균 강우강도는 0–1000 mm/h입니다.`);
 }
 return [...new Set(e)];
}
export function cumulative(x,huff=HUFF){if(x<=0)return 0;if(x>=1)return 1;const a=x*20,i=Math.floor(a);return (huff[i]+(huff[i+1]-huff[i])*(a-i))/100;}
export function storm(p,s){
 const seconds=s.duration*60,depth=s.intensity*s.duration/60,volume=depth/1000*p.area*10000*p.c,bins=[];
 for(let t=0;t<seconds;t+=600){const end=Math.min(t+600,seconds),v=volume*(cumulative(end/seconds,p.huff)-cumulative(t/seconds,p.huff));bins.push({start:t,dt:end-t,q:v/(end-t)+p.gw/3600,rain:v,depth:depth*(cumulative(end/seconds,p.huff)-cumulative(t/seconds,p.huff))});}
 for(let t=seconds;t<seconds+7200;t+=600)bins.push({start:t,dt:600,q:p.gw/3600,rain:0,depth:0});
 return {bins,volume,depth,seconds};
}
// Exact event routing within each constant 10-minute inflow block; all pumps latch until common OFF.
// Repeated identical cycles are skipped algebraically, preserving volume, starts, duty time and extrema.
export function route(p,s,unit,details=false){
 const st=s.bins?s:storm(p,s),a=p.length*p.width,cap=a*p.depth,allow=a*(p.depth-p.freeboard),off=p.off*a,ons=p.on.slice(0,p.count).map(x=>x*a),u=unit/3600;
 let v=p.initial*a,n=0,maxV=v,spilled=0,drained=0,inflow=0,t=0,starts=Array(p.count).fill(0),run=Array(p.count).fill(0),maxN=0,peakQ=0,peakT=0,maxStartHour=0;
 const rows=details?[{time:0,level:v/a,peak:v/a,low:v/a,n:0,nEnd:0,qIn:0,qOut:0,rain:0,overflow:0}]:[],events=[];
 const record=(kind)=>{if(details&&events.length<120)events.push({time:t/60,kind,n,level:v/a});};
 const startTo=(target)=>{while(n<target){starts[n]++;n++;maxN=Math.max(maxN,n);record(`${n}대 기동`);}};
 for(const b of st.bins){
  const q=b.q;peakQ=Math.max(peakQ,q);let remain=b.dt,localMax=v,localMin=v,localN=n,outBefore=drained,spillBefore=spilled,cycle=null,loops=0;
  inflow+=q*b.dt;
  while(remain>1e-8){
   if(++loops>10000)throw Error('반복 기동 계산 한도를 초과했습니다. 수위 간격을 넓혀 주세요.');
   if(n>0&&v<=off+1e-8){v=off;n=0;record('전체 정지');}
   while(n<p.count&&v>=ons[n]-1e-8)startTo(n+1);
   localN=Math.max(localN,n);
   if(n===0&&Math.abs(v-off)<1e-7){
    if(cycle){const elapsed=t-cycle.t;if(elapsed>1e-9){const cycles=Math.floor((remain-1e-8)/elapsed);if(cycles>0){drained+=(drained-cycle.drained)*cycles;for(let i=0;i<p.count;i++){run[i]+=(run[i]-cycle.run[i])*cycles;starts[i]+=(starts[i]-cycle.starts[i])*cycles;}t+=cycles*elapsed;remain-=cycles*elapsed;}}cycle=null;}
    else cycle={t,drained,run:[...run],starts:[...starts]};
   }
   const pumping=n*u,rate=q-pumping;let dt=remain,event='end';
   if(rate>1e-14){
    if(n<p.count){const hit=(ons[n]-v)/rate;if(hit<dt){dt=Math.max(0,hit);event='on';}}
    const hit=(cap-v)/rate;if(hit<dt){dt=Math.max(0,hit);event='rim';}
   }else if(rate< -1e-14&&n>0){const hit=(off-v)/rate;if(hit<dt){dt=Math.max(0,hit);event='off';}}
   if(event==='rim'&&dt<1e-8){spilled+=rate*remain;drained+=pumping*remain;for(let i=0;i<n;i++)run[i]+=remain;t+=remain;remain=0;v=cap;}
   else {
    v+=rate*dt;drained+=pumping*dt;for(let i=0;i<n;i++)run[i]+=dt;t+=dt;remain-=dt;
    if(v>maxV){maxV=v;peakT=t/60;}localMax=Math.max(localMax,v);localMin=Math.min(localMin,v);
    if(event==='on')startTo(n+1);
    if(event==='off'){v=off;n=0;record('전체 정지');}
   }
  }
  localMax=Math.max(localMax,v);localMin=Math.min(localMin,v);maxV=Math.max(maxV,localMax);
  if(details)rows.push({time:t/60,level:v/a,peak:localMax/a,low:localMin/a,n:localN,nEnd:n,qIn:q*3600,qOut:(drained-outBefore)/b.dt*3600,rain:b.depth,overflow:spilled-spillBefore});
 }
 const residual=p.initial*a+inflow-drained-spilled-v;
 if(![v,maxV,spilled,drained,inflow,residual].every(Number.isFinite))throw Error('수치 연산이 유효 범위를 벗어났습니다.');
 return {maxLevel:maxV/a,finalLevel:v/a,spilled,exceed:Math.max(0,(maxV-allow)/a),safe:maxV<=allow+1e-8&&spilled<1e-7,drained,inflow,residual,peakIn:peakQ*3600,peakTime:peakT,maxN,starts,runHours:run.map(x=>x/3600),rows,events,depth:st.depth,runoff:st.volume,steady:unit*p.count>=p.gw-1e-7};
}
export function minimum(p,s){
 const st=storm(p,s),floor=p.gw/p.count;
 const ok=q=>{const r=route(p,st,q);return r.safe&&q*p.count>=p.gw-1e-7;};
 if(ok(0))return 0;
 let low=0,high=Math.max(1,floor,...st.bins.map(b=>b.q*3600/p.count));
 while(!ok(high)){high*=2;if(high>1e7)throw Error('이 조건은 펌프 탐색 한도(10,000,000 m³/h·대)에서 충족할 수 없습니다.');}
 for(let i=0;i<42;i++){const mid=(low+high)/2;if(ok(mid))high=mid;else low=mid;}
 return Math.max(high,floor);
}
const MOTORS=[0.37,0.55,0.75,1.1,1.5,2.2,3,4,5.5,7.5,11,15,18.5,22,30,37,45,55,75,90,110,132,160,200,250,315,400,500,630,800,1000,1250,1500,2000];
const GENS=[5,10,15,20,25,30,40,50,60,75,100,125,150,175,200,250,300,350,400,450,500,600,750,1000,1250,1500,2000,2500,3000];
const roundSize=(x,s)=>x<=1e-12?0:(s.find(a=>a>=x)??Math.ceil(x/100)*100);
export function pipes(p,unit){
 return [200,250,300,350,400].map(mm=>{
  const d=mm/1000,q=unit/3600*(p.topology==='common'?p.count:1),v=q/(Math.PI*d*d/4),hf=p.f*p.pipeLength/d*v*v/(2*9.80665),hm=p.k*v*v/(2*9.80665)+p.extra,tdh=p.head+hf+hm,shaft=9.80665*unit/3600*tdh/(p.etaPump/100),input=shaft/(p.etaMotor/100),motor=roundSize(shaft*(1+p.motorMargin/100),MOTORS),perKva=motor/(p.etaMotor/100)/p.pf,runKva=p.count*perKva,startKva=(p.count-1+p.start)*perKva,genNeed=Math.max(runKva,startKva)*(1+p.genMargin/100),gen=roundSize(genNeed,GENS);
  return {mm,v,hf,hm,tdh,shaft,input,motor,runKva,startKva,genNeed,gen,valid:unit>0&&v>=p.vmin&&v<=p.vmax,warning:v>p.vmax?'유속 초과':v<p.vmin?'저유속':'적합'};
 });
}
export function compute(p){
 const errors=validate(p);if(errors.length)return {errors};
 const scenarios=p.rains.flatMap(r=>list(r.durations).map((duration,i)=>({year:r.year,duration,intensity:list(r.intensities)[i]}))).map(s=>({...s,minimum:minimum(p,s)}));
 const governing=scenarios.reduce((a,b)=>b.minimum>a.minimum?b:a),min=governing.minimum,recommended=min<1e-7?0:Math.ceil(min*(1+p.capacityMargin/100)-1e-8),unit=p.mode==='manual'?p.manual:recommended;
 for(const s of scenarios)s.result=route(p,s,unit,true);
 const worst=scenarios.reduce((a,b)=>b.result.maxLevel>a.result.maxLevel+1e-8||(Math.abs(b.result.maxLevel-a.result.maxLevel)<1e-8&&b.minimum>a.minimum)?b:a),table=pipes(p,unit),valid=table.filter(x=>x.valid),best=valid.length?valid[0]:null;
 const warnings=[];
 if(p.area>10)warnings.push('큰 집수구역입니다. 도달시간·관로 저류를 반영한 유출모형 검토가 필요합니다.');
 if(!p.area||!p.c)warnings.push('강우 유출량은 0입니다. 지하수와 초기 저류만 반영합니다.');
 if(!valid.length&&unit>0)warnings.push('D200–400에서 권장유속을 만족하는 관경이 없습니다. 관경 범위 또는 병렬 관로를 재검토하세요.');
 if(p.mode==='manual'&&unit*p.count<p.gw)warnings.push('전체 펌프 용량이 상시 지하수보다 작아 장기적으로 월류합니다.');
 const allSafe=scenarios.every(s=>s.result.safe&&s.result.steady);
 if(!allSafe)warnings.push('허용수위 초과 또는 지하수 상시배제 부족입니다. 펌프 용량·집수정·기동수위를 조정하세요.');
 if(scenarios.some(s=>s.result.starts.some((n)=>n/((s.duration+120)/60)>20)))warnings.push('평균 기동 빈도가 20회/h를 넘는 펌프가 있습니다. 허용 기동횟수와 정지 수위차를 확인하세요.');
 for(const r of p.rains){const ds=list(r.durations),is=list(r.intensities);for(let i=0;i<ds.length;i++)for(let j=i+1;j<ds.length;j++)if((ds[i]-ds[j])*(is[i]-is[j])>0){warnings.push(`${r.year}년: 지속기간이 길수록 강도가 커지는 입력입니다. IDF 자료를 확인하세요.`);i=ds.length;break;}}
 return {errors:[],scenarios,governing:{year:governing.year,duration:governing.duration,intensity:governing.intensity},min,recommended,unit,table,best,worst:{year:worst.year,duration:worst.duration,maxLevel:worst.result.maxLevel},allSafe,warnings,maxResidual:Math.max(...scenarios.map(s=>Math.abs(s.result.residual)))};
}
