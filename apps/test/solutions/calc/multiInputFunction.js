var testUtils = require('../../util/testUtils');
var ResultType = require(testUtils.buildPath('constants.js')).ResultType;
var TestResults = require(testUtils.buildPath('constants.js')).TestResults;
var blockUtils = require(testUtils.buildPath('block_utils'));

var level = {
  // f(x, y) = x + y
  // f(1,2)
  solutionBlocks: '<xml>' +
    '<block type="functional_compute" inline="false" deletable="false" movable="false">' +
    '  <functional_input name="ARG1">' +
    '    <block type="functional_call" inline="false">' +
    '      <mutation name="f">' +
    '        <arg name="x" type="Number"/>' +
    '        <arg name="y" type="Number"/>' +
    '      </mutation>' +
    '      <functional_input name="ARG0">' +
    '        <block type="functional_math_number">' +
    '          <title name="NUM">1</title>' +
    '        </block>' +
    '      </functional_input>' +
    '      <functional_input name="ARG1">' +
    '        <block type="functional_math_number">' +
    '          <title name="NUM">2</title>' +
    '        </block>' +
    '      </functional_input>' +
    '    </block>' +
    '  </functional_input>' +
    '</block>' +
    '<block type="functional_definition" inline="false" uservisible="false">' +
    '  <mutation>' +
    '    <arg name="x" type="Number"/>' +
    '    <arg name="y" type="Number"/>' +
    '    <outputtype>Number</outputtype>' +
    '  </mutation>' +
    '  <title name="NAME">f</title>' +
    '  <functional_input name="STACK">' +
    '    <block type="functional_plus" inline="false" uservisible="false">' +
    '      <functional_input name="ARG1">' +
    '        <block type="functional_parameters_get" uservisible="false">' +
    '          <mutation>' +
    '            <outputtype>Number</outputtype>' +
    '          </mutation>' +
    '          <title name="VAR">x</title>' +
    '        </block>' +
    '      </functional_input>' +
    '      <functional_input name="ARG2">' +
    '        <block type="functional_parameters_get" uservisible="false">' +
    '          <mutation>' +
    '            <outputtype>Number</outputtype>' +
    '          </mutation>' +
    '          <title name="VAR">y</title>' +
    '        </block>' +
    '      </functional_input>' +
    '    </block>' +
    '  </functional_input>' +
    '</block>' +
    '</xml>',
  ideal: Infinity,
  freePlay: false,
};

module.exports = {
  app: "calc",
  skinId: 'calc',
  levelDefinition: level,
  tests: [
    {
      // f(x,y) = x + y
      // f(1,2)
      description: "Correct answer",
      expected: {
        result: ResultType.SUCCESS,
        testResult: TestResults.ALL_PASS
      },
      xml: '<xml>' +
        '<block type="functional_compute" inline="false" deletable="false" movable="false">' +
        '  <functional_input name="ARG1">' +
        '    <block type="functional_call" inline="false">' +
        '      <mutation name="f">' +
        '        <arg name="x" type="Number"/>' +
        '        <arg name="y" type="Number"/>' +
        '      </mutation>' +
        '      <functional_input name="ARG0">' +
        '        <block type="functional_math_number">' +
        '          <title name="NUM">1</title>' +
        '        </block>' +
        '      </functional_input>' +
        '      <functional_input name="ARG1">' +
        '        <block type="functional_math_number">' +
        '          <title name="NUM">2</title>' +
        '        </block>' +
        '      </functional_input>' +
        '    </block>' +
        '  </functional_input>' +
        '</block>' +
        '<block type="functional_definition" inline="false" uservisible="false">' +
        '  <mutation>' +
        '    <arg name="x" type="Number"/>' +
        '    <arg name="y" type="Number"/>' +
        '    <outputtype>Number</outputtype>' +
        '  </mutation>' +
        '  <title name="NAME">f</title>' +
        '  <functional_input name="STACK">' +
        '    <block type="functional_plus" inline="false" uservisible="false">' +
        '      <functional_input name="ARG1">' +
        '        <block type="functional_parameters_get" uservisible="false">' +
        '          <mutation>' +
        '            <outputtype>Number</outputtype>' +
        '          </mutation>' +
        '          <title name="VAR">x</title>' +
        '        </block>' +
        '      </functional_input>' +
        '      <functional_input name="ARG2">' +
        '        <block type="functional_parameters_get" uservisible="false">' +
        '          <mutation>' +
        '            <outputtype>Number</outputtype>' +
        '          </mutation>' +
        '          <title name="VAR">y</title>' +
        '        </block>' +
        '      </functional_input>' +
        '    </block>' +
        '  </functional_input>' +
        '</block>' +
      '</xml>',
    },
    {
      // f(x,y) = x + 5
      // f(1,2)
      description: "Incorrect result",
      expected: {
        result: ResultType.FAILURE,
        testResult: TestResults.LEVEL_INCOMPLETE_FAIL
      },
      xml: '<xml>' +
        '<block type="functional_compute" inline="false" deletable="false" movable="false">' +
        '  <functional_input name="ARG1">' +
        '    <block type="functional_call" inline="false">' +
        '      <mutation name="f">' +
        '        <arg name="x" type="Number"/>' +
        '        <arg name="y" type="Number"/>' +
        '      </mutation>' +
        '      <functional_input name="ARG0">' +
        '        <block type="functional_math_number">' +
        '          <title name="NUM">1</title>' +
        '        </block>' +
        '      </functional_input>' +
        '      <functional_input name="ARG1">' +
        '        <block type="functional_math_number">' +
        '          <title name="NUM">2</title>' +
        '        </block>' +
        '      </functional_input>' +
        '    </block>' +
        '  </functional_input>' +
        '</block>' +
        '<block type="functional_definition" inline="false" uservisible="false">' +
        '  <mutation>' +
        '    <arg name="x" type="Number"/>' +
        '    <arg name="y" type="Number"/>' +
        '    <outputtype>Number</outputtype>' +
        '  </mutation>' +
        '  <title name="NAME">f</title>' +
        '  <functional_input name="STACK">' +
        '    <block type="functional_plus" inline="false" uservisible="false">' +
        '      <functional_input name="ARG1">' +
        '        <block type="functional_parameters_get" uservisible="false">' +
        '          <mutation>' +
        '            <outputtype>Number</outputtype>' +
        '          </mutation>' +
        '          <title name="VAR">x</title>' +
        '        </block>' +
        '      </functional_input>' +
        '      <functional_input name="ARG2">' +
        '        <block type="functional_math_number">' +
        '          <title name="NUM">5</title>' +
        '        </block>' +
        '      </functional_input>' +
        '    </block>' +
        '  </functional_input>' +
        '</block>' +
      '</xml>',
    },
    {
      // f(x,y) = x + 2
      // f(1,2)
      description: "Correct result for compute expression, incorrect result elsewhere",
      expected: {
        result: ResultType.FAILURE,
        testResult: TestResults.APP_SPECIFIC_FAIL
      },
      xml: '<xml>' +
        '<block type="functional_compute" inline="false" deletable="false" movable="false">' +
        '  <functional_input name="ARG1">' +
        '    <block type="functional_call" inline="false">' +
        '      <mutation name="f">' +
        '        <arg name="x" type="Number"/>' +
        '        <arg name="y" type="Number"/>' +
        '      </mutation>' +
        '      <functional_input name="ARG0">' +
        '        <block type="functional_math_number">' +
        '          <title name="NUM">1</title>' +
        '        </block>' +
        '      </functional_input>' +
        '      <functional_input name="ARG1">' +
        '        <block type="functional_math_number">' +
        '          <title name="NUM">2</title>' +
        '        </block>' +
        '      </functional_input>' +
        '    </block>' +
        '  </functional_input>' +
        '</block>' +
        '<block type="functional_definition" inline="false" uservisible="false">' +
        '  <mutation>' +
        '    <arg name="x" type="Number"/>' +
        '    <arg name="y" type="Number"/>' +
        '    <outputtype>Number</outputtype>' +
        '  </mutation>' +
        '  <title name="NAME">f</title>' +
        '  <functional_input name="STACK">' +
        '    <block type="functional_plus" inline="false" uservisible="false">' +
        '      <functional_input name="ARG1">' +
        '        <block type="functional_parameters_get" uservisible="false">' +
        '          <mutation>' +
        '            <outputtype>Number</outputtype>' +
        '          </mutation>' +
        '          <title name="VAR">x</title>' +
        '        </block>' +
        '      </functional_input>' +
        '      <functional_input name="ARG2">' +
        '        <block type="functional_math_number">' +
        '          <title name="NUM">2</title>' +
        '        </block>' +
        '      </functional_input>' +
        '    </block>' +
        '  </functional_input>' +
        '</block>' +
      '</xml>',
    },

    // {
    //   // g(x, y) = x + y
    //   // g(1,2)
    //   description: "User function has a different name",
    //   expected: {
    //     result: ResultType.FAILURE,
    //     testResult: TestResults.LEVEL_INCOMPLETE_FAIL
    //   },
    //   xml: '<xml>' +
    //     '<block type="functional_compute" inline="false" deletable="false" movable="false">' +
    //     '  <functional_input name="ARG1">' +
    //     '    <block type="functional_call" inline="false">' +
    //     '      <mutation name="g">' +
    //     '        <arg name="x" type="Number"/>' +
    //     '        <arg name="y" type="Number"/>' +
    //     '      </mutation>' +
    //     '      <functional_input name="ARG0">' +
    //     '        <block type="functional_math_number">' +
    //     '          <title name="NUM">1</title>' +
    //     '        </block>' +
    //     '      </functional_input>' +
    //     '      <functional_input name="ARG1">' +
    //     '        <block type="functional_math_number">' +
    //     '          <title name="NUM">2</title>' +
    //     '        </block>' +
    //     '      </functional_input>' +
    //     '    </block>' +
    //     '  </functional_input>' +
    //     '</block>' +
    //     '<block type="functional_definition" inline="false" uservisible="false">' +
    //     '  <mutation>' +
    //     '    <arg name="x" type="Number"/>' +
    //     '    <arg name="y" type="Number"/>' +
    //     '    <outputtype>Number</outputtype>' +
    //     '  </mutation>' +
    //     '  <title name="NAME">g</title>' +
    //     '  <functional_input name="STACK">' +
    //     '    <block type="functional_plus" inline="false" uservisible="false">' +
    //     '      <functional_input name="ARG1">' +
    //     '        <block type="functional_parameters_get" uservisible="false">' +
    //     '          <mutation>' +
    //     '            <outputtype>Number</outputtype>' +
    //     '          </mutation>' +
    //     '          <title name="VAR">x</title>' +
    //     '        </block>' +
    //     '      </functional_input>' +
    //     '      <functional_input name="ARG2">' +
    //     '        <block type="functional_parameters_get" uservisible="false">' +
    //     '          <mutation>' +
    //     '            <outputtype>Number</outputtype>' +
    //     '          </mutation>' +
    //     '          <title name="VAR">y</title>' +
    //     '        </block>' +
    //     '      </functional_input>' +
    //     '    </block>' +
    //     '  </functional_input>' +
    //     '</block>' +
    //   '</xml>',
    // },
    {
      // f(x, y) = (x + y) + 0
      // f(1,2,0)
      description: "User function has an extra input",
      expected: {
        result: ResultType.FAILURE,
        testResult: TestResults.LEVEL_INCOMPLETE_FAIL
      },
      xml: '<xml>' +
        '<block type="functional_compute" inline="false" deletable="false" movable="false">' +
        '  <functional_input name="ARG1">' +
        '    <block type="functional_call" inline="false">' +
        '      <mutation name="f">' +
        '        <arg name="x" type="Number"/>' +
        '        <arg name="y" type="Number"/>' +
        '        <arg name="z" type="Number"/>' +
        '      </mutation>' +
        '      <functional_input name="ARG0">' +
        '        <block type="functional_math_number">' +
        '          <title name="NUM">1</title>' +
        '        </block>' +
        '      </functional_input>' +
        '      <functional_input name="ARG1">' +
        '        <block type="functional_math_number">' +
        '          <title name="NUM">2</title>' +
        '        </block>' +
        '      </functional_input>' +
        '      <functional_input name="ARG2">' +
        '        <block type="functional_math_number">' +
        '          <title name="NUM">0</title>' +
        '        </block>' +
        '      </functional_input>' +
        '    </block>' +
        '  </functional_input>' +
        '</block>' +
        '<block type="functional_definition" inline="false" uservisible="false">' +
        '  <mutation>' +
        '    <arg name="x" type="Number"/>' +
        '    <arg name="y" type="Number"/>' +
        '    <arg name="z" type="Number"/>' +
        '    <outputtype>Number</outputtype>' +
        '  </mutation>' +
        '  <title name="NAME">f</title>' +
        '  <functional_input name="STACK">' +
        '    <block type="functional_plus" inline="false" uservisible="false">' +
        '      <block type="functional_plus" inline="false" uservisible="false">' +
        '        <functional_input name="ARG1">' +
        '          <block type="functional_plus" inline="false" uservisible="false">' +
        '            <functional_input name="ARG1">' +
        '              <block type="functional_parameters_get" uservisible="false">' +
        '                <mutation>' +
        '                  <outputtype>Number</outputtype>' +
        '                </mutation>' +
        '                <title name="VAR">x</title>' +
        '              </block>' +
        '            </functional_input>' +
        '            <functional_input name="ARG2">' +
        '              <block type="functional_parameters_get" uservisible="false">' +
        '                <mutation>' +
        '                  <outputtype>Number</outputtype>' +
        '                </mutation>' +
        '                <title name="VAR">y</title>' +
        '              </block>' +
        '            </functional_input>' +
        '          </block>' +
        '        </functional_input>' +
        '        <functional_input name="ARG2">' +
        '          <block type="functional_math_number">' +
        '            <title name="NUM">0</title>' +
        '          </block>' +
        '        </functional_input>' +
        '      </block>' +
        '    </block>' +
        '  </functional_input>' +
        '</block>' +
      '</xml>',
    },
    {
      // f(x,y) = x + 2
      // f(1)
      description: "User function has one less input",
      expected: {
        result: ResultType.FAILURE,
        testResult: TestResults.LEVEL_INCOMPLETE_FAIL
      },
      xml: '<xml>' +
        '<block type="functional_compute" inline="false" deletable="false" movable="false">' +
        '  <functional_input name="ARG1">' +
        '    <block type="functional_call" inline="false">' +
        '      <mutation name="f">' +
        '        <arg name="x" type="Number"/>' +
        '      </mutation>' +
        '      <functional_input name="ARG0">' +
        '        <block type="functional_math_number">' +
        '          <title name="NUM">1</title>' +
        '        </block>' +
        '      </functional_input>' +
        '    </block>' +
        '  </functional_input>' +
        '</block>' +
        '<block type="functional_definition" inline="false" uservisible="false">' +
        '  <mutation>' +
        '    <arg name="x" type="Number"/>' +
        '    <outputtype>Number</outputtype>' +
        '  </mutation>' +
        '  <title name="NAME">f</title>' +
        '  <functional_input name="STACK">' +
        '    <block type="functional_plus" inline="false" uservisible="false">' +
        '      <functional_input name="ARG1">' +
        '        <block type="functional_parameters_get" uservisible="false">' +
        '          <mutation>' +
        '            <outputtype>Number</outputtype>' +
        '          </mutation>' +
        '          <title name="VAR">x</title>' +
        '        </block>' +
        '      </functional_input>' +
        '      <functional_input name="ARG2">' +
        '        <block type="functional_math_number" uservisible="false">' +
        '          <title name="NUM">2</title>' +
        '        </block>' +
        '      </functional_input>' +
        '    </block>' +
        '  </functional_input>' +
        '</block>' +
      '</xml>',
    }

  ]
};
