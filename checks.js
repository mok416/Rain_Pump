import {DEFAULTS,HUFF,compute,validate,storm,route,minimum,pipes} from './engine.js';
export function runChecks(){
 const results=[];const test=(name,fn)=>{try{if(!fn())throw Error('기대값 불일치');results.push({name,pass:true});}catch(e){results.push({name,pass:false,message:e.message});}};
 const p=structuredClone(DEFAULTS),s={year:50,duration:60,intensity:90};
 test('Huff 우량 보존 · 67분 비정수 구간',()=>{const a=storm(p,{duration:67,intensity:90});return Math.abs(a.bins.reduce((n,b)=>n+b.rain,0)-a.volume)<1e-8&&a.bins.some(b=>b.dt===420);});
 test('수위 연속방정식 · 물수지 보존',()=>Math.abs(route(p,s,300,true).residual)<1e-7);
 test('무강우·무유입 · 최소 0',()=>{const q={...p,area:0,gw:0};return minimum(q,s)===0;});
 test('정지 용량 0 · 월류 체적 검출',()=>route(p,s,0).spilled>0);
 test('1 → 2 → 3대 순차 기동',()=>{const r=route(p,s,50,true),n=r.events.filter(e=>e.kind.includes('기동')).slice(0,3).map(e=>e.n);return n.join(',')==='1,2,3';});
 test('최소용량 경계 · 직하 용량 실패',()=>{const m=minimum(p,s);return route(p,s,m+0.001).safe&&!route(p,s,m*0.999).safe;});
 test('지하수 상시 배제 · 장기 부족 판정',()=>{const q={...p,area:0,gw:200};return minimum(q,s)>=200/3-1e-6&&!route(q,s,10).steady;});
 test('D200 대비 D400 마찰손실 감소',()=>{const r=pipes(p,300);return r[0].hf>r[4].hf&&r[0].tdh>r[4].tdh;});
 test('독립관/공통관 유속 · 3배 검산',()=>Math.abs(pipes({...p,topology:'common'},300)[0].v/pipes(p,300)[0].v-3)<1e-10);
 test('음수·NaN·빈 분포 입력 차단',()=>validate({...p,area:-1}).length>0&&validate({...p,etaPump:NaN}).length>0&&validate({...p,huff:[]}).length>0);
 test('역전 기동수위·초기수위 초과 차단',()=>validate({...p,on:[2,1,1.5]}).length>0&&validate({...p,initial:3}).length>0);
 test('강우 기간/강도 개수 불일치 차단',()=>{const q=structuredClone(p);q.rains[0].durations='10,20';return validate(q).length>0;});
 test('극단 소형정·대용량 반복기동 수렴',()=>{const q={...p,length:0.1,width:0.1,depth:1,freeboard:0.1,off:0.1,initial:0.1,on:[0.2,0.4,0.6],gw:100};const r=route(q,{duration:1,intensity:1000},1e6);return Number.isFinite(r.maxLevel)&&Math.abs(r.residual)<1e-5;});
 test('1대/2대 운전 · 가동 대수 제한',()=>[1,2].every(count=>route({...p,count},s,50).maxN<=count));
 return results;
}
