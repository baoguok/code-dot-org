/** @file Redux action-creators for App Lab.
 *  @see http://redux.js.org/docs/basics/Actions.html */
// Strict linting: Absorb into global config when possible
/* jshint
 unused: true,
 eqeqeq: true,
 maxlen: 120
 */
'use strict';

/** @enum {string} */
var ActionType = module.exports.ActionType = {
  CHANGE_SCREEN: 'CHANGE_SCREEN',
  SET_LEVEL_PROPS: 'SET_LEVEL_PROPS',
  CHANGE_MODE: 'CHANGE_MODE'
};

/**
 * Push lots of view properties of the level into the store.
 * Should be called during level init.
 * Any properties omitted from the props argument are not set in the state.
 *
 * @param {!Object} props
 * @param {function} [props.assetUrl] - Helper function for retrieving
 *        assets for this particular level type.
 * @param {boolean} [props.isDesignModeHidden] - Whether the level restricts
 *        use of design mode.
 * @param {boolean} [props.isEmbedView] - Whether the level is being embedded
 *        in an iFrame.
 * @param {boolean} [props.isReadOnlyWorkspace] - Whether the loaded level
 *        should restrict editing the student code.
 * @param {boolean} [props.isShareView] - Whether we are displaying the level
 *        on a share page.
 * @param {boolean} [props.isViewDataButtonHidden] - Whether to hide the view
 *        data button from the playspace header.
 *
 * @returns {{type: ActionType, props: Object}}
 */
module.exports.setInitialLevelProps = function (props) {
  return {
    type: ActionType.SET_LEVEL_PROPS,
    props: props
  };
};

/**
 * Change the view mode between Design Mode and Code Mode
 * @param {!ApplabMode} mode
 * @returns {{type: ActionType, mode: ApplabMode}}
 */
module.exports.changeMode = function (mode) {
  return {
    type: ActionType.CHANGE_MODE,
    mode: mode
  };
};

/**
 * Change the active app screen while designing the app.
 * Note: Runtime screen changes are a separate operation, currently handled
 * in applab.js
 * @param {!string} screenId
 * @returns {{type: ActionType, screenId: string}}
 */
module.exports.changeScreen = function (screenId) {
  return {
    type: ActionType.CHANGE_SCREEN,
    screenId: screenId
  };
};
