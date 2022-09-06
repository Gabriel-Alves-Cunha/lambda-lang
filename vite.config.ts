import { type UserConfigExport, defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
	const isDev = mode === "development";
	const isTest = mode === "test";
	const isProd = !isTest && !isDev;

	const config: UserConfigExport = {
		build: {
			lib: { entry: "src/main.ts", formats: ["es"] },

			rollupOptions: {
				// make sure to externalize deps that shouldn't be bundled
				// into your library
				external: ["debug", "node:perf_hooks", "node:fs"],
				treeshake: true,

				output: {
					minifyInternalExports: isProd,
					sourcemap: !isProd,
					compact: isProd,
					format: "esm",
				},
			},

			chunkSizeWarningLimit: 1_000,
			reportCompressedSize: false,
			sourcemap: !isProd,
			emptyOutDir: true,
			minify: "esbuild",
			target: "esnext",
		},

		esbuild: {
			minifyWhitespace: true,
			minifySyntax: true,
			sourcemap: !isProd,
			treeShaking: true,
			target: "node16",
			format: "esm",
		},

		// test: {
		// 	dir: "src/__tests__",
		// 	logHeapUsage: true,
		// 	coverage: {
		// 		// reporter: ["html", "text"],
		// 		reporter: ["text"],
		// 		// all: true,
		// 	},
		// 	exclude: [
		// 		...configDefaults.exclude,
		// 		"**/seeLeakedVariables.ts",
		// 		"**/.eslintrc.{js,cjs}",
		// 		"**/styles.ts",
		// 		"**/global.ts",
		// 		"coverage/**",
		// 		"**/*.d.ts",
		// 	],
		// },

		resolve: {
			alias: [
				{
					find: "@token-stream",
					replacement: resolve(__dirname, "src/token-stream"),
				},
				{
					find: "@enviroment",
					replacement: resolve(__dirname, "src/enviroment"),
				},
				{
					find: "@js-code-gen",
					replacement: resolve(__dirname, "src/js-code-gen"),
				},
				{ find: "@parser", replacement: resolve(__dirname, "src/parser") },
				{ find: "@utils", replacement: resolve(__dirname, "src/utils") },
				{ find: "@code", replacement: resolve(__dirname, "src/code") },
			],
		},
	};

	return config;
});
