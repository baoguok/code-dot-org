/* jshint
 funcscope: true,
 newcap: true,
 nonew: true,
 shadow: false,
 unused: true,

 maxlen: 90,
 maxparams: 3,
 maxstatements: 200
 */
/* global $ */

var applabMsg = require('./locale');
var dom = require('../dom');
var utils = require('../utils');

var debugArea = module.exports;

/** @type {jQuery} */
var rootDiv_ = null;

/** @type {jQuery} */
var codeTextbox_ = null;

/** @type {boolean} */
var isOpen_ = true;

/** @type {number} */
var lastOpenHeight_ = 100;

/**
 * Configures this debug area controller to operate on the given elements.
 * @param {HTMLDivElement} debugAreaRoot
 * @param {HTMLDivElement} codeTextboxRoot
 */
debugArea.init = function (debugAreaRoot, codeTextboxRoot) {
  if (!debugAreaRoot || !codeTextboxRoot) {
    return;
  }

  rootDiv_ = $(debugAreaRoot);
  codeTextbox_ = $(codeTextboxRoot);
  lastOpenHeight_ = rootDiv_.height;

  bindHandlersForDebugCommandsHeader();
};

/**
 * Binds mouseover, mouseout, click and touch handlers for the debug commands
 * header div.
 */
function bindHandlersForDebugCommandsHeader() {
  var header = rootDiv_.find('#debug-commands-header');
  header.mouseover(onCommandsHeaderOver);
  header.mouseout(onCommandsHeaderOut);
  dom.addClickTouchEvent(header[0], debugArea.slideToggle);
}

/**
 * We do this manually instead of via a simple css :hover because this element
 * can be animated out from under the cursor when sliding open and closed,
 * and the :hover effect isn't removed unless the mouse is moved.
 */
function onCommandsHeaderOver() {
  var header = rootDiv_.find('#debug-commands-header');
  header.addClass('js-hover-hack');
}

/**
 * We do this manually instead of via a simple css :hover because this element
 * can be animated out from under the cursor when sliding open and closed,
 * and the :hover effect isn't removed unless the mouse is moved.
 */
function onCommandsHeaderOut() {
  var header = rootDiv_.find('#debug-commands-header');
  header.removeClass('js-hover-hack');
}

/** @returns {boolean} */
debugArea.isOpen = function () {
  return isOpen_;
};

/** @returns {boolean} */
debugArea.isShut = function () {
  return !isOpen_;
};

/**
 * Open/close the debug area to the reverse of its current state, using no
 * animation.
 */
debugArea.snapToggle = function () {
  if (isOpen_) {
    debugArea.snapShut();
  } else {
    debugArea.snapOpen();
  }
};

debugArea.snapOpen = function () {
  isOpen_ = true;
  setContentsVisible(true);
  setIconPointingDown(true);
  setHeight(lastOpenHeight_);

  // Set the 'clear' button visible
  rootDiv_.find('#clear-console-header')
      .css('opacity', 1)
      .css('visibility', 'visible');
};

debugArea.snapShut = function () {
  isOpen_ = false;
  lastOpenHeight_ = rootDiv_.height();
  setContentsVisible(false);
  setIconPointingDown(false);
  setHeight(getHeightWhenClosed());

  // Set the 'clear' button hidden (not display:none, it should take up space)
  rootDiv_.find('#clear-console-header')
      .css('opacity', 0)
      .css('visibility', 'hidden');
};

/**
 * Open/close the debug area to the reverse of its current state, using a
 * slide animation.
 */
debugArea.slideToggle = function () {
  if (isOpen_) {
    debugArea.slideShut();
  } else {
    debugArea.slideOpen();
  }
};

debugArea.slideOpen = function () {
  isOpen_ = true;
  setContentsVisible(true);

  // Manually remove hover effect at start and end of animation to get *close*
  // to the correct effect.
  onCommandsHeaderOut();
  rootDiv_.animate({
    height: lastOpenHeight_
  },{
    complete: function () {
      setIconPointingDown(true);
      onCommandsHeaderOut();
    }
  });

  // Animate the bottom of the workspace at the same time
  var codeTextbox = $('#codeTextbox');
  codeTextbox.animate({
    bottom: lastOpenHeight_
  },{
    step: utils.fireResizeEvent
  });

  // Animate the 'clear' button appearing at the same time
  var clearButton = rootDiv_.find('#clear-console-header');
  clearButton.css('visibility', 'visible')
  clearButton.animate({
    opacity: 1.0
  });
};

debugArea.slideShut = function () {
  isOpen_ = false;
  lastOpenHeight_ = rootDiv_.height();

  // We will leave the header and resize bar visible, so together they
  // constitute our height when closed.
  var closedHeight = getHeightWhenClosed();
  // Manually remove hover effect at start and end of animation to get *close*
  // to the correct effect.
  onCommandsHeaderOut();
  rootDiv_.animate({
    height: closedHeight
  },{
    complete: function () {
      setContentsVisible(false);
      setIconPointingDown(false);
      onCommandsHeaderOut();
    }
  });

  // Animate the bottom of the workspace at the same time
  codeTextbox_.animate({
    bottom: closedHeight
  },{
    step: utils.fireResizeEvent
  });

  // Animate the 'clear' button vanishing at the same time
  var clearButton = rootDiv_.find('#clear-console-header');
  clearButton.animate({
    opacity: 0.0
  },{
    complete: function () {
      clearButton.css('visibility', 'hidden');
    }
  });
};

function setContentsVisible(isVisible) {
  rootDiv_.find('#debug-commands').toggle(isVisible);
  rootDiv_.find('#debug-console').toggle(isVisible);
}

function setIconPointingDown(isPointingDown) {
  var commandsHeader = rootDiv_.find('#debug-commands-header');

  var icon = commandsHeader.find('#show-hide-debug-icon');
  icon.toggleClass('fa-chevron-circle-up', !isPointingDown);
  icon.toggleClass('fa-chevron-circle-down', isPointingDown);

  var headerText = commandsHeader.find('.header-text');
  headerText.text(isPointingDown ? applabMsg.debugCommandsHeaderWhenOpen() :
      applabMsg.debugCommandsHeaderWhenClosed());

}

function setHeight(newHeightInPixels) {
  rootDiv_.height(newHeightInPixels);
  codeTextbox_.css('bottom', newHeightInPixels);
  utils.fireResizeEvent();
}

function getHeightWhenClosed() {
  return rootDiv_.find('#debug-area-header').height() +
      rootDiv_.find('#debugResizeBar').height();
}
