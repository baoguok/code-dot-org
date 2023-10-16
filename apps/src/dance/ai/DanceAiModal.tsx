import React, {useState, useEffect} from 'react';
import moduleStyles from './dance-ai-modal.module.scss';
import AccessibleDialog from '@cdo/apps/templates/AccessibleDialog';
import Button from '@cdo/apps/templates/Button';
import {useSelector} from 'react-redux';
import {useAppDispatch} from '@cdo/apps/util/reduxHooks';
import {setCurrentAiModalField, DanceState} from '../danceRedux';
import {StrongText} from '@cdo/apps/componentLibrary/typography';
import classNames from 'classnames';
import {BlockSvg, Workspace} from 'blockly/core';
import {doAi} from './utils';
import AiGeneratingView from './AiGeneratingView';
import AiVisualizationPreview from './AiVisualizationPreview';
import AiBlockPreview from './AiBlockPreview';
import {AiOutput} from '../types';

const aiBotBorder = require('@cdo/static/dance/ai/ai-bot-border.png');
const aiBotBeam = require('@cdo/static/dance/ai/blue-scanner.png');

const promptString = 'Generate a scene using this mood:';

enum Mode {
  SELECT_INPUTS = 'selectInputs',
  PROCESSING = 'processing',
  GENERATING = 'generating',
  RESULTS = 'results',
  RESULTS_FINAL = 'resultsFinal',
}

type AiModalItem = {
  id: string;
  name: string;
};

type AiModalReturnedItem = {
  id: string;
  name: string;
  url: string;
  available: boolean;
};

interface DanceAiProps {
  onClose: () => void;
}

const DanceAiModal: React.FunctionComponent<DanceAiProps> = ({onClose}) => {
  const dispatch = useAppDispatch();

  const SLOT_COUNT = 3;

  const inputLibraryFilename = 'ai-inputs';
  const inputLibrary = require(`@cdo/static/dance/ai/${inputLibraryFilename}.json`);

  const [mode, setMode] = useState(Mode.SELECT_INPUTS);
  const [currentInputSlot, setCurrentInputSlot] = useState(0);
  const [inputs, setInputs] = useState<string[]>([]);
  const [resultJson, setResultJson] = useState<string>('');
  const [generatingNodesDone, setGeneratingNodesDone] =
    useState<boolean>(false);
  const [generatingDone, setGeneratingDone] = useState<boolean>(false);
  const [typingDone, setTypingDone] = useState<boolean>(false);

  const currentAiModalField = useSelector(
    (state: {dance: DanceState}) => state.dance.currentAiModalField
  );

  const aiOutput = useSelector(
    (state: {dance: DanceState}) => state.dance.aiOutput
  );

  const [showPreview, setShowPreview] = useState<boolean>(false);

  useEffect(() => {
    const currentValue = currentAiModalField?.getValue();
    console.log(currentValue);

    if (currentValue) {
      setMode(Mode.RESULTS_FINAL);

      // The block value will be set to this JSON.
      setResultJson(currentValue);

      setShowPreview(true);
    }
  }, [currentAiModalField]);

  const getImageUrl = (id: string) => {
    return `/blockly/media/dance/ai/emoji/${id}.svg`;
  };

  const getAllItems = (slotIndex: number) => {
    if (slotIndex >= SLOT_COUNT) {
      return [];
    }

    return inputLibrary.items.map((item: AiModalItem) => {
      return {
        id: item.id,
        name: item.name,
        url: getImageUrl(item.id),
        available: !inputs.includes(item.id),
      };
    });
  };

  const getItemName = (id: string) => {
    return inputLibrary.items.find(
      (item: AiModalReturnedItem) => item.id === id
    )?.name;
  };

  const handleItemClick = (id: string) => {
    if (currentInputSlot < SLOT_COUNT) {
      setInputs([...inputs, id]);
      setCurrentInputSlot(currentInputSlot + 1);
    }
  };

  const handleResultsClick = () => {
    setMode(Mode.RESULTS);
  };

  const handleProcessClick = () => {
    const inputNames = inputs.map(
      input =>
        inputLibrary.items.find((item: AiModalItem) => item.id === input).name
    );
    const request = `${promptString} ${inputNames.join(', ')}.`;
    startAi(inputs, request);
    setMode(Mode.PROCESSING);
  };

  const handleGenerateClick = () => {
    setMode(Mode.GENERATING);
  };

  const startAi = async (inputs: string[], value: string) => {
    const resultJsonString = await doAi(value);
    const result = JSON.parse(resultJsonString);

    // "Pick" a subset of fields to be used.  Specifically, we exclude the
    // explanation, since we don't want it becoming part of the code.
    const pickedResult = (({
      backgroundEffect,
      backgroundColor,
      foregroundEffect,
    }) => ({
      backgroundEffect,
      backgroundColor,
      foregroundEffect,
    }))(result);

    const fullResult = {inputs, ...pickedResult};

    const fullResultJson = JSON.stringify(fullResult);

    // The block value will be set to this JSON.
    setResultJson(fullResultJson);
  };

  /**
   * Generates blocks from the AI result in the main workspace, and attaches
   * them to each other.
   */
  const generateBlocksFromResult = (
    workspace: Workspace
  ): [BlockSvg, BlockSvg] => {
    const params = JSON.parse(resultJson);

    const blocksSvg: [BlockSvg, BlockSvg] = [
      workspace.newBlock('Dancelab_setForegroundEffect') as BlockSvg,
      workspace.newBlock('Dancelab_setBackgroundEffectWithPalette') as BlockSvg,
    ];

    // Foreground block.
    blocksSvg[0].setFieldValue(params.foregroundEffect, 'EFFECT');

    // Background block.
    blocksSvg[1].setFieldValue(params.backgroundEffect, 'EFFECT');
    blocksSvg[1].setFieldValue(params.backgroundColor, 'PALETTE');

    // Connect the blocks.
    blocksSvg[0].nextConnection.connect(blocksSvg[1].previousConnection);

    return blocksSvg;
  };

  const handleConvertBlocks = () => {
    const blocksSvg = generateBlocksFromResult(Blockly.getMainWorkspace());

    const origBlock = currentAiModalField?.getSourceBlock();

    if (origBlock && currentAiModalField) {
      if (!origBlock.getPreviousBlock()) {
        // This block isn't attached to anything at all.
        const blockXY = origBlock.getRelativeToSurfaceXY();
        blocksSvg[0].moveTo(blockXY);
      } else if (!origBlock?.getPreviousBlock()?.nextConnection) {
        // origBlock is the first input (for example, to a setup block),
        // without a regular code block above it.
        origBlock
          ?.getPreviousBlock()
          ?.getInput('DO')
          ?.connection?.connect(blocksSvg[0].previousConnection);
      } else {
        // origBlock has a regular block above it.
        origBlock
          ?.getPreviousBlock()
          ?.nextConnection?.connect(blocksSvg[0].previousConnection);
      }

      origBlock
        ?.getNextBlock()
        ?.previousConnection?.connect(blocksSvg[1].nextConnection);

      blocksSvg.forEach(blockSvg => {
        blockSvg.initSvg();
        blockSvg.render();
      });

      origBlock.dispose(false);

      // End modal.
      dispatch(setCurrentAiModalField(undefined));
    }
  };

  const handleUseClick = () => {
    currentAiModalField?.setValue(resultJson);
    dispatch(setCurrentAiModalField(undefined));
  };

  const handleStartOverClick = () => {
    setMode(Mode.SELECT_INPUTS);
    setInputs([]);
    setCurrentInputSlot(0);
    setTypingDone(false);
    setResultJson('');
    setShowPreview(false);
    setGeneratingNodesDone(false);
    setGeneratingDone(false);
  };

  let showConvertButton = false;
  let showUseButton = false;

  if ((mode === Mode.RESULTS && typingDone) || mode === Mode.RESULTS_FINAL) {
    if (aiOutput === AiOutput.GENERATED_BLOCKS || aiOutput === AiOutput.BOTH) {
      showConvertButton = true;
    }
    if (aiOutput === AiOutput.AI_BLOCK || aiOutput === AiOutput.BOTH) {
      showUseButton = true;
    }
  }

  return (
    <AccessibleDialog
      className={moduleStyles.dialog}
      onClose={onClose}
      initialFocus={false}
    >
      <div id="ai-modal-inner-area" className={moduleStyles.innerArea}>
        <div id="text-area" className={moduleStyles.textArea}>
          <StrongText>
            {' '}
            {mode === Mode.SELECT_INPUTS
              ? 'Choose three emoji for the mood of the stage.'
              : mode === Mode.PROCESSING && resultJson === ''
              ? 'The AI is processing your input.'
              : mode === Mode.PROCESSING && resultJson !== ''
              ? 'The AI is ready to generate a stage!'
              : mode === Mode.GENERATING
              ? 'The AI is generating results.'
              : mode === Mode.RESULTS && !typingDone
              ? 'The AI is showing results.'
              : mode === Mode.RESULTS && typingDone
              ? 'This is the stage generated by the AI.'
              : mode === Mode.RESULTS_FINAL
              ? 'This was the stage generated by the AI.'
              : undefined}
          </StrongText>
        </div>

        <div
          id="inputs-area"
          className={moduleStyles.inputsArea}
          style={{zIndex: mode === Mode.SELECT_INPUTS ? 1 : 0}}
        >
          {mode === Mode.SELECT_INPUTS && currentInputSlot < SLOT_COUNT && (
            <div className={moduleStyles.itemContainer}>
              {getAllItems(currentInputSlot).map(
                (item: AiModalReturnedItem, index: number) => {
                  return (
                    <div
                      tabIndex={
                        index === 0 && currentInputSlot === 0 ? 0 : undefined
                      }
                      key={item.id}
                      onClick={() => item.available && handleItemClick(item.id)}
                      style={{
                        backgroundImage: `url(${item.url})`,
                      }}
                      className={classNames(
                        moduleStyles.item,
                        item.available && moduleStyles.itemAvailable
                      )}
                      title={item.name}
                    />
                  );
                }
              )}
            </div>
          )}
        </div>

        <div
          id="prompt-area"
          className={moduleStyles.promptArea}
          style={{
            zIndex:
              mode === Mode.SELECT_INPUTS || mode === Mode.PROCESSING ? 1 : 0,
          }}
        >
          {(mode === Mode.SELECT_INPUTS ||
            (mode === Mode.PROCESSING && resultJson === '')) && (
            <div className={moduleStyles.prompt}>
              {Array.from(Array(SLOT_COUNT).keys()).map(index => {
                return (
                  <div key={index} className={moduleStyles.inputContainer}>
                    {index === currentInputSlot && (
                      <div
                        className={classNames(
                          moduleStyles.arrowDown,
                          currentInputSlot === 0 &&
                            moduleStyles.arrowDownFirstAppear
                        )}
                      >
                        &nbsp;
                      </div>
                    )}
                    <div className={moduleStyles.inputBackground}>&nbsp;</div>

                    {inputs[index] && (
                      <div
                        style={{
                          backgroundImage: `url(${getImageUrl(inputs[index])}`,
                        }}
                        className={moduleStyles.inputItem}
                        title={getItemName(inputs[index])}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div id="bot-area" className={moduleStyles.botArea}>
          {((mode === Mode.SELECT_INPUTS && currentInputSlot >= SLOT_COUNT) ||
            mode === Mode.PROCESSING ||
            mode === Mode.GENERATING ||
            mode === Mode.RESULTS ||
            mode === Mode.RESULTS_FINAL) && (
            <div className={moduleStyles.botContainer}>
              <div
                className={classNames(
                  moduleStyles.bot,
                  mode === Mode.SELECT_INPUTS
                    ? moduleStyles.botAppearCentered
                    : mode === Mode.PROCESSING
                    ? moduleStyles.botScanLeftToRight
                    : mode === Mode.GENERATING
                    ? moduleStyles.botCenterToLeft
                    : mode === Mode.RESULTS || mode === Mode.RESULTS_FINAL
                    ? moduleStyles.botLeft
                    : undefined
                )}
              >
                <img
                  src={aiBotBeam}
                  className={classNames(
                    moduleStyles.beamImage,
                    mode === Mode.PROCESSING &&
                      resultJson === '' &&
                      moduleStyles.beamImageVisible
                  )}
                />
                <img src={aiBotBorder} className={moduleStyles.image} />
              </div>
            </div>
          )}
        </div>

        <div id="generating-area" className={moduleStyles.generatingArea}>
          {mode === Mode.GENERATING && (
            <AiGeneratingView
              imageUrls={inputs.map(input => {
                return getImageUrl(input);
              })}
              onComplete={() => {
                setGeneratingNodesDone(true);
              }}
            />
          )}
        </div>

        <div className={moduleStyles.outputsArea}>
          {((mode === Mode.GENERATING && generatingNodesDone) ||
            mode === Mode.RESULTS ||
            mode === Mode.RESULTS_FINAL) && (
            <div
              id="generating-block-preview"
              className={classNames(
                moduleStyles.blockPreview,
                mode === Mode.GENERATING
                  ? moduleStyles.blockPreviewRight
                  : mode === Mode.RESULTS
                  ? moduleStyles.blockPreviewRightToCenter
                  : undefined
              )}
            >
              <AiBlockPreview
                fadeIn={mode === Mode.GENERATING}
                generateBlocksFromResult={generateBlocksFromResult}
                onComplete={() => {
                  if (mode === Mode.GENERATING) {
                    setGeneratingDone(true);
                  } else if (mode === Mode.RESULTS) {
                    setShowPreview(true);
                    setMode(Mode.RESULTS_FINAL);
                    setTypingDone(true);
                  }
                }}
              />
            </div>
          )}
        </div>

        {showPreview && (
          <div id="preview-area" className={moduleStyles.previewArea}>
            <AiVisualizationPreview
              blocks={generateBlocksFromResult(Blockly.getMainWorkspace())}
            />
          </div>
        )}

        <div id="buttons-area" className={moduleStyles.buttonsArea}>
          {mode === Mode.RESULTS_FINAL && (
            <Button
              id="start-over"
              text={'Start over'}
              onClick={handleStartOverClick}
              color={Button.ButtonColor.brandSecondaryDefault}
              className={classNames(
                moduleStyles.button,
                moduleStyles.buttonLeft
              )}
            />
          )}

          {mode === Mode.SELECT_INPUTS && currentInputSlot >= SLOT_COUNT && (
            <Button
              id="select-all-sections"
              text={'Process'}
              onClick={handleProcessClick}
              color={Button.ButtonColor.brandSecondaryDefault}
              className={moduleStyles.button}
            />
          )}

          {mode === Mode.PROCESSING && resultJson !== '' && (
            <Button
              id="done"
              text={'Generate'}
              onClick={handleGenerateClick}
              color={Button.ButtonColor.brandSecondaryDefault}
              className={moduleStyles.button}
            />
          )}

          {mode === Mode.GENERATING && generatingDone && (
            <Button
              id="done"
              text={'View results'}
              onClick={handleResultsClick}
              color={Button.ButtonColor.brandSecondaryDefault}
              className={moduleStyles.button}
            />
          )}

          {showConvertButton && (
            <Button
              id="convert"
              text={'Convert'}
              onClick={handleConvertBlocks}
              color={Button.ButtonColor.brandSecondaryDefault}
              className={moduleStyles.button}
            />
          )}
          {showUseButton && (
            <Button
              id="use"
              text={'Use'}
              onClick={handleUseClick}
              color={Button.ButtonColor.brandSecondaryDefault}
              className={moduleStyles.button}
            />
          )}
        </div>
      </div>
    </AccessibleDialog>
  );
};

export default DanceAiModal;
