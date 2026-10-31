export const isLearningApp=app=>['o11','o12','o13'].includes(app);
export function acceptsLearningKey(app,key){
 if(app==='o11')return key==='fatedreel-o11-book-v1';
 if(app==='o13')return key==='fatedreel-o13-v1';
 return app==='o12'&&(key==='word-atlas-o12:settings'||/^word-atlas-o12:v2:[a-zA-Z0-9_-]+$/.test(key));
}
