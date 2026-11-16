import '../lib/server-env.js';
import supabase from './db-client.js';
import {hash,seal,unseal,validateCollection,newSecret} from '../lib/collection-vault.js';
const empty=()=>({entries:[],preferences:{density:'comfortable',favoriteSources:[],compare:[]}});
export default async function handler(req,res){
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');if(req.method==='OPTIONS')return res.status(204).end();res.setHeader('Cache-Control','no-store');
 try{
 if(!['GET','PUT'].includes(req.method))return res.status(405).json({error:'Method not allowed'});
 const token=req.headers?.authorization?.replace(/^Bearer /,'');let id,secret,user;
 if(token){const {data,error}=await supabase.auth.getUser(token);if(error||!data.user)return res.status(401).json({error:'Please sign in again.'});user=data.user;id='account-'+hash(user.id);secret=user.user_metadata?.yorumi_vault_key;
 if(!secret&&req.method==='GET')return res.status(200).json(empty());
 if(!secret){secret=newSecret();const r=await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/auth/v1/user',{method:'PUT',headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({data:{yorumi_vault_key:secret}}),signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error('Could not initialize your private collection.');}
 }else{const visitor=req.method==='GET'?req.query.visitor:req.body?.visitor;if(typeof visitor!=='string'||!/^[a-zA-Z0-9-]{20,60}$/.test(visitor))return res.status(400).json({error:'Invalid browser library.'});id='guest-'+hash(visitor);secret=visitor;}
 if(req.method==='GET'){const {data,error}=await supabase.from('yorumi_collections').select('payload').eq('id',id).maybeSingle();if(error)throw error;return res.status(200).json(data?unseal(data.payload,secret,id):empty());}
 let value;try{value=validateCollection(req.body);}catch(e){return res.status(400).json({error:e.message});}
 const {data:existing,error:readError}=await supabase.from('yorumi_collections').select('id').eq('id',id).maybeSingle();if(readError)throw readError;const row={id,payload:seal(value,secret,id),updated_at:new Date().toISOString()};const result=existing?await supabase.from('yorumi_collections').update(row).eq('id',id).select('id'):await supabase.from('yorumi_collections').insert(row).select('id');if(result.error)throw result.error;return res.status(200).json({ok:true});
 }catch(e){console.error('Collection error:',e.message);return res.status(500).json({error:'Could not load or save your collection. Please try again.'});}
}
