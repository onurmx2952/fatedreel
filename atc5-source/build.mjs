import * as esbuild from 'esbuild';
import {mkdir,writeFile,copyFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await writeFile('jsx-inject.js', 'export { h, Fragment } from "preact";');
await esbuild.build({entryPoints:['atc5.jsx'],bundle:true,outdir:'dist',entryNames:'app-[hash]',assetNames:'assets/[name]-[hash]',format:'esm',minify:true,loader:{'.js':'jsx','.xml':'text'},jsxFactory:'h',jsxFragment:'Fragment',inject:['./jsx-inject.js'],alias:{'react':'preact/compat','react-dom':'preact/compat'},define:{'process.env.NODE_ENV':'"production"'},metafile:true}).then(async result=>{
 const files=Object.keys(result.metafile.outputs);const js=files.find(f=>f.endsWith('.js'));const css=files.find(f=>f.endsWith('.css'));
 await writeFile('dist/index.html',`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="ATC Manager 2, Ankara Esenboğa LTAC gerçek uçuş kayıtlarıyla."><title>ATC5 · LTAC Esenboğa | ATC Manager 2</title><link rel="stylesheet" href="./${css.split('/').pop()}"></head><body><div id="app"></div><script type="module" src="./${js.split('/').pop()}"></script></body></html>`);
 await writeFile('dist/build-meta.json',JSON.stringify({upstream:'https://github.com/sempostma/atc-manager-2',upstreamCommit:'59e7ef99d8a873a4c176474d0a87a734e0440116',records:497,version:'atc5-20261110-1'}));
});
await copyFile('ltac-flights.json','dist/flights.json');
