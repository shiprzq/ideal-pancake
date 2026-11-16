import {useState,useEffect,type FormEvent} from 'react';
import {X,Mail,LockKeyhole,ArrowRight,LogOut,Check,LoaderCircle} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import supabase from '../lib/supabase';
import {signInWithGoogle} from '../lib/googleAuth';
import CapVerification from './CapVerification';
export default function AccountModal({onClose}:{onClose:()=>void}){
 const {session}=useAuth();const [signup,setSignup]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [capToken,setCapToken]=useState(''),[capReset,setCapReset]=useState(0);
 const needsCap=/@(?:gmail|googlemail)\.com$/i.test(email.trim());
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;document.querySelector<HTMLButtonElement>('.account-modal .modal-close')?.focus();const handle=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const nodes=document.querySelectorAll<HTMLElement>('.account-modal button:not(:disabled), .account-modal input, .account-modal a[href]');const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};const overflow=document.body.style.overflow;document.body.style.overflow='hidden';document.addEventListener('keydown',handle);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',handle);previous?.focus();};},[onClose]);
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError('');setMessage('');try{if(needsCap){if(!capToken)throw new Error('Complete the Cap verification before continuing with Gmail.');const response=await fetch('/api/cap?action=authenticate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.trim(),password,signup,captchaToken:capToken})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Verification failed. Please retry.');if(result.session){const {error}=await supabase.auth.setSession(result.session);if(error)throw error;onClose();}else setMessage('Check your email to confirm your account, then sign in.');}else{const result=signup?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});if(result.error)throw result.error;if(result.data.session)onClose();else setMessage('Check your email to confirm your account, then sign in.');}}catch(e){setError((e as Error).message);}finally{if(needsCap){setCapToken('');setCapReset(n=>n+1);}setBusy(false);}}
 async function google(){setError('');if(!capToken){setError('Complete the Cap verification before continuing with Google.');return;}const popup=window.open('','google-auth',/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)?'':'width=500,height=600');if(!popup){setError('Please allow popups, then try Google sign-in again.');return;}setBusy(true);try{popup.document.title='Aster · Verifying sign-in';if(popup.document.body)popup.document.body.textContent='Verifying your Cap challenge…';const response=await fetch('/api/cap?action=verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({captchaToken:capToken})});const result=await response.json();if(!response.ok||!result.success)throw new Error(result.error||'Cap verification failed.');signInWithGoogle(popup);}catch(e){popup.close();setError((e as Error).message);}finally{setCapToken('');setCapReset(n=>n+1);setBusy(false);}}
 async function logout(){setBusy(true);const {error}=await supabase.auth.signOut();setBusy(false);if(error)setError(error.message);else onClose();}
 return <div className="modal-backdrop" onClick={onClose}>
 <section className="source-modal account-modal" role="dialog" aria-modal="true" aria-label="Your Aster account" onClick={e=>e.stopPropagation()}>
 <button className="modal-close icon-button" onClick={onClose} aria-label="Close account"><X size={20}/></button>
 <div className="account-mark">a<span>✦</span></div>
 {session?<>
 <div className="eyebrow">YOUR OWN LITTLE ANIME UNIVERSE</div><h2>You’re right at home.</h2>
 <p className="account-email">{session.user.email}</p><div className="account-perk"><Check size={16}/>Your account watchlist syncs across devices.</div>
 <p>Your guest list stays in this browser. Your signed-in list is private to your account.</p>
 <button className="secondary-button" onClick={logout} disabled={busy}><LogOut size={15}/>Sign out</button>
 </>:<>
 <div className="eyebrow">MORE STORIES. YOUR OWN SPACE.</div><h2>{signup?'Your next chapter starts here.':'Welcome back, anime lover.'}</h2><p>Save the stories you love. Pick up on any device.</p>
 <button className="google-button" onClick={google} disabled={!capToken||busy}><span>G</span>Continue with Google</button>
 <CapVerification onToken={setCapToken} resetKey={capReset}/>
 <div className="auth-divider">or use your email</div>
 <form onSubmit={submit}>
 <label>Email address<div className="auth-input"><Mail size={16}/><input required autoComplete="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label>
 <label>Password<div className="auth-input"><LockKeyhole size={16}/><input required minLength={8} autoComplete={signup?'new-password':'current-password'} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></div></label>
 <button className="primary-button" type="submit" disabled={busy||(needsCap&&!capToken)}>{busy?<LoaderCircle className="spin" size={16}/>:<>{signup?'Create your account':'Sign in'}<ArrowRight size={16}/></>}</button>
 </form><p className="auth-switch">{signup?'Already part of the story?':'New around here?'} <button onClick={()=>{setSignup(!signup);setError('');setMessage('');}}>{signup?'Sign in':'Create an account'}</button></p>
 </>}
 {error&&<div role="alert" className="auth-error">{error}</div>}{message&&<div role="status" className="auth-success">{message}</div>}
 <p className="intelligence-footnote">By continuing, you agree to the <a href="/terms.html" target="_blank" rel="noreferrer">Terms of use</a> and acknowledge the <a href="/privacy.html" target="_blank" rel="noreferrer">Privacy policy</a>.</p>
 </section></div>;
}
