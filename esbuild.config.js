import * as esbuild from 'esbuild';

const entryPoints = {
  'private-lambda': './src/functions/private-lambda.ts',
  'public-lambda': './src/functions/public-lambda.ts',
};

async function build() {
  await esbuild.build({
    entryPoints,
    bundle: true,
    platform: 'node',
    target: 'node20',
    outdir: 'dist/functions',
    format: 'esm',
    sourcemap: true,
    minify: true,
    external: [
      '@aws-sdk/*',
      '@prisma/client',
    ],
    banner: {
      js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
    },
  });

  console.log('Build completed successfully!');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
