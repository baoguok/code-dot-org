import {TestResults} from '@cdo/apps/constants.js';

const levelDef = {
  map: [
    [
      0x1020000,
      0x1020000,
      0x0000000,
      0x0000000,
      0x0000000,
      0x0000000,
      0x00,
      0x0000000
    ],
    [
      0x1020000,
      0x1020000,
      0x0000000,
      0x0010000,
      0x0020000,
      0x0100000,
      0x00,
      0x0000000
    ],
    [
      0x0000000,
      0x0000000,
      0x0000000,
      0x0000000,
      0x0000000,
      0x0000000,
      0x00,
      0x0000000
    ],
    [
      0x0000000,
      0x0000000,
      0x0000000,
      0x0000010,
      0x0000000,
      0x0000001,
      0x00,
      0x0000000
    ],
    [
      0x0000000,
      0x0000000,
      0x0000000,
      0x0000000,
      0x0000000,
      0x0000000,
      0x00,
      0x0000000
    ],
    [
      0x0000000,
      0x0000000,
      0x0000000,
      0x0100000,
      0x0010000,
      0x0120000,
      0x00,
      0x0000000
    ],
    [
      0x0000000,
      0x1120000,
      0x1120000,
      0x0000000,
      0x0000000,
      0x0000000,
      0x00,
      0x0100000
    ],
    [
      0x0000000,
      0x1120000,
      0x1120000,
      0x0000000,
      0x0000000,
      0x0000000,
      0x00,
      0x0000000
    ]
  ],
  timeoutAfterWhenRun: true
};

export default {
  app: 'studio',
  skinId: 'hoc2015x',
  levelDefinition: levelDef,
  tests: [
    {
      description: 'Star Wars grid-aligned movement',
      xml: `
        <xml>
          <block type="when_run">
            <next>
              <block type="studio_move">
                <title name="DIR">2</title>
                <next>
                  <block type="studio_move">
                    <title name="DIR">2</title>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </xml>`,
      expected: {
        result: true,
        testResult: TestResults.ALL_PASS
      }
    }
  ]
};
