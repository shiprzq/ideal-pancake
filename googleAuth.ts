import supabase from './supabase';
export function signInWithGoogle(reservedPopup?:Window){
 const clientId=import.meta.env.VITE_GOOGLE_CLIENT_ID,redirectUri=import.meta.env.VITE_GOOGLE_AUTH_PROXY;
 if(!clientId||!redirectUri)throw new Error('Google sign-in is not configured. Please use email instead.');
 const state=btoa(JSON.stringify({origin:location.origin,appName:'Aster',supabaseUrl:import.meta.env.VITE_SUPABASE_URL,supabaseAnonKey:import.meta.env.VITE_SUPABASE_ANON_KEY}));
 const url=`https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&prompt=select_account&state=${encodeURIComponent(state)}`;
 const popup=reservedPopup||window.open(url,'google-auth',/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)?'':'width=500,height=600');
 if(!popup)throw new Error('Please allow popups to sign in with Google.');
 if(reservedPopup)reservedPopup.location.replace(url);
 const handler=async(event:MessageEvent)=>{if(event.source!==popup)return;if(event.data?.type==='google-auth-denied'){window.removeEventListener('message',handler);return;}if(event.data?.type!=='google-auth-success')return;window.removeEventListener('message',handler);const {error}=await supabase.auth.setSession({access_token:event.data.access_token,refresh_token:event.data.refresh_token});if(error)console.error(error.message);};window.addEventListener('message',handler);
}
export async function handleGoogleRedirect(){if(!new URLSearchParams(location.hash.slice(1)).has('google_auth_popup'))return;const {data,error}=await supabase.auth.getSession();if(!error&&data.session)window.close();}
