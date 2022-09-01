import { performance } from "node:perf_hooks";
import debug from "debug";

export function assertUnreachable(received: never): never {
	const error = stringifyJson(received) ?? received;

	throw new Error(
		"I shouldn't get here (on 'assertUnreachable')!\nreceived = " + error,
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
		"color:brown",
	);

	return fnReturn as T;
}

/////////////////////////////////////////////////

export function stringifyJson(obj: unknown): string | undefined {
	return JSON.stringify(
		typeof obj === "function" ? obj.toString() : obj,
		null,
		2,
	);
}

/////////////////////////////////////////////////

export const dbg = debug("lambda:debug");

dbg("Hello to the debug side!");
