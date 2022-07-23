export const code = `
log_range = λ(a, b) if a <= b {
  print(a);
  if a + 1 <= b {
    print(", ");
    log_range(a + 1, b);
  };
};

sum = λ(x, y) x + y;

log_range(1, 100);
log(sum(2, 3));
`;
