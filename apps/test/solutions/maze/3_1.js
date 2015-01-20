var testUtils = require('../../util/testUtils');
var TestResults = require(testUtils.buildPath('constants.js')).TestResults;

var reqBlocks = function () {
  // stick this inside a function so that it's only loaded when needed
  return require('../../util/testUtils').requireWithGlobalsCheckBuildFolder('maze/requiredBlocks.js');
};

module.exports = {
  app: "maze",
  levelFile: "levels",
  levelId: "3_1",
  tests: [
    {
      description: "Verify solution",
      editCode: true,
      expected: {
        result: true,
        testResult: TestResults.ALL_PASS
      },
      xml: 'moveForward();moveForward();moveForward();'
    },
    {
      description: "Single move forward block",
      editCode: true,
      expected: {
        result: false,
        testResult: TestResults.TOO_FEW_BLOCKS_FAIL
      },
      xml: 'moveForward();'
    }
  ]
};
