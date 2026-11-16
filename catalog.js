import '../lib/server-env.js';
import supabase from './db-client.js';
export default async function handler(req,res){
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');if(req.method==='OPTIONS')return res.status(204).end();
 try{if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});const offset=Math.max(0,Math.min(50000,Math.floor(Number(req.query?.offset)||0))),limit=Math.max(1,Math.min(1000,Math.floor(Number(req.query?.limit)||1000)));const {data,error,count}=await supabase.from('pahe_catalog').select('*',{count:'exact'}).order('id',{ascending:true}).range(offset,offset+limit-1);if(error)throw error;
 const chunks=[];for(let i=0;i<data.length;i+=200)chunks.push(data.slice(i,i+200).map(a=>a.id));const responses=await Promise.all(chunks.map(ids=>supabase.from('aster_catalog_sources').select('anime_id,provider,url,external_id').in('anime_id',ids)));const byAnime=new Map();for(const result of responses){if(result.error)throw result.error;for(const row of result.data){byAnime.set(row.anime_id,[...(byAnime.get(row.anime_id)||[]),{provider:row.provider,url:row.url,external_id:row.external_id}]);}}
 res.setHeader('X-Total-Count',String(count||0));res.setHeader('Access-Control-Expose-Headers','X-Total-Count');return res.status(200).json(data.map(a=>({...a,source_records:byAnime.get(a.id)||[]})));}catch(e){return res.status(500).json({error:e.message});}
}
