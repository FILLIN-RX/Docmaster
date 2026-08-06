import { cpSync } from 'fs';
import { resolve } from 'path';

// Copy the docs folder to dist/docs
cpSync(resolve('docs'), resolve('dist/docs'), { recursive: true });
console.log('✅ [Assets] Copied docs/ to dist/docs/');
