import { tokenStream } from "./token-stream";
import { charStream } from "./token-stream/char-stream";
import { Enviroment } from "./Enviroment";
import { evaluate } from "./Enviroment/evaluate";
import { parse } from "./parser";

// Some test code here:
const code = "sum = lambda(x, y) x + y; log(sum(2, 3));";

// Remember, parse takes a TokenStream which takes an CharStream:
const ast = parse(tokenStream(charStream(code)));

// Create the global environment:
const globalEnv = new Enviroment();

// Define the `log` primite function:
globalEnv.def("log", function(...args: any[]) {
	console.log("log from lambda:", ...args);
});

// Run the evaluator:
evaluate(ast, globalEnv); // Should log `5`.
