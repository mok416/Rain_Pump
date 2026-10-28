import {compute} from './engine.js';
self.onmessage=({data})=>{try{self.postMessage({id:data.id,result:compute(data.input)});}catch(e){self.postMessage({id:data.id,error:e.message});}};
