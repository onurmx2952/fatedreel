// Horizontal arc-length parameter in metres. All geometry is estimated.
export const ROAD_LENGTH=100;
export const WIDTH=6.6;
export function centerValues(s){return [(Math.cos(s*.006)-1)/.006,s*.025,-Math.sin(s*.006)/.006];}
export function normalValues(s){return [Math.cos(s*.006),0,-Math.sin(s*.006)];}
export function groundHeight(s,o){const edge=Math.max(0,Math.abs(o)-4.2);return s*.025+(o<0?Math.pow(edge,.85)*.33:-Math.min(5,edge*.15))+Math.sin(s*.12+o*.3)*Math.min(1,edge*.09);}
