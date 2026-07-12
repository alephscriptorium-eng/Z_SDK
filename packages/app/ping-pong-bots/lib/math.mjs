const MAX_OPERAND = Number(process.env.MATH_MAX_OPERAND || 20);
const OPS = ['+', '-', '*', '/'];
const EXPR_RE = /^\d+\s*[+\-*/]\s*\d+$/;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomExpr() {
  const op = OPS[randInt(0, OPS.length - 1)];
  let a;
  let b;

  if (op === '/') {
    b = randInt(1, MAX_OPERAND);
    const quotient = randInt(1, MAX_OPERAND);
    a = b * quotient;
  } else if (op === '-') {
    a = randInt(1, MAX_OPERAND);
    b = randInt(1, a);
  } else {
    a = randInt(1, MAX_OPERAND);
    b = randInt(1, MAX_OPERAND);
  }

  return `${a} ${op} ${b}`;
}

export function solveExpr(expr) {
  if (!EXPR_RE.test(expr)) {
    throw new Error(`expresión inválida: ${expr}`);
  }

  return eval(expr);
}
