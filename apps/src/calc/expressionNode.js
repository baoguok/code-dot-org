var utils = require('../utils');
var _ = utils.getLodash();

/**
 * A node consisting of an value, and potentially a set of operands.
 * The value will be either an operator, a string representing a variable, a
 * string representing a functional call, or a number.
 * If args are not ExpressionNode, we convert them to be so, assuming any string
 * represents a variable
 */
var ValueType = {
  ARITHMETIC: 1,
  FUNCTION_CALL: 2,
  VARIABLE: 3,
  NUMBER: 4
};

var ExpressionNode = function (val, args, blockId) {
  this.value = val;
  this.blockId = blockId;
  if (args === undefined) {
    args = [];
  }

  if (!Array.isArray(args)) {
    throw new Error("Expected array");
  }

  this.children = args.map(function (item) {
    if (!(item instanceof ExpressionNode)) {
      item = new ExpressionNode(item);
    }
    return item;
  });

  if (this.getType() === ValueType.NUMBER && args.length > 0) {
    throw new Error("Can't have args for number ExpressionNode");
  }

  if (this.getType() === ValueType.ARITHMETIC && args.length !== 2) {
    throw new Error("Arithmetic ExpressionNode needs 2 args");
  }
};
module.exports = ExpressionNode;

ExpressionNode.ValueType = ValueType;

/**
 * What type of expression node is this?
 */
ExpressionNode.prototype.getType = function () {
  if (["+", "-", "*", "/"].indexOf(this.value) !== -1) {
    return ValueType.ARITHMETIC;
  }

  if (typeof(this.value) === 'string') {
    if (this.children.length === 0) {
      return ValueType.VARIABLE;
    }
    return ValueType.FUNCTION_CALL;
  }

  if (typeof(this.value) === 'number') {
    return ValueType.NUMBER;
  }
};

/**
 * Create a deep clone of this node
 */
ExpressionNode.prototype.clone = function () {
  var children = this.children.map(function (item) {
    return item.clone();
  });
  return new ExpressionNode(this.value, children, this.blockId);
};

/**
 * Can we evaluate this expression given the mapping
 */
// TODO - unit test (test case where mapping[this.value] = 0
ExpressionNode.prototype.canEvaluate = function (mapping) {
  mapping = mapping || {};
  var type = this.getType();
  if (type === ValueType.FUNCTION_CALL) {
    return false;
  }

  if (type === ValueType.VARIABLE) {
    return mapping[this.value] !== undefined;
  }

  for (var i = 0; i < this.children.length; i++) {
    if (!this.children[i].canEvaluate(mapping)) {
      return false;
    }
  }

  return true;
};

/**
 * Evaluate the expression, returning the result.
 */
ExpressionNode.prototype.evaluate = function (mapping) {
  mapping = mapping || {};
  var type = this.getType();

  if (type === ValueType.VARIABLE && mapping[this.value] !== undefined) {
    var clone = this.clone();
    clone.value = mapping[this.value];
    return clone.evaluate(mapping);
  }

  if (type === ValueType.FUNCTION_CALL && mapping[this.value] !== undefined) {
    var functionDef = mapping[this.value];
    if (!functionDef.variables || !functionDef.expression) {
      throw new Error('Bad mapping for: ' + this.value);
    }
    if (functionDef.variables.length !== this.children.length) {
      throw new Error('Bad mapping for: ' + this.value);
    }
    // Generate a new mapping so that if we have collisions between global
    // variables and function variables, the function vars take precedence
    var newMapping = {};
    _.keys(mapping).forEach(function (key) {
      newMapping[key] = mapping[key];
    });
    functionDef.variables.forEach(function (variable, index) {
      newMapping[variable] = this.children[index].value;
    }, this);
    return functionDef.expression.evaluate(newMapping);
  }

  if (type === ValueType.VARIABLE || type === ValueType.FUNCTION_CALL) {
    throw new Error('Must resolve variables/functions before evaluation');
  }
  if (type === ValueType.NUMBER) {
    return this.value;
  }

  if (type !== ValueType.ARITHMETIC) {
    throw new Error('Unexpected error');
  }

  var left = this.children[0].evaluate(mapping);
  var right = this.children[1].evaluate(mapping);

  switch (this.value) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return left / right;
    default:
      throw new Error('Unknown operator: ' + this.value);
    }
};

/**
 * Depth of this node's tree. A lone value is considered to have a depth of 0.
 */
ExpressionNode.prototype.depth = function () {
  var max = 0;
  for (var i = 0; i < this.children.length; i++) {
    max = Math.max(max, 1 + this.children[i].depth());
  }

  return max;
};

/**
 * Gets the deepest descendant operation ExpressionNode in the tree (i.e. the
 * next node to collapse
 */
ExpressionNode.prototype.getDeepestOperation = function () {
  if (this.children.length === 0) {
    return null;
  }

  var deepestChild = null;
  var deepestDepth = 0;
  for (var i = 0; i < this.children.length; i++) {
    var depth = this.children[i].depth();
    if (depth > deepestDepth) {
      deepestDepth = depth;
      deepestChild = this.children[i];
    }
  }

  if (deepestDepth === 0) {
    return this;
  }

  return deepestChild.getDeepestOperation();
};

/**
 * Collapses the next descendant in place. Next is defined as deepest, then
 * furthest left. Returns whether collapse was successful.
 */
ExpressionNode.prototype.collapse = function () {
  var deepest = this.getDeepestOperation();
  if (deepest === null) {
    return false;
  }

  // We're the depest operation, implying both sides are numbers
  if (this === deepest) {
    this.value = this.evaluate();
    this.children = [];
    return true;
  } else {
    return deepest.collapse();
  }
};

/**
 * Get a tokenList for this expression, where differences from other expression
 * are marked
 * @param {ExpressionNode} other The ExpressionNode to compare to.
 */
ExpressionNode.prototype.getTokenListDiff = function (other) {
  var tokens;
  var nodesMatch = other && (this.value === other.value) &&
    (this.children.length === other.children.length);
  var type = this.getType();

  // Empty function calls look slightly different, i.e. foo() instead of foo
  if (this.children.length === 0) {
    return [new Token(this.value.toString(), !nodesMatch)];
  }

  if (type === ValueType.ARITHMETIC) {
    // Deal with arithmetic, which is always in the form (child0 operator child1)
    tokens = [new Token('(', !nodesMatch)];
    if (this.children.length > 0) {
      tokens.push([
        this.children[0].getTokenListDiff(nodesMatch && other.children[0]),
        new Token(" " + this.value + " ", !nodesMatch),
        this.children[1].getTokenListDiff(nodesMatch && other.children[1])
      ]);
    }
    tokens.push(new Token(')', !nodesMatch));

  } else if (type === ValueType.FUNCTION_CALL) {
    // Deal with a function call which will generate something like: foo(1, 2, 3)
    tokens = [
      new Token(this.value, this.value !== other.value),
      new Token('(', !nodesMatch)
    ];

    for (var i = 0; i < this.children.length; i++) {
      if (i > 0) {
        tokens.push(new Token(',', !nodesMatch));
      }
      tokens.push(this.children[i].getTokenListDiff(nodesMatch && other.children[i]));
    }

    tokens.push(new Token(")", !nodesMatch));
  } else if (this.getType() === ValueType.VARIABLE) {

  }
  return _.flatten(tokens);
};


/**
 * Get a tokenList for this expression, potentially marking those tokens
 * that are in the deepest descendant expression.
 * @param {boolean} markDeepest Mark tokens in the deepest descendant
 */
ExpressionNode.prototype.getTokenList = function (markDeepest) {
  var depth = this.depth();
  if (depth <= 1) {
    return this.getTokenListDiff(markDeepest ? null : this);
  }

  if (this.getType() !== ValueType.ARITHMETIC) {
    // Don't support getTokenList for functions
    throw new Error("Unsupported");
  }

  var rightDeeper = this.children[1].depth() > this.children[0].depth();

  return _.flatten([
    new Token('(', false),
    this.children[0].getTokenList(markDeepest && !rightDeeper),
    new Token(" " + this.value + " ", false),
    this.children[1].getTokenList(markDeepest && rightDeeper),
    new Token(')', false)
  ]);
};

/**
 * Is other exactly the same as this ExpressionNode tree.
 */
ExpressionNode.prototype.isIdenticalTo = function (other) {
  if (!other || this.value !== other.value ||
      this.children.length !== other.children.length) {
    return false;
  }

  for (var i = 0; i < this.children.length; i++) {
    if (!this.children[i].isIdenticalTo(other.children[i])) {
      return false;
    }
  }
  return true;
};

/**
 * Returns true if both this and other are calls of the same function, with
 * the same number of arguments
 */
ExpressionNode.prototype.hasSameSignature = function (other) {
  if (!other) {
    return false;
  }

  if (this.getType() !== ValueType.FUNCTION_CALL ||
      other.getType() !== ValueType.FUNCTION_CALL) {
    return false;
  }

  if (this.value !== other.value) {
    return false;
  }

  if (this.children.length !== other.children.length) {
    return false;
  }

  return true;
};

/**
 * Do the two nodes differ only in argument order.
 * TODO: unit test
 */
ExpressionNode.prototype.isEquivalentTo = function (target) {
  // only ignore argument order for ARITHMETIC
  if (this.getType() !== ValueType.ARITHMETIC) {
    return this.isIdenticalTo(target);
  }

  if (!target || this.value !== target.value) {
    return false;
  }

  var myLeft = this.children[0];
  var myRight = this.children[1];

  var theirLeft = target.children[0];
  var theirRight = target.children[1];

  if (myLeft.isEquivalentTo(theirLeft)) {
    return myRight.isEquivalentTo(theirRight);
  }
  if (myLeft.isEquivalentTo(theirRight)) {
    return myRight.isEquivalentTo(theirLeft);
  }
  return false;
};

/**
 * A token is essentially just a string that may or may not be "marked". Marking
 * is done for two different reasons.
 * (1) We're comparing two expressions and want to mark where they differ.
 * (2) We're looking at a single expression and want to mark the deepest
 *     subexpression.
 */
var Token = function (str, marked) {
  this.str = str;
  this.marked = marked;
};
ExpressionNode.Token = Token;
