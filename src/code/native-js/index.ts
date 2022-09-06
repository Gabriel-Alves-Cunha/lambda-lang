import { minify } from "uglify-js";

import { tokenStream } from "@token-stream/index.js";
import { charStream } from "@token-stream/char-stream.js";
import { makeJS } from "@js-code-gen/makeJS.js";
import { parse } from "@parser/index.js";
import { time } from "@utils/utils.js";

global.print = function print(...args: unknown[]) {
	console.log(...args);
};

global.time = time;

// some test code here
const code1 = "sum = lambda(x, y) x + y; print(sum(2, 3));";
const code2 = `fib = λ(n) if n < 2 then n else fib(n - 1) + fib(n - 2);

time(λ() print(fib(27)));`;

// get the AST
const ast = time(
	() => parse(tokenStream(charStream(code2))),
	"Parse code to be transformed to ast"
);

// get JS code
const jsCode = makeJS(ast);

console.log("Js code:\n", jsCode, "\n-----------");

// additionally, if you want to see the beautified jsCode using UglifyJS
// (or possibly other tools such as acorn/esprima + escodegen):
console.log(
	"Minifyed code:\n",
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
	}),
	"\n-----------"
);

// execute it
eval(jsCode); // prints 5
