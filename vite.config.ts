import { configDefaults, defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, "src/main.ts"),
			name: "lambda-lang",
			// the proper extensions will be added
			fileName: "my-lib",
		},
		rollupOptions: {
			// make sure to externalize deps that shouldn't be bundled
			// into your library
			external: [],
			output: {
				// Provide global variables to use in the UMD build
				// for externalized deps
				assetFileNames: "assets/[name].[ext]",
				entryFileNames: "[name].js",
				chunkFileNames: "[name].js",
				minifyInternalExports: true,
				sourcemap: false,
				compact: true,
				format: "esm",
				globals: {},
			},
		},

		chunkSizeWarningLimit: 1_000,
		reportCompressedSize: false,
		// outDir: outDirRenderer,
		emptyOutDir: true,
		minify: "esbuild",
		target: "esnext",
		sourcemap: false,
	},

	esbuild: {
		treeShaking: true,
		target: "esnext",
		sourcemap: false,
		format: "esm",
	},

	test: {
		dir: "src/__tests__",
		logHeapUsage: true,
		coverage: {
			// reporter: ["html", "text"],
			reporter: ["text"],
			// all: true,
		},
		exclude: [
			...configDefaults.exclude,
			"**/seeLeakedVariables.ts",
			"**/.eslintrc.{js,cjs}",
			"**/styles.ts",
			"**/global.ts",
			"coverage/**",
			"**/*.d.ts",
		],
	},
});
