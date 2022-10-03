import {BlockTypes} from '../blockTypes';

export const variablesGet = {
  definition: {
    type: BlockTypes.VARIABLES_GET,
    message0: '%1',
    args0: [
      {
        type: 'field_variable',
        name: 'var',
        variable: 'measure'
      }
    ],
    output: 'Number',
    colour: '24'
  },
  generator: ctx => {
    const code = Blockly.JavaScript.nameDB_.getName(
      ctx.getFieldValue('var'),
      Blockly.Names.NameType.VARIABLE
    );
    return [code, Blockly.JavaScript.ORDER_ATOMIC];
  }
};

export const variablesSet = {
  definition: {
    type: BlockTypes.VARIABLES_SET,
    message0: '%{BKY_VARIABLES_SET}',
    args0: [
      {
        type: 'field_variable',
        name: 'var',
        variable: 'measure'
      },
      {
        type: 'input_value',
        name: 'value',
        check: 'Number'
      }
    ],
    previousStatement: null,
    nextStatement: null,
    colour: '24'
  },
  generator: ctx => {
    // Variable setter.
    const argument0 =
      Blockly.JavaScript.valueToCode(
        ctx,
        'value',
        Blockly.JavaScript.ORDER_ASSIGNMENT
      ) || '0';
    const varName = Blockly.JavaScript.nameDB_.getName(
      ctx.getFieldValue('var'),
      Blockly.Names.NameType.VARIABLE
    );
    return varName + ' = ' + argument0 + ';\n';
  }
};
