import {build} from 'esbuild';
await build({entryPoints:['scripts/upload-client.ts'],bundle:true,platform:'browser',format:'iife',target:'es2022',minify:true,outfile:'public/admin-upload.js'});
