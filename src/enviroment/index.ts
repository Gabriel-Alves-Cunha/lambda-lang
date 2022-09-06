export function makeEnviroment(
	name = "anonymous lambda",
	parent?: Enviroment
): Enviroment {
	const env: Enviroment = {
		variables: Object.create(parent ? parent.variables : null),
		parent,
		name,

		/////////////////////////////////////////////////

		extend(newId?: string) {
			return makeEnviroment(newId, this);
		},

		/////////////////////////////////////////////////

		lookup(name) {
			let scope: Enviroment | undefined = this;

			while (scope !== undefined) {
				if (Object.hasOwn(scope.variables, name)) return scope;

				scope = scope.parent;
			}

			return undefined;
		},

		/////////////////////////////////////////////////

		get(name: string): unknown {
			if (name in this.variables) return this.variables[name];

			throw new Error(`Undefined variable at 'Enviroment.get(\`${name}\`)'.`);
		},

		/////////////////////////////////////////////////

		set(name: string, value: unknown): void {
			const scope = this.lookup(name);

			// Let's not allow defining globals from a nested environment
			if (scope === undefined && this.parent !== undefined)
				throw new Error(`Undefined variable at 'Enviroment.set(\`${name}\`)'.`);

			(scope ?? this).variables[name] = value;
		},

		/////////////////////////////////////////////////

		def(name: string, value: unknown): void {
			this.variables[name] = value;
		},
	};

	return env;
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
// Types:

export type Enviroment = {
	readonly parent: Readonly<Enviroment | undefined>;
	variables: Record<string, unknown>;
	readonly name: string;

	/** To find the scope where the variable with the given name is defined. */
	lookup(name: string): Enviroment | undefined;
	/** To set the value of a variable. This needs to lookup the actual scope
	 * where the variable is defined. If it's not found and we're not in the
	 * global scope, throws an error.
	 */
	set(name: string, value: unknown): void;
	/** This creates (or shadows, or overwrites) a variable in the current scope. */
	def(name: string, value: unknown): void;
	/** To get the current value of a variable. Throws an error if the variable is not defined. */
	get(name: string): unknown;
	/** To create a subscope. */
	extend(newId?: string): Enviroment;
};
