export class Enviroment {
	parent: Readonly<Enviroment | null>;
	variables: Record<string, unknown>;

	/////////////////////////////////////////////////

	constructor(parent: Enviroment | null = null) {
		this.variables = Object.create(parent ? parent.variables : null);
		this.parent = parent;
	}

	/////////////////////////////////////////////////

	/** To create a subscope */
	extend = () => new Enviroment(this);

	/////////////////////////////////////////////////

	/** To find the scope where the variable with the given name is defined */
	lookup(name: string): Enviroment | null {
		let scope: Enviroment | null = this;

		while (scope) {
			if (Object.hasOwn(scope.variables, name)) return scope;

			scope = scope.parent;
		}

		return null;
	}

	/////////////////////////////////////////////////

	/** To get the current value of a variable. Throws an error if the variable is not defined */
	get(name: string): unknown {
		if (name in this.variables) return this.variables[name];

		throw new Error(`Undefined variable: "${name}".`);
	}

	/////////////////////////////////////////////////

	/** To set the value of a variable. This needs to lookup the actual scope
	 * where the variable is defined. If it's not found and we're not in the
	 * global scope, throws an error
	 */
	set(name: string, value: unknown): void {
		const scope = this.lookup(name);

		// Let's not allow defining globals from a nested environment
		if (!scope && this.parent) throw new Error(`Undefined variable: "${name}".`);

		(scope || this).variables[name] = value;
	}

	/////////////////////////////////////////////////

	/** This creates (or shadows, or overwrites) a variable in the current scope */
	def(name: string, value: unknown): void {
		this.variables[name] = value;
	}
}
