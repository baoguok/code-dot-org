import React, {useState, useEffect, useRef} from 'react';
import moduleStyles from './dance-ai-modal.module.scss';
import AccessibleDialog from '@cdo/apps/templates/AccessibleDialog';
import Button from '@cdo/apps/templates/Button';
import {useSelector} from 'react-redux';
import {useAppDispatch} from '@cdo/apps/util/reduxHooks';
import {setCurrentAiModalField, DanceState} from '../danceRedux';
import classNames from 'classnames';
import {BlockSvg, Workspace} from 'blockly/core';
import AiGeneratingView from './AiGeneratingView';
import {chooseEffects} from './DanceAiClient';
import AiVisualizationPreview from './AiVisualizationPreview';
import AiBlockPreview from './AiBlockPreview';
import AiExplanationView from './AiExplanationView';
import {AiOutput} from '../types';
const ToggleGroup = require('@cdo/apps/templates/ToggleGroup').default;
import color from '@cdo/apps/util/color';

const aiBotBorder = require('@cdo/static/dance/ai/ai-bot-border.png');
const aiBotBeam = require('@cdo/static/dance/ai/blue-scanner.png');

enum Mode {
  SELECT_INPUTS = 'selectInputs',
  PROCESSING = 'processing',
  GENERATING = 'generating',
  RESULTS = 'results',
  RESULTS_FINAL = 'resultsFinal',
  EXPLANATION = 'explanation',
  CODE = 'code',
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

// adapted from https://overreacted.io/making-setinterval-declarative-with-react-hooks/

//interface RefObject {
//  callback: () => void
//}

function useInterval(callback: () => void, delay: number | undefined) {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    if (delay !== undefined) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
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
  const [badResults, setBadResults] = useState<any>(undefined);
  const [currentPreview, setCurrentPreview] = useState<any>(undefined);
  const [generatingNodesDone, setGeneratingNodesDone] =
    useState<boolean>(false);
  const [processingDone, setProcessingDone] = useState<boolean>(false);
  const [generatingStep, setGeneratingStep] = useState<number>(0);
  const [typingDone, setTypingDone] = useState<boolean>(false);
  const [currentToggle, setCurrentToggle] = useState<string>('ai-block');

  const currentAiModalField = useSelector(
    (state: {dance: DanceState}) => state.dance.currentAiModalField
  );

  const aiOutput = useSelector(
    (state: {dance: DanceState}) => state.dance.aiOutput
  );

  const [showPreview, setShowPreview] = useState<boolean>(false);

  useEffect(() => {
    const currentValue = currentAiModalField?.getValue();

    if (currentValue) {
      setMode(Mode.RESULTS_FINAL);

      // The block value will be set to this JSON.
      setResultJson(currentValue);

      setShowPreview(true);

      setInputs(JSON.parse(currentValue).inputs);
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
    setMode(Mode.RESULTS_FINAL);
    setShowPreview(true);
  };

  const handleShowCode = () => {
    setMode(Mode.CODE);
    setTypingDone(false);
  };

  const handleExplanationClick = () => {
    setMode(Mode.EXPLANATION);
  };

  useInterval(
    () => {
      if (generatingStep < 4) {
        setGeneratingStep(generatingStep + 1);
        console.log('useInterval', generatingStep);
      }
    },
    mode === Mode.GENERATING ? 2000 : undefined
  );

  useEffect(() => {
    if (mode === Mode.GENERATING) {
      if (generatingStep === 0) {
        setCurrentPreview(badResults[0]);
        console.log('preview 0');
      } else if (generatingStep === 1) {
        setCurrentPreview(badResults[1]);
        console.log('preview 1');
      } else if (generatingStep === 2) {
        setCurrentPreview(badResults[2]);
        console.log('preview 2');
      } else if (generatingStep === 3) {
        setCurrentPreview(JSON.parse(resultJson));
        console.log('preview result');
      }
    }
  }, [generatingStep]);

  const handleGenerateClick = () => {
    startAi();
    setMode(Mode.GENERATING);
  };

  const handleRegenerateClick = () => {
    // Reset state
    setTypingDone(false);
    setResultJson('');
    setShowPreview(false);
    setProcessingDone(false);
    setGeneratingNodesDone(false);
    setGeneratingStep(0);
    setCurrentPreview(undefined);

    handleGenerateClick();
  };

  const handleProcessClick = () => {
    setMode(Mode.PROCESSING);
    setTimeout(() => {
      setProcessingDone(true);
    }, 4000);
  };

  const startAi = async () => {
    const result = chooseEffects(inputs, true);
    const fullResult = {inputs, ...result};
    const fullResultJson = JSON.stringify(fullResult);

    // The block value will be set to this JSON.
    setResultJson(fullResultJson);

    const badResultsList: any = [];
    // Grab some bad results too.
    for (let i = 0; i < 3; i++) {
      badResultsList[i] = chooseEffects(inputs, false);
    }
    setBadResults(badResultsList);
  };

  /**
   * Generates blocks from the AI result in the main workspace, and attaches
   * them to each other.
   */
  const generateBlocksFromResult = (
    workspace: Workspace
  ): [BlockSvg, BlockSvg] => {
    //const params = JSON.parse(resultJson);
    const params = currentPreview;
    console.log('generate blocks', params);

    const blocksSvg: [BlockSvg, BlockSvg] = [
      workspace.newBlock('Dancelab_setForegroundEffect') as BlockSvg,
      workspace.newBlock(
        'Dancelab_setBackgroundEffectWithPaletteAI'
      ) as BlockSvg,
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

  const handleLeaveExplanation = () => {
    setMode(Mode.CODE);
    setTypingDone(false);
  };

  const handleStartOverClick = () => {
    setMode(Mode.SELECT_INPUTS);
    setInputs([]);
    setCurrentInputSlot(0);
    setTypingDone(false);
    setResultJson('');
    setShowPreview(false);
    setProcessingDone(false);
    setGeneratingNodesDone(false);
    setGeneratingStep(0);
  };

  const showUseButton =
    mode === Mode.RESULTS_FINAL &&
    currentToggle === 'ai-block' &&
    (aiOutput === AiOutput.AI_BLOCK || aiOutput === AiOutput.BOTH);

  const showConvertButton =
    mode === Mode.RESULTS_FINAL &&
    currentToggle === 'code' &&
    (aiOutput === AiOutput.GENERATED_BLOCKS || aiOutput === AiOutput.BOTH);

  return (
    <AccessibleDialog
      className={moduleStyles.dialog}
      onClose={onClose}
      initialFocus={false}
    >
      <div id="ai-modal-header-area" className={moduleStyles.headerArea}>
        <img src={aiBotBorder} className={moduleStyles.botImage} />
        generate &nbsp;
        <div className={moduleStyles.inputsContainer}>
          {Array.from(Array(SLOT_COUNT).keys()).map(index => (
            <div
              key={index}
              style={{
                backgroundImage:
                  inputs[index] && `url(${getImageUrl(inputs[index])}`,
              }}
              className={moduleStyles.emojiSlot}
              title={getItemName(inputs[index])}
            />
          ))}
        </div>
        &nbsp; effects
        <div
          id="ai-modal-header-area-right"
          className={moduleStyles.headerAreaRight}
        ></div>
      </div>
      <div id="ai-modal-inner-area" className={moduleStyles.innerArea}>
        {mode === Mode.RESULTS_FINAL && (
          <div
            id="toggle-area"
            className={moduleStyles.toggleArea}
            style={{zIndex: mode === Mode.RESULTS_FINAL ? 1 : 0}}
          >
            <ToggleGroup
              selected={currentToggle}
              activeColor={color.teal}
              onChange={(value: string) => {
                setCurrentToggle(value);
              }}
            >
              <button key={0} type="button" value={'ai-block'}>
                AI
              </button>
              <button key={1} type="button" value={'code'}>
                Code
              </button>
            </ToggleGroup>
          </div>
        )}

        <div id="text-area" className={moduleStyles.textArea}>
          {' '}
          {mode === Mode.SELECT_INPUTS
            ? 'Choose three emoji for the mood of the effects.'
            : mode === Mode.PROCESSING && !processingDone
            ? 'A.I. is processing your input.'
            : mode === Mode.PROCESSING && processingDone
            ? 'A.I. is ready to generate effects!'
            : mode === Mode.GENERATING
            ? 'A.I. is generating effects based on the emojis.'
            : mode === Mode.RESULTS
            ? 'A.I. generated effects for your dance party!'
            : mode === Mode.RESULTS_FINAL
            ? 'A.I. generated effects for your dance party!'
            : mode === Mode.EXPLANATION
            ? 'These are the associations between the emojis and this effect.'
            : mode === Mode.CODE
            ? 'This is the internal code that A.I. generated.'
            : undefined}
        </div>

        <div
          id="inputs-area"
          className={moduleStyles.inputsArea}
          style={{zIndex: mode === Mode.SELECT_INPUTS ? 1 : 0}}
        >
          {mode === Mode.SELECT_INPUTS && currentInputSlot < SLOT_COUNT && (
            <div className={moduleStyles.itemContainer}>
              {getAllItems(currentInputSlot).map(
                (item: AiModalReturnedItem) => {
                  return (
                    <button
                      type={'button'}
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
            (mode === Mode.PROCESSING && !processingDone)) && (
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
                      !processingDone &&
                      moduleStyles.beamImageVisible
                  )}
                />
                <img src={aiBotBorder} className={moduleStyles.image} />
              </div>
            </div>
          )}
        </div>

        <div id="generating-area" className={moduleStyles.generatingArea}>
          {/*mode === Mode.GENERATING && (
            <AiGeneratingView
              imageUrls={inputs.map(input => {
                return getImageUrl(input);
              })}
              onComplete={() => {
                setGeneratingNodesDone(true);
              }}
            />
            )*/}
        </div>

        <div id="outputs-area" className={moduleStyles.outputsArea}>
          {mode === Mode.RESULTS_FINAL && currentToggle === 'code' && (
            <div
              id="generating-block-preview"
              className={moduleStyles.blockPreview}
            >
              <AiBlockPreview
                fadeIn={true}
                generateBlocksFromResult={generateBlocksFromResult}
                onComplete={() => {
                  setTypingDone(true);
                }}
              />
            </div>
          )}
        </div>

        {(mode === Mode.GENERATING ||
          (mode === Mode.RESULTS_FINAL && currentToggle === 'ai-block')) &&
          /*showPreview*/ currentPreview && (
            <div
              key={generatingStep}
              id={'preview-area'}
              className={moduleStyles.previewArea}
            >
              <AiVisualizationPreview
                blocks={generateBlocksFromResult(Blockly.getMainWorkspace())}
              />
            </div>
          )}

        {mode === Mode.EXPLANATION && (
          <div id="explanation-area" className={moduleStyles.explanationArea}>
            <AiExplanationView
              inputs={inputs}
              result={JSON.parse(resultJson)}
            />
          </div>
        )}

        <div id="buttons-area" className={moduleStyles.buttonsArea}>
          <div id="buttons-area-left" className={moduleStyles.buttonsAreaLeft}>
            {mode === Mode.RESULTS_FINAL && (
              <div>
                <Button
                  id="start-over-button"
                  text={'Start over'}
                  onClick={handleStartOverClick}
                  color={Button.ButtonColor.white}
                  className={classNames(moduleStyles.button)}
                />
                <Button
                  id="regenerate"
                  text={'Regenerate'}
                  onClick={handleRegenerateClick}
                  color={Button.ButtonColor.white}
                  className={classNames(moduleStyles.button)}
                />
              </div>
            )}

            {/*mode === Mode.CODE && (
              <Button
                id="back-to-effects"
                text={'Back to effects'}
                onClick={handleResultsClick}
                color={Button.ButtonColor.brandSecondaryDefault}
                className={classNames(moduleStyles.button)}
              />
            )*/}

            {mode === Mode.EXPLANATION && (
              <Button
                id="results-final-button"
                text={'Back to Code'}
                onClick={handleLeaveExplanation}
                color={Button.ButtonColor.brandSecondaryDefault}
                className={moduleStyles.button}
              />
            )}
          </div>

          {mode === Mode.SELECT_INPUTS && currentInputSlot >= SLOT_COUNT && (
            <Button
              id="select-all-sections-button"
              text={'Process'}
              onClick={handleProcessClick}
              color={Button.ButtonColor.brandSecondaryDefault}
              className={moduleStyles.button}
            />
          )}

          {mode === Mode.PROCESSING && processingDone && (
            <Button
              id="generate-button"
              text={'Generate'}
              onClick={() => {
                handleGenerateClick();
              }}
              color={Button.ButtonColor.brandSecondaryDefault}
              className={moduleStyles.button}
            />
          )}

          {mode === Mode.GENERATING && generatingStep >= 4 && (
            <Button
              id="results-button"
              text={'Show effects'}
              onClick={handleResultsClick}
              color={Button.ButtonColor.brandSecondaryDefault}
              className={moduleStyles.button}
            />
          )}
          {/*showConvertButton && mode === Mode.RESULTS_FINAL && (
            <Button
              id="view-code-button"
              text={'Show code'}
              onClick={handleShowCode}
              color={Button.ButtonColor.white}
              className={moduleStyles.button}
            />
          )*/}

          {/*mode === Mode.CODE && typingDone && (
            <Button
              id="explanation-button"
              text={'Explanation'}
              onClick={handleExplanationClick}
              color={Button.ButtonColor.white}
              className={moduleStyles.button}
            />
          )*/}

          {showConvertButton && currentToggle === 'code' && typingDone && (
            <Button
              id="convert-button"
              text={'Use this code'}
              onClick={handleConvertBlocks}
              color={Button.ButtonColor.brandSecondaryDefault}
              className={moduleStyles.button}
            />
          )}
          {showUseButton && currentToggle === 'ai-block' && (
            <Button
              id="use-button"
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
