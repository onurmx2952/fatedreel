/* The exact Python/Mesa research model runs in a worker; no JS model port. */
let runtime;
async function initialize(){
  if(runtime)return runtime;
  postMessage({type:'status',message:'Python 3.14 indiriliyor… İlk açılış biraz sürebilir.'});
  const runtimeURL=new URL('./runtime/',self.location.href).href;
  const {loadPyodide}=await import(runtimeURL+'pyodide.mjs');
  const py=await loadPyodide({indexURL:runtimeURL,packageBaseUrl:runtimeURL});
  postMessage({type:'status',message:'NumPy, pandas, SciPy ve Mesa hazırlanıyor…'});
  await py.loadPackage(['micropip','numpy','pandas','scipy','networkx','tqdm']);
  const wheel='mesa-3.5.1-py3-none-any.whl';
  const [wheelResponse,modelResponse,v2Response]=await Promise.all([fetch('./vendor/'+wheel),fetch('./model.py'),fetch('./model_v2.py')]);
  if(!wheelResponse.ok||!modelResponse.ok||!v2Response.ok)throw Error('Model dosyaları indirilemedi');
  py.FS.writeFile('/'+wheel,new Uint8Array(await wheelResponse.arrayBuffer()));
  py.FS.writeFile('/model.py',await modelResponse.text());
  py.FS.writeFile('/model_v2.py',await v2Response.text());
  await py.runPythonAsync(`import micropip\nawait micropip.install('emfs:/${wheel}', deps=False)\nimport sys\nsys.path.insert(0,'/')\nfrom model import *\nimport json, platform, mesa\nfrom js import postMessage\n`);
  runtime=py;return py;
}
self.onmessage=async ({data:{kind,config}})=>{
  try{
    const py=await initialize();py.globals.set('config_json',JSON.stringify(config));py.globals.set('job_kind',kind);
    py.globals.set('report_progress',(value,message)=>postMessage({type:'progress',value,message}));
    const result=await py.runPythonAsync(`
cfg=json.loads(config_json)
import importlib
engine=importlib.import_module('model_v2' if cfg.get('model_version')=='2.0' else 'model')
Parameters=engine.Parameters
experiment=engine.experiment
sensitivity=engine.sensitivity
variant_count=10 if cfg.get('model_version')=='2.0' else 8
p=Parameters(**cfg['parameters'])
n=int(cfg['runs']); seed=int(cfg['base_seed'])
if job_kind=='experiment':
    h,e,o=experiment(p,n,seed,progress=lambda f:report_progress(f,f'{int(f*n)}/{n} deney tamamlandı'))
    meta={**cfg,'python':platform.python_version(),'mesa':mesa.__version__,'runtime':'Pyodide 314.0.6','warning':'Varsayımsal; gerçek Fransa tahmini değildir.'}
    result={'metadata':meta,'monthly':h.to_dict('records'),'events':e.to_dict('records'),'outcomes':o.to_dict('records')}
elif job_kind=='sensitivity':
    result=sensitivity(p,n,seed,progress=lambda f:report_progress(f,f'{int(f*variant_count)}/{variant_count} parametre varyantı tamamlandı')).to_dict('records')
else:
    rows=[]
    for i,name in enumerate(SCENARIOS):
        _,_,out=experiment(replace(p,scenario=name),n,seed,progress=lambda f:report_progress((i+f)/4,f'{name}: {int(f*n)}/{n} deney'))
        out['scenario']=name;rows.extend(out.to_dict('records'))
    result=rows
json.dumps(result,ensure_ascii=False,allow_nan=False)
`);
    postMessage({type:'result',result:JSON.parse(result),python:py.runPython('platform.python_version()')});
  }catch(e){postMessage({type:'error',message:String(e.message||e).slice(-1200)})}
};
