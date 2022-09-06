let GENERATED_SYMBOLS = 0;

export function generateSymbol(name?: string): string {
	if (!name) name = "anonymous";

	name = "β_" + name + ++GENERATED_SYMBOLS;

	return name;
}
