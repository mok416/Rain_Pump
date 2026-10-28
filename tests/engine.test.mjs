import test from 'node:test';
import assert from 'node:assert/strict';
import {runChecks} from '../checks.js';
import {compute,DEFAULTS,validate,route,minimum,storm} from '../engine.js';
for(const r of runChecks())test(r.name,()=>assert.equal(r.pass,true,r.message));
test('전체 기본 설계와 발전기 정격 검증',()=>{const r=compute(structuredClone(DEFAULTS));assert.equal(r.errors.length,0);assert.equal(r.scenarios.length,12);assert.equal(r.allSafe,true);assert.ok(r.best);assert.ok(r.unit>=r.min);assert.ok(r.maxResidual<1e-6);for(const p of r.table){assert.ok(p.gen>=p.genNeed);assert.ok(p.motor>=p.shaft*1.1-1e-8);}});
test('고정 유입 · 해석값과 월류 체적 일치',()=>{const p={...DEFAULTS,area:0,gw:360,initial:0.5};const st={bins:[{dt:600,q:0.1,depth:0}],depth:0,volume:0};const r=route(p,st,0,true);assert.ok(Math.abs(r.finalLevel-(0.5+60/30))<1e-9);assert.equal(r.spilled,0);const r2=route(p,{...st,bins:[{dt:1200,q:0.1,depth:0}]},0);assert.ok(Math.abs(r2.spilled-45)<1e-8);});
test('강우 지속기간 최장·최대강도에서도 유한값',()=>{const p={...DEFAULTS,area:1000,c:1,gw:100000};const r=route(p,{duration:2880,intensity:1000},1000000);assert.ok(Number.isFinite(r.residual));assert.ok(Math.abs(r.residual)<0.01);});
test('0 효율·무한대·빈 숫자·대수 소수·Huff 역전 차단',()=>{for(const q of [{etaPump:0},{area:Infinity},{count:1.5},{huff:[0,...Array(19).fill(100),99]}])assert.ok(validate({...DEFAULTS,...q}).length);});
test('수동 용량 부족 시 실패 · 결과는 0 월류로 오판하지 않음',()=>{const r=compute({...DEFAULTS,mode:'manual',manual:0});assert.equal(r.allSafe,false);assert.ok(r.scenarios.some(s=>s.result.spilled>0));});
test('1/2/3대 최소용량 경계 · 여러 지속기간',()=>{for(const count of [1,2,3])for(const duration of [1,17,60,180]){const p={...DEFAULTS,count};const s={duration,intensity:80},q=minimum(p,s);assert.ok(route(p,s,q+0.01).safe);assert.ok(!route(p,s,q*0.999).safe||q*0.999*count<p.gw);}});
test('결정론적 난수 100건 · 물수지·수위 경계 검증',()=>{let seed=31;const rand=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);for(let i=0;i<100;i++){const p={...DEFAULTS,area:rand()*20,gw:rand()*100,count:1+Math.floor(rand()*3),initial:rand()*2.5};const r=route(p,{duration:1+Math.floor(rand()*600),intensity:rand()*200},rand()*1500,true);assert.ok(Math.abs(r.residual)<1e-5);assert.ok(r.finalLevel>=-1e-8&&r.maxLevel<=p.depth+1e-6);}});
test('별도 0.02초 Euler 계산과 최대수위·월류 비교',()=>{
 for(const unit of [0,350,590,683]){
  const p=DEFAULTS,s=storm(p,{duration:67,intensity:90}),a=p.length*p.width;
  let level=p.initial,max=level,spill=0,n=0;
  for(const b of s.bins){for(let t=0;t<b.dt;t+=0.02){const dt=Math.min(0.02,b.dt-t);if(n&&level<=p.off)n=0;while(n<p.count&&level>=p.on[n])n++;level+=(b.q-n*unit/3600)*dt/a;if(level>p.depth){spill+=(level-p.depth)*a;level=p.depth;}max=Math.max(max,level);}}
  const exact=route(p,s,unit);assert.ok(Math.abs(exact.maxLevel-max)<0.003);assert.ok(Math.abs(exact.spilled-spill)<0.1);
 }
});
test('기동 수위 극소 간격 차단',()=>assert.ok(validate({...DEFAULTS,on:[0.35000000001,1.4,1.95]}).length));
