import { throwAndCatch } from "../internal/throw-catch";

export const simple = throwAndCatch + `
# log_range = λ(a, b) if a <= b {
#   print(a);
#   if a + 1 <= b {
#     print(", ");
#     log_range(a + 1, b);
#   };
# };
# 
# sum = λ(x, y) x + y;
# 
# log_range(1, 100);
# log(sum(2, 3));
# 
# fib = λ(n) if n < 2 then n
# 	else fib(n - 1) + fib(n - 2);
# 
# log(time(λ() fib(20), "fib(20)"));
# log(1 + 2 * 3);
# log(50 / 3);
# 
# sum = λ(n, ret)
# 	if n == 0 then ret
# 	else sum(n - 1, ret + n);
# 
# time(λ() log(sum(50000, 0)), "sum");
# 
# let loop (n = 0) {
#   if n < 10 {
#     log(n);
#     sleep(250);
#     loop(n + 1);
#   }
# };
# 
# log("And we're done");
# 
# copyFile = λ(source, dest) {
#   writeFile(dest, readFile(source));
# };
# 
# copyFile("txt", "bar");
# 
# log(2 + twice(3, 4));
# log("Done");

############################################
############################################
############################################

fail = λ() false;
guess = λ(current) {
  call-with-current-continuation(λ(callback) {
    let (prevFail = fail) {
      fail = λ() {
        current = current + 1;

        if current > 100 {
          fail = prevFail;
          fail();
        } else {
          callback(current);
        };
      };

      callback(current);
    };
  });
};

a = guess(1); # returns a number >= 1
b = guess(a); # returns a number >= a

if a * b == 84 {
  # we have a solution
  print(a);
  print("*");
  log(b);
};

fail(); # go back to the last "guess" and try another value

f1 = λ() {
  throw("foo", "EXIT");
  log("not reached f1");
};

log(catch("foo", λ() {
  f1();
  log("not reached log");
}));

exit = false;
x = 0;

call-with-current-continuation(λ(callback) exit = callback);
## exit() will restart from here...

if x == 0 then catch("foo", λ() {
  log("in catch");
  x = 1;
  exit();
});

log("after catch");

throw("foo", "FOO");

`;
