// Raster tiles are requested only for the currently visible map viewport.
const NS='http://www.w3.org/2000/svg',RAD=Math.PI/180;
export function tileCoordinate(lat,lng,zoom){const n=2**zoom;return [(lng+180)/360*n,(1-Math.asinh(Math.tan(lat*RAD))/Math.PI)/2*n];}
export function tileLocation(x,y,zoom){const n=2**zoom;return [Math.atan(Math.sinh(Math.PI*(1-2*y/n)))/RAD,x/n*360-180];}
export class NavigationBasemap{
 constructor(group,path){this.origin=path.data.start;this.kx=111195*Math.cos(this.origin[0]*RAD);this.layer=document.createElementNS(NS,'g');this.layer.setAttribute('opacity','.48');group.insertBefore(this.layer,group.children[0]||null);this.tiles=new Map();this.tileURL=path.data.mapTileURL||'https://tile.openstreetmap.org/{z}/{x}/{y}.png';}
 toGeo(x,z){return [this.origin[0]-z/111195,this.origin[1]+x/this.kx];}
 toWorld(lat,lng){return [(lng-this.origin[1])*this.kx,-(lat-this.origin[0])*111195];}
 update(matrix,overview=false){const [a,b,c,d,e,f]=matrix,det=a*d-b*c;if(!Number.isFinite(det)||Math.abs(det)<1e-12)return;const zoom=overview?12:15,corners=[[0,0],[300,0],[300,240],[0,240]].map(([x,y])=>{const wx=(d*(x-e)-c*(y-f))/det,wz=(-b*(x-e)+a*(y-f))/det;return tileCoordinate(...this.toGeo(wx,wz),zoom);});const minX=Math.floor(Math.min(...corners.map(p=>p[0]))),maxX=Math.floor(Math.max(...corners.map(p=>p[0]))),minY=Math.floor(Math.min(...corners.map(p=>p[1]))),maxY=Math.floor(Math.max(...corners.map(p=>p[1]))),visible=new Set();
  for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++){const key=zoom+'/'+x+'/'+y;visible.add(key);if(this.tiles.has(key))continue;const top=this.toWorld(...tileLocation(x,y,zoom)),bottom=this.toWorld(...tileLocation(x+1,y+1,zoom)),tile=document.createElementNS(NS,'image');tile.setAttribute('x',top[0]);tile.setAttribute('y',top[1]);tile.setAttribute('width',bottom[0]-top[0]+.05);tile.setAttribute('height',bottom[1]-top[1]+.05);tile.setAttribute('preserveAspectRatio','none');tile.setAttribute('href',this.tileURL.replace('{z}',zoom).replace('{x}',x).replace('{y}',y));this.layer.append(tile);this.tiles.set(key,tile);}
  for(const [key,tile] of this.tiles)if(!visible.has(key)){tile.remove();this.tiles.delete(key);}
 }
}
