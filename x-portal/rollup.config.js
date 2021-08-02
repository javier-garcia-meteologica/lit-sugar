import typescript from '@rollup/plugin-typescript';
import nodeResolve from '@rollup/plugin-node-resolve';
import pkg from './package.json';

export default {
  input: 'src/index.ts',
  output: [
    { file: pkg.main, format: 'cjs' },
    { file: pkg.module, format: 'esm' }
  ],
  preserveSymlinks: true,
  plugins: [
    nodeResolve({ resolveOnly: [/^\./] }),
    typescript({ tsconfig: './tsconfig.json' })
  ]
};
