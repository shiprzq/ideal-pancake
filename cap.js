import '../lib/server-env.js';
import supabase from './db-client.js';
import {createClient} from '@supabase/supabase-js';
import {cap,cleanup} from '../lib/cap-server.js';
const gmail=email=>typeof email==='string'&&email.length<=254&&/^[^\s@]+@(?:gmail|googlemail)\.com$/i.test(email);
export default async function handler(req,res){res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Methods','GET, POST, PUT, DELETE, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Cache-Control','no-store');if(req.method==='OPTIONS')return res.status(204).end();if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 try{const action=req.query?.action,body=req.body||{};
 if(action==='challenge'){await cleanup();return res.status(200).json(await cap.createChallenge({challengeCount:32,challengeSize:32,challengeDifficulty:4,expiresMs:120000}));}
 if(action==='redeem'){if(typeof body.token!=='string'||body.token.length>160||!Array.isArray(body.solutions)||body.solutions.length!==32||body.solutions.some(n=>!Number.isSafeInteger(n)||n<0))return res.status(400).json({success:false,message:'Invalid Cap solution.'});const result=await cap.redeemChallenge({token:body.token,solutions:body.solutions});if(result.success)result.expires=Math.min(result.expires,Date.now()+180000);return res.status(result.success?200:400).json(result);}
 if(!['verify','authenticate'].includes(action))return res.status(400).json({error:'Unknown verification action.'});
 if(typeof body.captchaToken!=='string'||body.captchaToken.length>256)return res.status(403).json({success:false,error:'Complete the Cap verification before continuing.'});const proof=await cap.validateToken(body.captchaToken);if(!proof.success)return res.status(403).json({success:false,error:'Your Cap verification expired or was already used. Please verify again.'});
 if(action==='verify')return res.status(200).json({success:true});
 const email=typeof body.email==='string'?body.email.trim():'',password=body.password;if(!gmail(email)||typeof password!=='string'||password.length<8||password.length>128||typeof body.signup!=='boolean')return res.status(400).json({error:'Enter a valid Gmail address and a password of 8–128 characters, then verify again.'});
 // The CAPTCHA is enforced for this app's Gmail password-auth gateway. Public
 // identity-provider endpoints require their own provider-level abuse settings.
 const auth=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const {data,error}=body.signup?await auth.auth.signUp({email,password}):await auth.auth.signInWithPassword({email,password});if(error)return res.status(400).json({error:body.signup?'Could not create the account. Try again later or check your account details.':'Could not sign in. Check your email and password, then complete a new verification.'});return res.status(200).json({session:data.session,confirmationRequired:!data.session});
 }catch(err){console.error('Cap verification failed:',err.message);return res.status(503).json({success:false,error:'Verification or authentication could not be completed. Please retry with a new verification.'});}
}
