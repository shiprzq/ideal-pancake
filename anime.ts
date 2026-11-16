export type Anime={id:number;title:string;poster:string;synopsis:string;genres:string[];episodes:number|null;year:number|null;score:number|null;status:string;source:string;source_url:string;source_id:string;source_records?:{provider:string;url:string;external_id:string}[]};
export type Entry={anime_id:number;status:string;progress:number;rating:number;note:string;favorite:boolean};
export type Preferences={density:'compact'|'comfortable';favoriteSources:number[];compare:number[]};
export type Collection={entries:Entry[];preferences:Preferences;studio?:import('./studio').Studio};
export type AdvancedFilters={year:string;minimum:string;airing:string;personal:string};
export type Source={id:number;name:string;url:string;kind:string;description:string;search_template:string};
