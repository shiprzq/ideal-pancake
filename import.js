import '../lib/server-env.js';
import supabase from './db-client.js';
import {syncCatalog} from '../lib/catalog-sync.js';
export default async function handler(req,res){
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');if(req.method==='OPTIONS')return res.status(204).end();
 try{if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});return res.status(200).json(await syncCatalog(supabase));
 }catch(e){return res.status(500).json({error:e.message});}
}
