import Cap from '@cap.js/server';
import {createHmac,timingSafeEqual} from 'node:crypto';
import signingKey from './.aster-cap-key.cjs';
import '../lib/server-env.js';
import supabase from '../api/db-client.js';
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])):value;
const sign=(id,payload)=>createHmac('sha256',signingKey).update(id+'\n'+JSON.stringify(stable(payload))).digest('hex');
function authentic(row){if(!row?.payload||typeof row.signature!=='string')return false;const expected=Buffer.from(sign(row.id,row.payload),'hex'),got=Buffer.from(row.signature,'hex');return expected.length===got.length&&timingSafeEqual(expected,got)&&row.expires_at>Date.now();}
async function store(kind,key,data,expires){const id=kind+':'+key,payload={data,expires};const {error}=await supabase.from('aster_cap_records').upsert({id,payload,signature:sign(id,payload),expires_at:expires},{onConflict:'id'}).select('id');if(error)throw error;}
async function take(kind,key){const {data,error}=await supabase.from('aster_cap_records').delete().eq('id',kind+':'+key).select('*').maybeSingle();if(error)throw error;return authentic(data)?data.payload:null;}
async function cleanup(){const {error}=await supabase.from('aster_cap_records').delete().lt('expires_at',Date.now());if(error)throw error;}
export const cap=new Cap({noFSState:true,disableAutoCleanup:true,storage:{challenges:{store:(key,data)=>store('challenge',key,data,data.expires),read:async key=>(await take('challenge',key))?.data||null,delete:async()=>{},deleteExpired:cleanup},tokens:{store:(key,expires)=>store('token',key,null,Math.min(expires,Date.now()+180000)),get:async key=>(await take('token',key))?.expires||null,delete:async()=>{},deleteExpired:cleanup}}});
export {cleanup};
