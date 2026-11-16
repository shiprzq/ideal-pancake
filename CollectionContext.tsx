import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {useAuth} from './AuthContext';
import visitor from '../lib/visitor';
import type {Collection,Entry,Preferences} from '../lib/anime';
import {alignEpisodeProgress} from '../lib/studio';
const defaults:Collection={entries:[],preferences:{density:'comfortable',favoriteSources:[],compare:[]}};
const Context=createContext<{value:Collection;loading:boolean;saving:boolean;error:string;save:(v:Collection)=>Promise<boolean>;update:(e:Entry)=>Promise<boolean>;preferences:(p:Partial<Preferences>)=>Promise<boolean>;reload:()=>Promise<void>}>({value:defaults,loading:true,saving:false,error:'',save:async()=>false,update:async()=>false,preferences:async()=>false,reload:async()=>{}});
export function CollectionProvider({children}:{children:ReactNode}){const {session,loading:authLoading}=useAuth();const [value,setValue]=useState<Collection>(defaults),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState('');const latest=useRef(value),lock=useRef(false),ready=useRef(false),generation=useRef(0);latest.current=value;
 const headers:Record<string,string>={'Content-Type':'application/json',...(session?{Authorization:`Bearer ${session.access_token}`}:{})};
 async function reload(){const gen=generation.current;try{const r=await fetch('/api/collection?visitor='+visitor,{headers});const p=await r.json();if(!r.ok)throw new Error(p.error);if(gen===generation.current){setValue(p);latest.current=p;ready.current=true;setError('');}}catch(e){if(gen===generation.current)setError((e as Error).message);}finally{if(gen===generation.current)setLoading(false);}}
 useEffect(()=>{generation.current++;ready.current=false;setValue(defaults);latest.current=defaults;if(!authLoading){setLoading(true);reload();}},[session?.user.id,authLoading]);
 async function save(next:Collection){if(lock.current||loading)return false;if(!ready.current){setError('Please reload your collection before making changes.');return false;}lock.current=true;setSaving(true);setError('');const gen=generation.current;try{const r=await fetch('/api/collection',{method:'PUT',headers,body:JSON.stringify({...alignEpisodeProgress(next),visitor})});const p=await r.json();if(!r.ok)throw new Error(p.error);if(gen===generation.current)await reload();return true;}catch(e){setError((e as Error).message);return false;}finally{lock.current=false;setSaving(false);}}
 async function update(entry:Entry){const current=latest.current;return save({...current,entries:[...current.entries.filter(e=>e.anime_id!==entry.anime_id),entry]});}
 async function preferences(p:Partial<Preferences>){const current=latest.current;return save({...current,preferences:{...current.preferences,...p}});}
 return <Context.Provider value={{value,loading,saving,error,save,update,preferences,reload}}>{children}</Context.Provider>;
}
export const useCollection=()=>useContext(Context);
