import { readFile, writeFile } from "node:fs";
import { performance } from "node:perf_hooks";

import { globalEnv } from "./globalEnv.js";
import { exec } from "@enviroment/guard.js";
import { dbg } from "@utils/utils.js";

////////////////////////////////////////////////

globalEnv.def(
	"time",
	function time(callback: Function, func: Function, label: string): void {
		const start = performance.now();
		func(function (ret: any) {
			const time = performance.now() - start;

			dbg(
				`%cFunction %c"${label}" %ctook: ${time} ms.`,
				"color:brown",
				"color:blue",
				"color:brown"
			);

			callback(ret);
		});
	}
);

////////////////////////////////////////////////

// define the "log" primitive function
globalEnv.def("log", function log(callback: Function, ...args: any[]) {
	console.log(...args);
	callback(false); // call the continuation with some return value
	// if we don't call it, the program would stop
	// abruptly after a log!
});
////////////////////////////////////////////////

// define the "print" primitive function
globalEnv.def("print", function print(callback: Function, ...args: any[]) {
	args.forEach(arg => process.stdout.write(String(arg)));
	callback(false); // call the continuation with some return value
	// if we don't call it, the program would stop
	// abruptly after a log!
});

////////////////////////////////////////////////

globalEnv.def("halt", function halt(_callback: Function): void {});

////////////////////////////////////////////////

globalEnv.def(
	"sleep",
	function sleep(callback: Function, milliseconds: number): void {
		setTimeout(function (): void {
			exec(callback, [false]);
		}, milliseconds);
	}
);

////////////////////////////////////////////////

globalEnv.def(
	"readFile",
	function readFile_(callback: Function, filename: string): void {
		readFile(filename, function (err, data): void {
			if (err) throw err;

			// error handling is a bit more complex, ignoring for now
			exec(callback, [data]); // hope it's clear why we need the Execute
		});
	}
);

////////////////////////////////////////////////

globalEnv.def(
	"writeFile",
	function writeFile_(
		callback: Function,
		filename: string,
		data: Buffer
	): void {
		writeFile(filename, data, function (err): void {
			if (err) throw err;

			exec(callback, [false]);
		});
	}
);

////////////////////////////////////////////////

globalEnv.def(
	"twice",
	function twice(callback: Function, a: unknown, b: unknown) {
		callback(a);
		callback(b);
	}
);

////////////////////////////////////////////////

globalEnv.def(
	"call-with-current-continuation",
	/** So far we managed to play with fire only by writing
	 * primitive functions (in JS). There isn't a way to
	 * intercept the current continuation from the λanguage.
	 * The CallCC primitive fills this gap. The name is an
	 * abbreviation for Scheme's call-with-current-continuation
	 * (which is also commonly spelled call/cc in Scheme). It
	 * "reifies" the current continuation into a function that
	 * can be called directly from the new λanguage. That
	 * function will ignore its own continuation (discarded)
	 * and will invoke instead the original continuation that
	 * CallCC had.
	 *
	 * Using this tool we can implement (directly in λanguage,
	 * not as primitives!) a wide range of control operators
	 * that were previously unthinkable, from exceptions to
	 * return. Let's start with the latter.
	 */
	function callWitCurrentContinuation(callback: Function, fn: Function): void {
		fn(
			callback,
			function currentContinuation(_discarded: Function, ret: unknown): void {
				callback(ret);
			}
		);
	}
);

////////////////////////////////////////////////
