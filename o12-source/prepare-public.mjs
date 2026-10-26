import fs from "node:fs";
const from = new URL("../o12/", import.meta.url);
const to = new URL("./public/", import.meta.url);
fs.mkdirSync(to, {recursive:true});
for (const item of fs.readdirSync(from)) {
 if (["assets", "index.html"].includes(item)) continue;
 fs.cpSync(new URL(item,from),new URL(item,to),{recursive:true});
}
