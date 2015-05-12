var testUtils = require('../../util/testUtils');
var TestResults = require('@cdo/apps/constants.js').TestResults;

module.exports = {
  app: "maze",
  levelFile: "levels",
  levelId: "2_13",
  tests: [
    {
      description: "Verify solution",
      expected: {
        result: true,
        testResult: TestResults.ALL_PASS
      },
      xml: '<xml><block type="maze_forever" deletable="false" editable="false"><statement name="DO"><block type="maze_moveForward" deletable="false" editable="false"><next><block type="maze_if" deletable="false" editable="false"><title name="DIR">isPathLeft</title><statement name="DO"><block type="maze_turn"><title name="DIR">turnLeft</title></block></statement></block></next></block></statement></block></xml>'
    }
  ]
};
