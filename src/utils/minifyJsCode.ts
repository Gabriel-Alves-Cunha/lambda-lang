import { minify } from "uglify-js";

export const minifyJs = (jsCode: string) =>
	minify(jsCode, {
		warnings: "verbose",
		keep_fnames: true,
		compress: false,
		mangle: false,
		module: true,
		output: {
			quote_style: 3 /* OutputQuoteStyle.AlwaysOriginal */,
			semicolons: true,
			wrap_iife: true,
			indent_level: 2,
			beautify: true,
			width: 80,
		},
	});
