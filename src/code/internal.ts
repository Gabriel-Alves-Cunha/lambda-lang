export const internal = `
# cons takes two values (a, b) and returns a function
# that closes over them. That function is the "cell object".
# It takes a function argument (f) and calls it with
# both the values it stored.
# cons = λ(a, b) λ(fn) fn(a, b);

# Improved version:
cons = λ(head, tail)
	λ(a, i, replacement)
		if a == "get" then
			if i == 0 then head else tail
		else if i == 0 then head = replacement
			else tail = replacement;

# car takes a "cell object" (so, that function) and
# calls it with a function that receives two arguments
# and returns the first one.
# car = λ(cell) cell(λ(a, b) a);

# Improved version:
car = λ(cell) cell("get", 0);
cdr = λ(cell) cell("get", 1);

set-car = λ(cell, val) cell("set", 0, val);
set-cdr = λ(cell, val) cell("set", 1, val);

# cdr is like car, but the function it sends to the
# cell returns the second argument.
# cdr = λ(cell) cell(λ(a, b) b);

# null mimics a cell, in that it's a function which
# takes one function argument (f) but always calls
# it with two null-s (so, both car(null) and cdr(null)
# will equal null).
# null = λ(fn) fn(null, null);

# On the improved version, null can be a real cons this time:
null = cons(0, 0);
set-car(null, null);
set-cdr(null, null);

#########################################################

for-each = λ(list, fn)
	if list != null {
		fn(car(list));

		for-each(cdr(list), fn);
	};

#########################################################

range = λ(a, b)
	if a <= b then cons(a, range(a + 1, b))
	else null;

#########################################################
#########################################################
#########################################################

x = cons(10, 20);
log(car(x));
log(cdr(x));

x = cons(1, cons(2, cons(3, cons(4, cons(5, null)))));
# log(car(x));                      # 1
# log(car(cdr(x)));                 # 2  in Lisp this is abbrev. cadr
# log(car(cdr(cdr(x))));            # 3                          caddr
# log(car(cdr(cdr(cdr(x)))));       # 4                          cadddr
# log(car(cdr(cdr(cdr(cdr(x))))));  # 5  but no abbreviation for this one.

for-each(x, log);

# print the squares of 1..8
for-each(range(1, 8), λ(x) log(x * x));

x = cons(1, 2);
log(car(x));
log(cdr(x));
set-car(x, 10);
set-cdr(x, 20);
log(car(x));
log(cdr(x));

`;
