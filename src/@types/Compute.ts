export type BuiltIn = Generator | Function | RegExp | Error | Date | {
	readonly [Symbol.toStringTag]: string;
};

export type Key = string | number | symbol;

export type Depth = "flat" | "deep";

/**
 * Check whether `U` contains `U1`.
 * @param U to be inspected
 * @param U1 to check within
 * @returns Boolean
 * @example
 * ```ts
 * ```
 */
export type Has<U extends any, U1 extends any> = [U1] extends [U] ? true
	: false;

/**
 * A List.
 * @param A its type
 * @returns List
 * @example
 * ```ts
 * type list0 = [1, 2, 3]
 * type list1 = number[]
 * ```
 */
export type List<A = any> = ReadonlyArray<A>;

export type Keys<A extends any> = A extends List
	? Exclude<keyof A, keyof any[]> | number
	: keyof A;

// export type Boolean = 0 | 1;

export type If<B extends Boolean, Then, Else = never> = B extends true ? Then
	: Else;

export type ComputeRaw<A extends any> = A extends Function ? A
	: { [K in keyof A]: A[K]; } & unknown;

type ComputeFlat<A extends any> = A extends BuiltIn ? A
	: A extends Array<any>
		? A extends Array<Record<Key, any>>
			? Array<{ [K in keyof A[number]]: A[number][K]; } & unknown>
		: A
	: A extends ReadonlyArray<any>
		? A extends ReadonlyArray<Record<Key, any>>
			? ReadonlyArray<{ [K in keyof A[number]]: A[number][K]; } & unknown>
		: A
	: { [K in keyof A]: A[K]; } & unknown;

type ComputeDeep<A extends any, Seen = never> = A extends BuiltIn ? A
	: If<
		Has<Seen, A>,
		A,
		(A extends Array<any>
			? A extends Array<Record<Key, any>>
				? Array<
					& { [K in keyof A[number]]: ComputeDeep<A[number][K], A | Seen>; }
					& unknown
				>
			: A
			: A extends ReadonlyArray<any>
				? A extends ReadonlyArray<Record<Key, any>>
					? ReadonlyArray<
						& { [K in keyof A[number]]: ComputeDeep<A[number][K], A | Seen>; }
						& unknown
					>
				: A
			: { [K in keyof A]: ComputeDeep<A[K], A | Seen>; } & unknown)
	>;

/**
 * Force TS to load a type that has not been computed (to resolve composed
 * types that TS haven't fully resolved, for display purposes mostly).
 * @param A to compute
 * @returns `A`
 * @example
 * ```ts
 * type test0 = Compute<{x: 'x'} & {y: 'y'}> // {x: 'x', y: 'y'}
 * ```
 */
export type Compute<A extends any, depth extends Depth = "deep"> = {
	flat: ComputeFlat<A>;
	deep: ComputeDeep<A>;
}[depth];
