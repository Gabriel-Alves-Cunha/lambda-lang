export const code = `
fib = λ(n) if n < 2 then n
	else fib(n - 1) + fib(n - 2);

log(time(λ() fib(20), "fib(20)"));
log(1 + 2 * 3);
log(50 / 3);

sum = λ(n, ret)
	if n == 0 then ret
	else sum(n - 1, ret + n);

time(λ() log(sum(50000, 0)), "sum");

let loop (n = 0) {
  if n < 10 {
    log(n);
    sleep(250);
    loop(n + 1);
  }
};

let loop (n = 0) {
  if n < 10 {
    log(n);
    sleep(250);
    loop(n + 1);
  }
};

log("And we're done");

copyFile = λ(source, dest) {
  writeFile(dest, readFile(source));
};

copyFile("txt", "bar");

log(2 + twice(3, 4));
log("Done");

`;
