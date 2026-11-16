import {randomBytes} from 'node:crypto';
import {mkdir,writeFile,copyFile,readFile} from 'node:fs/promises';
// A fresh, server-only signing key is generated per deployment. Never put this
// module in public/ or import it from the React application.
await writeFile(new URL('../lib/.aster-cap-key.cjs',import.meta.url),'module.exports = '+JSON.stringify(randomBytes(32).toString('hex'))+';\n',{mode:0o600});
await mkdir(new URL('../public/cap/',import.meta.url),{recursive:true});
for(const file of ['cap_wasm_bg.wasm','hashwx.wasm'])await copyFile(new URL('../node_modules/@cap.js/wasm/browser/'+file,import.meta.url),new URL('../public/cap/'+file,import.meta.url));
let notice='Aster uses self-hosted Cap CAPTCHA. https://trycap.dev\n';
for(const pkg of ['@cap.js/server','cap-widget','@cap.js/wasm']){try{const p=JSON.parse(await readFile(new URL('../node_modules/'+pkg+'/package.json',import.meta.url),'utf8'));notice+='\n'+pkg+' '+p.version+' · '+p.license+'\n';notice+=await readFile(new URL('../node_modules/'+pkg+'/LICENSE',import.meta.url),'utf8');}catch{}}
await writeFile(new URL('../public/cap/NOTICE.txt',import.meta.url),notice);
