import { performance } from "node:perf_hooks";

export function assertUnreachable(received: never): never {
	const error = stringifyJson(received) ?? received;

	throw new Error(
		"I shouldn't get here (on 'assertUnreachable')!\nreceived = " + error
	);
}

/////////////////////////////////////////////////

export function time<T>(fn: () => T, label: string): T {
	const start = performance.now();

	const fnReturn = fn();

	const end = performance.now();

	dbg(
		`%cFunction %c"${label}" %ctook: ${end - start} ms.`,
		"color:brown",
		"color:blue",
		"color:brown"
	);

	return fnReturn as T;
}

/////////////////////////////////////////////////

export function stringifyJson(obj: unknown): string | undefined {
	return JSON.stringify(
		typeof obj === "function" ? obj.toString() : obj,
		null,
		2
	);
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////

const logParsingToNativeJS =
	// @ts-ignore => This has to be by dot notation:
	process.env.DEBUG?.includes("lambda:parse-js") ?? false;
// @ts-ignore => This has to be by dot notation:
const logDebug = process.env.DEBUG?.includes("lambda:debug") ?? false;
// @ts-ignore => This has to be by dot notation:
const logCps = process.env.DEBUG?.includes("lambda:cps") ?? false;

/////////////////////////////////////////////////

export function log(...args: unknown[]): void {
	if (logParsingToNativeJS)
		console.dir(args, {
			maxStringLength: 1_000,
			maxArrayLength: 40,
			compact: false,
			sorted: false,
			colors: true,
			depth: 10,
		});
}

export function logcps(...args: unknown[]): void {
	if (logCps)
		console.dir(args, {
			maxStringLength: 1_000,
			maxArrayLength: 40,
			compact: false,
			sorted: false,
			colors: true,
			depth: 10,
		});
}

/////////////////////////////////////////////////

export function dbg(...args: unknown[]): void {
	if (logDebug) console.log(...args);
}

dbg("Hello from the debug side!");
