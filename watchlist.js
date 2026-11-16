import '../lib/server-env.js';
import supabase from './db-client.js';
export default async function handler(req,res){
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');if(req.method==='OPTIONS')return res.status(204).end();
 try{
 const token=req.headers?.authorization?.replace(/^Bearer /,'');
 if(token){
 const {data:{user},error:authError}=await supabase.auth.getUser(token);if(authError||!user)return res.status(401).json({error:'Please sign in again.'});
 // Auth-owned metadata is stored in Supabase's protected auth schema, never
 // exposed through the public catalog tables or guest library endpoints.
 const entries=Array.isArray(user.user_metadata?.anipahe_watchlist)?user.user_metadata.anipahe_watchlist.filter(Number.isInteger):[];
 if(req.method==='GET')return res.status(200).json(entries.map(id=>({id,anime_id:id})));
 const anime_id=Number(req.body?.anime_id);if(!Number.isInteger(anime_id)||anime_id<1)return res.status(400).json({error:'Invalid anime'});
 if(req.method==='POST'||req.method==='DELETE'){
 if(req.method==='POST'){const {data:anime,error}=await supabase.from('pahe_catalog').select('id').eq('id',anime_id).single();if(error||!anime)return res.status(400).json({error:'Anime not found'});}
 const next=req.method==='POST'?[...new Set([...entries,anime_id])]:entries.filter(id=>id!==anime_id);
 if(next.length>5000)return res.status(400).json({error:'Your watchlist has reached its 5,000-title limit.'});
 // The Auth user endpoint accepts a short-lived access token, so the server
 // never needs to receive or persist the user's refresh token.
 const response=await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL+'/auth/v1/user',{method:'PUT',headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({data:{anipahe_watchlist:next}}),signal:AbortSignal.timeout(10000)});
 if(!response.ok){const failure=await response.json();throw new Error(failure.msg||failure.message||'Could not save your account watchlist.');}
 return res.status(req.method==='POST'?201:200).json(req.method==='POST'?{id:anime_id,anime_id}:{ok:true});
 }return res.status(405).json({error:'Method not allowed'});
 }
 const visitor=req.method==='GET'?req.query.visitor:req.body?.visitor;if(!visitor||! /^[a-zA-Z0-9-]{20,60}$/.test(visitor))return res.status(400).json({error:'Invalid library identifier'});
 if(req.method==='GET'){const {data,error}=await supabase.from('pahe_watchlist').select('*').eq('visitor_id',visitor);if(error)throw error;return res.status(200).json(data);}
 if(req.method==='POST'){const anime_id=Number(req.body.anime_id);if(!Number.isInteger(anime_id))return res.status(400).json({error:'Invalid anime'});const {data:existing}=await supabase.from('pahe_watchlist').select('*').eq('visitor_id',visitor).eq('anime_id',anime_id);if(existing?.length)return res.status(200).json(existing[0]);const {data,error}=await supabase.from('pahe_watchlist').insert({visitor_id:visitor,anime_id}).select('*').single();if(error)throw error;return res.status(201).json(data);}
 if(req.method==='DELETE'){const {error}=await supabase.from('pahe_watchlist').delete().eq('visitor_id',visitor).eq('anime_id',Number(req.body.anime_id));if(error)throw error;return res.status(200).json({ok:true});}return res.status(405).json({error:'Method not allowed'});
 }catch(e){return res.status(500).json({error:e.message});}
}
