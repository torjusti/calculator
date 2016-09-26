var NumberTheory = {};

/**
 * @param {number} n
 * @param {number} k
 */
NumberTheory.binomial = function(n, k) {
  if (n === k) return 1;
  if (k === 1) return n;
  return binomial(n - 1, k) + binomial(n - 1, k - 1);
};

/**
 * Prototype that stores information about a given polynomial.
 * @constructor
 * @param {string|Polynomial} data The polynomial to parse.
 * @return {Polynomial}
 */
function Polynomial(data) {
  // Support providing already existing Polynomials.
  this.polynomial = data instanceof Polynomial ? data.polynomial : data;
}

/**
 * Rank all coefficients in the polynomial and return the largest.
 * @return {number}
 */
Polynomial.prototype.getLargestCoefficient = function() {
  var re = /(\d+)/g, match, max = 0;
  while(match = re.exec(this.getPolynomial()))
    max = Math.max(max, match[1]);
  return max;
};

/**
 * Returns the polynomial as plain text.
 * @return {string}
 */
Polynomial.prototype.getPolynomial = function() {
  return this.polynomial;
};

/**
 * Replaces x for a given value and evaluates the polynomial as a JavaScript expression.
 * @param {number} val The value for x.
 */
Polynomial.prototype.insert = function(val) {
  return eval(this.getPolynomial().replace(/x/g, val.toString()));
};

/**
 * Sigma sum of a polynomial from start to end.
 * @param {number} start The starting index.
 * @param {number} end The ending index.
 */
Polynomial.prototype.sum = function(start, end) {
  var result = 0;
  var i = start;

  while (i <= end) {
    result += this.insert(i);
    i += 1;
  }

  return result;
};

/**
 * Product of a polynomial from start to end.
 * @param {number} start The starting index.
 * @param {number} end The ending index.
 */
Polynomial.prototype.product = function(start, end) {
  var result = start;
  var i = start;

  while (i <= end) {
    result *= this.insert(i);
    i += 1;
  }

  return result;
};

Polynomial.prototype.limit = function(val) {
  // Might consider shrinking dx incrementally to get good approximation.
  // Might also consider limiting from top and bottom of x.
  // Using analysis of dy we should also be able to detect convergence to infinities.
  return this.insert(val + 10e-6);
};

/**
 * To differentiate we just insert an arbitrary small value as the delta x and evaluate it.
 * @param {number} val The value to differentiate for.
 */
Polynomial.prototype.differentiate = function(val) {
  return (this.insert(val + 10e-6) - this.insert(val)) / 10e-6;
};


/**
 * Prototype that stores information about a given equation.
 * @constructor
 * @return {Equation}
 */
function Equation(data) {
  // Support providing already existing Equations.
  data = data instanceof Equation ? data.polynomial : data;
  // Move everything over to the left side of the equation and set equal to zero.
  data = data.replace(/(.*)=(.*)/, '$1-($2)');
  // We internally store equations as a polynomial set equal to zero.
  this.polynomial = new Polynomial(data);
}

/**
 * Evaluates the left side polynomial of the equation.
 */
Equation.prototype.insert = function(val) {
  return this.polynomial.insert(val);
};

/**
 * Solves the equation using Newtons method.
 * @param {number=} errorTreshold The error treshold to stop at.
 * @param {number=} guess The initial guess.
 * @param {number=} maxIterations The max number of iterations before giving up.
 * @return {number}
 */
Equation.prototype.solve = function(errorTreshold, guess, maxIterations) {
  // Set default error treshold value.
  errorTreshold = errorTreshold || 10e-6;

  // Pick largest coefficient as initial guess. It gives some basic
  // understanding over what scale of numbers we are dealing with.
  guess = guess || this.polynomial.getLargestCoefficient();

  // Set default value for maximum number of iterations before timeout.
  maxIterations = maxIterations || 1000;

  // Loop requires number or it will stop prematurely.
  var error = errorTreshold + 1;

  // Store iterations to detect timeouts.
  var iteration = 0;

  // Run iterations of Newtons method.
  while (error >= errorTreshold && iteration <= maxIterations) {
    error = this.insert(guess) / this.polynomial.differentiate(guess);
    guess = guess - error;
    iteration += 1;
  }

  // Return our final guess.
  return guess;
};

/**
 * Manages result blocks in the calculator.
 * @constructor
 * @param {Node} container The container node.
 */
function ResultManager(container) {
  this.container = container;
  this.results = [];
}

/**
 * Adds a new result to the list.
 * @param {string} input
 * @param {*} result
 */
ResultManager.prototype.addResult = function(input, result) {
  this.results.push({
    input: input,
    result: result
  });

  this.appendNode(this.results[this.results.length - 1]);
};

/**
 * Appends a new node.
 * @param {Object} node
 */
ResultManager.prototype.appendNode = function(node) {
  var resultBlock = document.createElement('div');
  resultBlock.className = 'result-block';

  var resultInput = document.createElement('div');
  resultInput.className = 'result-input';
  resultInput.innerHTML = node.input;

  var resultOutput = document.createElement('div');
  resultOutput.className = 'result-output';
  resultOutput.innerHTML = node.result;
  
  resultBlock.appendChild(resultInput);
  resultBlock.appendChild(resultOutput);

  this.container.appendChild(resultBlock);

  this.container.scrollTop = 50 * this.getResultsCount();
};

/**
 * Removes the last node from DOM.
 */
ResultManager.prototype.removeLastNode = function() {
  this.container.removeChild(this.container.lastChild);
};

/**
 * Removes the last node from list and DOM.
 */
ResultManager.prototype.removeLastResult = function() {
  this.removeLastNode();
  this.results.pop();
};

/**
 * Returns the result with a given index.
 * @param {number} i
 */
ResultManager.prototype.getResult = function(i) {
  return this.results[i];
};

/**
 * Returns the number of results.
 * @return {number}
 */
ResultManager.prototype.getResultsCount = function() {
  return this.results.length;
};

// Below is unfortunately frontent glue.

window['solve'] = function(equation) {
  return new Equation(equation).solve();
};

window['limit'] = function(polynomial, number) {
  return new Polynomial(polynomial).limit(number);
};

window['differentiate'] = function(polynomial, point) {
  return new Polynomial(polynomial).differentiate(point);
};

window['binomial'] = NumberTheory.binomial;

window['sum'] = function(polynomial, start, end) {
  return new Polynomial(polynomial).sum(start, end);
};

window['product'] = function(polynomial, start, end) {
  return new Polynomial(polynomial).product(start, end);
};

var input = document.getElementById('calculator-input');
var goButton = document.getElementById('calculator-go');

var Results = new ResultManager(document.getElementById('calculator-output'));

var currentKeyScrollIndex = 0;

function resetCurrentKeyScroll() {
  currentKeyScrollIndex = Results.getResultsCount();
}

/**
 * @param {*} input
 */
function parseInput(val) {
  if (input.value === 'help') {
    input.value = '';
    parseInput("binomial(24,5) // Binomial combinatorics.");
    parseInput("solve('2*x=4') // Equation solving.");
    parseInput("differentiate('Math.pow(x,2)',5) // Numeric differentiation.");
    parseInput("limit('1/(x-1)',2) // Very basic limits.");
    parseInput("sum('2*x',1,10) // Sigma sums.");
    parseInput("product('Math.pow(x,x)',1,10) // Products.");
    parseInput("Math.PI*Math.E // Constants.");
    parseInput("solve('Math.atan2(1,x)=0') // JavaScript intepreter.");
    parseInput("2*2+1+5+99 // Basic math.");
  }

  Results.addResult(val, eval(val));
  input.select();
  currentKeyScrollIndex = Results.getResultsCount();
}

input.addEventListener('keyup', function(e) {
  if (e.keyCode === 13) {
    parseInput(input.value);
    resetCurrentKeyScroll();
  } else if (e.keyCode === 38) {
    if (currentKeyScrollIndex > 0) --currentKeyScrollIndex;
    input.value = Results.getResult(currentKeyScrollIndex).input;
    input.select();
  } else if (e.keyCode === 40) {
    if (currentKeyScrollIndex < Results.getResultsCount() - 1) ++currentKeyScrollIndex;
    input.value = Results.getResult(currentKeyScrollIndex).input;
    input.select();
  }
});

input.addEventListener('keydown', function(e) {
  if (e.keyCode === 8) {
    resetCurrentKeyScroll();
  }
});

input.addEventListener('blur', function() {
  resetCurrentKeyScroll();
});

goButton.addEventListener('click', parseInput);