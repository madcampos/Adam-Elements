/* eslint-disable camelcase */
// eslint-env node
import { readFileSync } from 'fs';

import { defineConfig, type UserConfig } from 'vitest/config';
import { loadEnv, type PluginOption } from 'vite';
import { chunkSplitPlugin } from 'vite-plugin-chunk-split';

const sslOptions = {
	cert: readFileSync('./certs/server.crt'),
	key: readFileSync('./certs/server.key')
};

const packageJson: PackageJsonVariables = JSON.parse(readFileSync('./package.json', { encoding: 'utf8' }));

export default defineConfig(({ mode }) => {
	const env = {
		APP_PUBLIC_URL: packageJson.homepage,
		...loadEnv(mode, process.cwd(), 'APP_')
	};

	const config: UserConfig = {
		plugins: [chunkSplitPlugin({ strategy: 'unbundle' }) as PluginOption],
		envPrefix: 'APP_',
		envDir: '../',
		root: 'src',
		publicDir: '../public',
		clearScreen: false,
		server: {
			https: sslOptions,
			open: false,
			cors: true,
			port: 3000
		},
		build: {
			minify: true,
			target: 'esnext',
			assetsInlineLimit: 0,
			emptyOutDir: true,
			outDir: '../dist',
			// TODO: check for support on removing preload as well
			polyfillModulePreload: true,
			rollupOptions: {
				output: {
					generatedCode: 'es5',
					inlineDynamicImports: false
				}
			}
		},
		preview: {
			https: sslOptions,
			open: true
		},
		test: {
			include: ['**/*.test.ts'],
			minThreads: 1,
			maxThreads: 4,
			passWithNoTests: true,
			maxConcurrency: 4,
			coverage: {
				functions: 75,
				branches: 75,
				lines: 75,
				statements: 75
			}
		}
	};

	return config;
});
