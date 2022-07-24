import { makeEnviroment } from "./Enviroment";
import { tokenStream } from "./token-stream";
import { charStream } from "./token-stream/char-stream";
import { evaluate } from "./Enviroment/evaluate";
import { internal } from "./code/internal";
import { parse } from "./parser";
import { time } from "./utils/utils";

////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////

// Remember, parse takes a TokenStream which takes an CharStream:
const ast = time(
	() => parse(tokenStream(charStream(internal))),
	"parse(internal)",
);

// Create the global environment:
const globalEnv = makeEnviroment("global");

////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////

// Define the `log` primitive function:
globalEnv.def("log", function(...args: any[]) {
	console.log(...args);
});

// Defining the `print` primitive function:
globalEnv.def("print", function(...args: any[]) {
	process.stdout.write(args.join(" "));
});

globalEnv.def("fibJS", function fibJS(n: number): number {
	if (n < 2) return n;
	return fibJS(n - 1) + fibJS(n - 2);
});

globalEnv.def("time", function time<T>(fn: () => T, label: string): T {
	const start = performance.now();

	const fnReturn = fn();

	const end = performance.now();

	console.log(
		`%cFunction %c"${label}" %ctook: ${end - start} ms.`,
		"color:brown",
		"color:blue",
		"color:brown",
	);

	return fnReturn as T;
});

////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////

// Run the evaluator:
time(() => evaluate(ast, globalEnv), "evaluate code"); // Should log `5`.
