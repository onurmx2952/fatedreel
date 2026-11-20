import { cpSync, existsSync, renameSync, rmSync } from 'node:fs';
if (existsSync('dist/ucus/cesium')) {
  renameSync('dist/ucus/cesium', 'dist/cesium');
  rmSync('dist/ucus', { recursive: true });
}
