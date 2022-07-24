import { readFile, writeFile } from "fs";

import { makeEnviroment } from "./Enviroment";
import { tokenStream } from "./token-stream";
import { cpsEvaluate } from "./Enviroment/cps-evaluate";
import { charStream } from "./token-stream/char-stream";
// import { internal } from "./code/internal";
import { Execute } from "./Enviroment/guard";
import { parse } from "./parser";
import { time } from "./utils/utils";
import { code } from "./code/cps-internal";

////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////

// Create the global environment:
const globalEnv = makeEnviroment("global");

////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////

// // Define the `log` primitive function:
// globalEnv.def("log", function(...args: any[]) {
// 	console.log(...args);
// });
//
// // Defining the `print` primitive function:
// globalEnv.def("print", function(...args: any[]) {
// 	process.stdout.write(args.join(" "));
// });
//
// globalEnv.def("fibJS", function fibJS(n: number): number {
// 	if (n < 2) return n;
// 	return fibJS(n - 1) + fibJS(n - 2);
// });

// globalEnv.def(
// 	"time",
// 	function time<T>(
// 		...args: [callback: Function, fn: () => T, label: string]
// 	): T {
// 		// const ret = args[0]();
// 		console.log({ args: args.length, argsStr: stringifyJson(args[0]) });
//
// 		const start = performance.now();
//
// 		const fnReturn = args[0]();
//
// 		const end = performance.now();
//
// 		console.log(
// 			`%cFunction %c"${args[1]}" %ctook: ${end - start} ms.`,
// 			"color:brown",
// 			"color:blue",
// 			"color:brown",
// 		);
//
// 		return fnReturn as T;
// 	},
// );

globalEnv.def(
	"time",
	function(callback: Function, func: Function, label: string): void {
		const start = performance.now();
		func(function(ret: any) {
			const time = performance.now() - start;

			console.log(
				`%cFunction %c"${label}" %ctook: ${time} ms.`,
				"color:brown",
				"color:blue",
				"color:brown",
			);

			callback(ret);
		});
	},
);

// define the "log" primitive function
globalEnv.def("log", function(callback: Function, ...args: any[]) {
	console.log(...args);
	callback(false); // call the continuation with some return value
	// if we don't call it, the program would stop
	// abruptly after a log!
});

globalEnv.def("halt", function(callback: Function): void {});

globalEnv.def(
	"sleep",
	function(callback: Function, milliseconds: number): void {
		setTimeout(function(): void {
			Execute(callback, [false]);
		}, milliseconds);
	},
);

globalEnv.def("readFile", function(callback: Function, filename: string) {
	readFile(filename, function(err, data) {
		// error handling is a bit more complex, ignoring for now
		Execute(callback, [data]); // hope it's clear why we need the Execute
	});
});

globalEnv.def(
	"writeFile",
	function(callback: Function, filename: string, data: Buffer) {
		writeFile(filename, data, function(err) {
			Execute(callback, [false]);
		});
	},
);

globalEnv.def("twice", function(callback: Function, a: any, b: any) {
	callback(a);
	callback(b);
});

////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////

// Remember, parse takes a TokenStream which takes an CharStream:
const ast = time(
	() => parse(tokenStream(charStream(code))),
	"parse code to AST",
);

// Run the evaluator:
// time(() => evaluate(ast, globalEnv), "evaluate code");
// @ts-ignore => we dont need deprecate length:
const args: IArguments = [ast, globalEnv, function(result: unknown): void {
	console.log("Final result =", result);
}];

time(() => Execute(cpsEvaluate, args), "execute code");
