/* global Applab, dashboard */

// TODO (brent) - make it so that we dont need to specify .jsx. This currently
// works in our grunt build, but not in tests
var DesignWorkspace = require('./DesignWorkspace.jsx');
var DesignToggleRow = require('./DesignToggleRow.jsx');
var showAssetManager = require('./assetManagement/show.js');
var elementLibrary = require('./designElements/library');
var elementUtils = require('./designElements/elementUtils');
var studioApp = require('../StudioApp').singleton;
var _ = require('../utils').getLodash();
var KeyCodes = require('../constants').KeyCodes;

var designMode = module.exports;

var currentlyEditedElement = null;
var currentScreenId = null;

var GRID_SIZE = 5;

/**
 * If in design mode and program is not running, display Properties
 * pane for editing the clicked element.
 * @param event
 */
designMode.onDesignModeVizClick = function (event) {
  if (!Applab.isInDesignMode() ||
      $('#resetButton').is(':visible')) {
    return;
  }
  event.preventDefault();

  var element = event.target;
  if (element.id === 'designModeViz') {
    element = designMode.activeScreen();
  }

  if ($(element).is('.ui-resizable')) {
    element = getInnerElement(element);
  } else if ($(element).is('.ui-resizable-handle')) {
    element = getInnerElement(element.parentNode);
  }
  // give the div focus so that we can listen for keyboard events
  $("#designModeViz").focus();
  designMode.editElementProperties(element);
};

/**
 * @returns {HTMLElement} The currently visible screen element.
 */
designMode.activeScreen = function () {
  return $('#designModeViz .screen').filter(function () {
    return this.style.display !== 'none';
  }).first()[0];
};

/**
 * Create a new element of the specified type within the play space.
 * @param {ElementType} elementType Type of element to create
 * @param {number} left Position from left.
 * @param {number} top Position from top.
 * @returns {HTMLElement} The generated element
 */
designMode.createElement = function (elementType, left, top) {
  var element = elementLibrary.createElement(elementType, left, top);

  var parent;
  var isScreen = $(element).hasClass('screen');
  if (isScreen) {
    parent = document.getElementById('designModeViz');
  } else {
    parent = designMode.activeScreen();
  }
  parent.appendChild(element);

  if (!isScreen) {
    makeDraggable($(element));
  }
  designMode.editElementProperties(element);

  return element;
};

designMode.editElementProperties = function(element) {
  var designPropertiesElement = document.getElementById('design-properties');
  if (!designPropertiesElement) {
    // design-properties won't exist when !user.isAdmin
    return;
  }
  currentlyEditedElement = element;
  designMode.renderDesignWorkspace(element);
};

/**
 * Enable (or disable) dragging of new elements from the element tray
 * @param allowEditing {boolean}
 */
designMode.resetElementTray = function (allowEditing) {
  $('#design-toolbox .new-design-element').each(function() {
    $(this).draggable(allowEditing ? 'enable' : 'disable');
  });
};

/**
 * Given an input value produce a valid css value that is
 * either in pixels or empty.
 */
var appendPx = function (inp) {
  return inp ? inp + 'px' : '';
};

/**
 * Handle a change from our properties table.
 * @param element {Element}
 * @param name {string}
 * @param value {string}
 */
designMode.onPropertyChange = function(element, name, value) {
  designMode.updateProperty(element, name, value);
  designMode.editElementProperties(element);
};

/**
 * After handling properties generically, give elementLibrary a chance
 * to do any element specific changes.
 * @param element
 * @param name
 * @param value
 */
designMode.updateProperty = function(element, name, value) {
  var handled = true;
  switch (name) {
    case 'id':
      elementUtils.setId(element, value);
      if (elementLibrary.getElementType(element) ===
          elementLibrary.ElementType.SCREEN) {
        // rerender design toggle, which has a dropdown of screen ids
        designMode.changeScreen(value);
      }
      break;
    case 'left':
      var newLeft = appendPx(value);
      element.style.left = newLeft;
      element.parentNode.style.left = newLeft;
      break;
    case 'top':
      var newTop = appendPx(value);
      element.style.top = newTop;
      element.parentNode.style.top = newTop;
      break;
    case 'width':
      element.setAttribute('width', appendPx(value));
      break;
    case 'height':
      element.setAttribute('height', appendPx(value));
      break;
    case 'style-width':
      var newWidth = appendPx(value);
      element.style.width = newWidth;
      element.parentNode.style.width = newWidth;

      if (element.style.backgroundSize) {
        element.style.backgroundSize = element.style.width + ' ' +
          element.style.height;
      }
      break;
    case 'style-height':
      var newHeight = appendPx(value);
      element.style.height = newHeight;
      element.parentNode.style.height = newHeight;

      if (element.style.backgroundSize) {
        element.style.backgroundSize = element.style.width + ' ' +
          element.style.height;
      }
      break;
    case 'text':
      element.textContent = value;
      break;
    case 'textColor':
      element.style.color = value;
      break;
    case 'backgroundColor':
      element.style.backgroundColor = value;
      break;
    case 'fontSize':
      element.style.fontSize = appendPx(value);
      break;

    case 'image':
      var image = new Image();
      var backgroundImage = new Image();
      var originalImage = element.style.backgroundImage;
      backgroundImage.src = Applab.maybeAddAssetPathPrefix(value);
      element.setAttribute('data-canonical-image-url', value);
      if (backgroundImage.src !== originalImage) {
        backgroundImage.onload = function() {
          // remove loader so that API calls dont hit this
          element.style.backgroundImage = 'url(' + backgroundImage.src + ')';
          if (originalImage === element.style.backgroundImage) {
            return;
          }
          element.style.backgroundSize = backgroundImage.naturalWidth + 'px ' +
            backgroundImage.naturalHeight + 'px';
          element.style.width = backgroundImage.naturalWidth + 'px';
          element.style.height = backgroundImage.naturalHeight + 'px';
          // Re-render properties
          if (currentlyEditedElement === element) {
            designMode.editElementProperties(element);
          }
        };
      }
      break;

    case 'screen-image':
      // We stretch the image to fit the element
      var width = parseInt(element.style.width, 10);
      var height = parseInt(element.style.height, 10);
      element.style.backgroundImage = 'url(' + Applab.maybeAddAssetPathPrefix(value) + ')';
      element.setAttribute('data-canonical-image-url', value);
      element.style.backgroundSize = width + 'px ' + height + 'px';
      break;

    case 'picture':
      var originalSrc = element.src;
      element.src = Applab.maybeAddAssetPathPrefix(value);
      element.setAttribute('data-canonical-image-url', value);

      if (element.src !== originalSrc) {
        element.onload = function () {
          // naturalWidth/Height aren't populated until image has loaded.
          element.style.width = element.naturalWidth + 'px';
          element.style.height = element.naturalHeight + 'px';
          if ($(element.parentNode).is('.ui-resizable')) {
            element.parentNode.style.width = element.naturalWidth + 'px';
            element.parentNode.style.height = element.naturalHeight + 'px';
          }
          // Re-render properties
          if (currentlyEditedElement === element) {
            designMode.editElementProperties(element);
          }
        };
      }
      break;
    case 'hidden':
      // Add a class that shows as 30% opacity in design mode, and invisible
      // in code mode.
      $(element).toggleClass('design-mode-hidden', value === true);
      break;
    case 'checked':
      // element.checked represents the current state, the attribute represents
      // the serialized state
      element.checked = value;

      if (value) {
        var groupName = element.getAttribute('name');
        if (groupName) {
          // Remove checked attribute from all other radio buttons in group
          var buttons = document.getElementsByName(groupName);
          Array.prototype.forEach.call(buttons, function (item) {
            if (item.type === 'radio') {
              item.removeAttribute('checked');
            }
          });
        }
        element.setAttribute('checked', 'checked');
      } else {
        element.removeAttribute('checked');
      }
      break;
    case 'options':
      // value should be an array of options in this case
      for (var i = 0; i < value.length; i++) {
        var optionElement = element.children[i];
        if (!optionElement) {
          optionElement = document.createElement('option');
          element.appendChild(optionElement);
        }
        optionElement.textContent = value[i];
      }
      // remove any extra options
      for (i = value.length; i < element.children.length; i++) {
        element.removeChild(element.children[i]);
      }
      break;
    case 'groupId':
      element.setAttribute('name', value);
      break;
    case 'placeholder':
      element.setAttribute('placeholder', value);
      break;
    case 'rows':
      element.setAttribute('rows', value);
      break;
    case 'cols':
      element.setAttribute('rows', value);
      break;
    default:
      // Mark as unhandled, but give typeSpecificPropertyChange a chance to
      // handle it
      handled = false;
  }

  if (elementLibrary.typeSpecificPropertyChange(element, name, value)) {
    handled = true;
  }

  if (!handled) {
    throw "unknown property name " + name;
  }
};

designMode.onDeletePropertiesButton = function(element, event) {
  var isScreen = $(element).hasClass('screen');
  if ($(element.parentNode).is('.ui-resizable')) {
    element = element.parentNode;
  }
  $(element).remove();

  if (isScreen) {
    designMode.loadDefaultScreen();
  } else {
    designMode.editElementProperties(elementUtils.getElementById(currentScreenId));
  }
};

designMode.onDepthChange = function (element, depthDirection) {
  // move to outer resizable div
  var outerElement = element.parentNode;
  var parent = outerElement.parentNode;
  var index = Array.prototype.indexOf.call(parent.children, outerElement);

  if (depthDirection === 'forward' && index + 2 >= parent.children.length) {
    // We're either the last or second to last element
    depthDirection = 'toFront';
  }

  var removed;

  // TODO (brent) - use an enum?
  switch (depthDirection) {
    case 'forward':
      var twoAhead = outerElement.nextSibling.nextSibling;
      removed = parent.removeChild(outerElement);
      parent.insertBefore(removed, twoAhead);
      break;

    case 'toFront':
      removed = parent.removeChild(outerElement);
      parent.appendChild(removed);
      break;

    case 'backward':
      var previous = outerElement.previousSibling;
      if (!previous) {
        return;
      }

      removed = parent.removeChild(outerElement);
      parent.insertBefore(removed, previous);
      break;

    case 'toBack':
      if (parent.children.length === 1) {
        return;
      }
      removed = parent.removeChild(outerElement);
      parent.insertBefore(removed, parent.children[0]);
      break;

    default:
      throw new Error('unknown depthDirection: ' + depthDirection);
  }

  element.focus();
  designMode.editElementProperties(element);
};

designMode.onInsertEvent = function(code) {
  Applab.appendToEditor(code);
  $('#codeModeButton').click(); // TODO(dave): reactify / extract toggle state
};

/**/
designMode.serializeToLevelHtml = function () {
  var designModeViz = $('#designModeViz');
  // Children are screens. Want to operate on grandchildren
  var madeUndraggable = makeUndraggable(designModeViz.children().children());

  // Make a copy so that we don't affect designModeViz contents as we
  // remove prefixes from the element ids.
  var designModeVizClone = designModeViz.clone();
  designModeVizClone.children().each(function() {
    removeElementIdPrefix(this);
  });
  designModeVizClone.children().children().each(function() {
    removeElementIdPrefix(this);
  });

  var serialization = new XMLSerializer().serializeToString(designModeVizClone[0]);
  if (madeUndraggable) {
    makeDraggable(designModeViz.children().children());
  }
  Applab.levelHtml = serialization;
};

/**
 * Replace the contents of rootEl with the children of the DOM node obtained by
 * parsing Applab.levelHtml (the root node in the levelHtml is ignored).
 * @param rootEl {Element} Element whose children should be replaced.
 * @param allowDragging {boolean} Whether to make elements resizable and draggable.
 * @param prefix {string} Optional prefix to attach to element ids of children and
 *     grandchildren after parsing. Defaults to ''.
 */
designMode.parseFromLevelHtml = function(rootEl, allowDragging, prefix) {
  if (!rootEl) {
    return;
  }
  while (rootEl.firstChild) {
    rootEl.removeChild(rootEl.firstChild);
  }

  if (!Applab.levelHtml) {
    return;
  }
  var levelDom = $.parseHTML(Applab.levelHtml);
  var children = $(levelDom).children();

  children.each(function () {
    addElementIdPrefix(this, prefix);
  });
  children.children().each(function() {
    addElementIdPrefix(this, prefix);
  });

    children.appendTo(rootEl);
  if (allowDragging) {
    // children are screens. make grandchildren draggable
    makeDraggable(children.children());
  }

  children.each(function () {
    elementLibrary.onDeserialize(this, designMode.updateProperty.bind(this));
  });
  children.children().each(function() {
    elementLibrary.onDeserialize(this, designMode.updateProperty.bind(this));
  });
};

/**
 * Adds the prefix to the element's id.
 * @param element {Element}
 * @param prefix {string} Optional prefix to add. Defaults to ''.
 * @returns {Element}
 */
function addElementIdPrefix(element, prefix) {
  // Specify an empty prefix explicitly, so that helper functions do
  // not implicitly use DESIGN_ELEMENT_ID_PREFIX.
  prefix = prefix === undefined ? '' : prefix;
  elementUtils.setId(element, element.getAttribute('id'), prefix);
}

/**
 * Removes the DESIGN_ELEMENT_ID_PREFIX from the element's id.
 * @param element {Element}
 * @returns {Element}
 */
function removeElementIdPrefix(element) {
  element.setAttribute('id', elementUtils.getId(element));
}

designMode.toggleDesignMode = function(enable) {
  var designWorkspace = document.getElementById('designWorkspace');
  if (!designWorkspace) {
    // Currently we don't run design mode in some circumstances (i.e. user is
    // not an admin)
    return;
  }
  designWorkspace.style.display = enable ? 'block' : 'none';

  var codeWorkspaceWrapper = document.getElementById('codeWorkspaceWrapper');
  codeWorkspaceWrapper.style.display = enable ? 'none' : 'block';

  var debugArea = document.getElementById('debug-area');
  debugArea.style.display = enable ? 'none' : 'block';

  Applab.toggleDivApplab(!enable);
};

/**
 * When we make elements resizable, we wrap them in an outer div. Given an outer
 * div, this returns the inner element
 */
function getInnerElement(outerElement) {
  // currently assume inner element is first child.
  return outerElement.children[0];
}

/**
 *
 * @param {jQuery} jqueryElements jQuery object containing DOM elements to make
 *   draggable.
 */
function makeDraggable (jqueryElements) {
  // For a non-div to be draggable & resizable it needs to be wrapped in a div.
  jqueryElements.each(function () {
    var elm = $(this);
    var wrapper = elm.wrap('<div>').parent().resizable({
      create: function () {
        // resizable sets z-index to 90, which we don't want
        $(this).children().css('z-index', '');
      },
      resize: function (event, ui) {
        // Wishing for a vector maths library...

        // Customize motion according to current visualization scale.
        var scale = getVisualizationScale();
        var deltaWidth = ui.size.width - ui.originalSize.width;
        var deltaHeight = ui.size.height - ui.originalSize.height;
        var newWidth = ui.originalSize.width + (deltaWidth / scale);
        var newHeight = ui.originalSize.height + (deltaHeight / scale);

        // snap width/height to nearest grid increment
        newWidth = snapToGridSize(newWidth, GRID_SIZE);
        newHeight = snapToGridSize(newHeight, GRID_SIZE);

        // Bound at app edges
        var container = $('#designModeViz');
        var maxWidth = container.outerWidth() - ui.position.left;
        var maxHeight = container.outerHeight() - ui.position.top;
        newWidth = Math.min(newWidth, maxWidth);
        newWidth = Math.max(newWidth, 20);
        newHeight = Math.min(newHeight, maxHeight);
        newHeight = Math.max(newHeight, 20);

        ui.size.width = newWidth;
        ui.size.height = newHeight;
        wrapper.css({
          width: newWidth,
          height: newHeight
        });

        elm.outerWidth(wrapper.width());
        elm.outerHeight(wrapper.height());
        var element = elm[0];
        // canvas uses width/height. other elements use style.width/style.height
        var widthProperty = 'style-width';
        var heightProperty = 'style-height';
        if (element.hasAttribute('width') || element.hasAttribute('height')) {
          widthProperty = 'width';
          heightProperty = 'height';
        }
        designMode.updateProperty(element, widthProperty, element.style.width);
        designMode.updateProperty(element, heightProperty, element.style.height);
      }
    }).draggable({
      cancel: false,  // allow buttons and inputs to be dragged
      drag: function (event, ui) {
        // draggables are not compatible with CSS transform-scale,
        // so adjust the position in various ways here.

        // dragging
        var scale = getVisualizationScale();
        var newLeft  = ui.position.left / scale;
        var newTop = ui.position.top / scale;

        // snap top-left corner to nearest location in the grid
        newLeft = snapToGridSize(newLeft, GRID_SIZE);
        newTop = snapToGridSize(newTop, GRID_SIZE);

        // containment
        var container = $('#designModeViz');
        var maxLeft = container.outerWidth() - ui.helper.outerWidth(true);
        var maxTop = container.outerHeight() - ui.helper.outerHeight(true);
        newLeft = Math.min(newLeft, maxLeft);
        newLeft = Math.max(newLeft, 0);
        newTop = Math.min(newTop, maxTop);
        newTop = Math.max(newTop, 0);

        ui.position.left = newLeft;
        ui.position.top = newTop;

        elm.css({
          top: newTop,
          left: newLeft
        });

        designMode.renderDesignWorkspace(elm[0]);
      }
    }).css({
      position: 'absolute',
      lineHeight: '0px'
    });

    wrapper.css({
      top: elm.css('top'),
      left: elm.css('left')
    });

    // Chrome/Safari both have issues where they don't properly render the
    // wrapper if the inner element is a div. This is a hack that causes a
    // rerender to happen in chrome
    var currHeight = wrapper.parent().height();
    wrapper.parent().height(currHeight + 1);
    wrapper.parent().height(currHeight);

    // And a hack for Safari
    if (this.tagName === 'DIV') {
      setTimeout(function () {
        wrapper.hide().show(0);
      }, 0);
    }

    elm.css('position', 'static');
  });
}

/**
 * Calculate the current visualization scale factor, as screenWidth / domWidth.
 * @returns {number}
 */
function getVisualizationScale() {
  var div = document.getElementById('designModeViz');
  return div.getBoundingClientRect().width / div.offsetWidth;
}

/**
 * Given a coordinate on either axis and a grid size, returns a coordinate
 * near the given coordinate that snaps to the given grid size.
 * @param {number} coordinate
 * @param {number} gridSize
 * @returns {number}
 */
var snapToGridSize = function (coordinate, gridSize) {
  var halfGrid = gridSize / 2;
  return coordinate - ((coordinate + halfGrid) % gridSize - halfGrid);
};

/**
 * Inverse of `makeDraggable`.
 * @param {jQuery} jqueryElements jQuery object containing DOM elements to make
 *   undraggable.
 * @returns {boolean} True if we made something undraggable
 */
function makeUndraggable(jqueryElements) {
  var foundOne = false;
  jqueryElements.each(function () {
    var wrapper = $(this);
    var elm = $(getInnerElement(this));

    // Don't unwrap elements that aren't wrapped with a draggable div.
    if (!wrapper.hasClass('ui-draggable')) {
      return;
    }

    foundOne = true;

    wrapper.resizable('destroy').draggable('destroy');
    elm.css('position', 'absolute');
    elm.unwrap();
  });

  return foundOne;
}

designMode.configureDragAndDrop = function () {
  // Allow elements to be dragged and dropped from the design mode
  // element tray to the play space.
  $('#visualization').droppable({
    accept: '.new-design-element',
    drop: function (event, ui) {
      var elementType = ui.draggable[0].getAttribute('data-element-type');

      var div = document.getElementById('designModeViz');
      var xScale = div.getBoundingClientRect().width / div.offsetWidth;
      var yScale = div.getBoundingClientRect().height / div.offsetHeight;

      var left = (ui.helper.offset().left - $('#designModeViz').offset().left) / xScale;
      var top = (ui.helper.offset().top - $('#designModeViz').offset().top) / yScale;

      // snap top-left corner to nearest location in the grid
      left -= (left + GRID_SIZE / 2) % GRID_SIZE - GRID_SIZE / 2;
      top -= (top + GRID_SIZE / 2) % GRID_SIZE - GRID_SIZE / 2;

      var element = designMode.createElement(elementType, left, top);
      if (elementType === elementLibrary.ElementType.SCREEN) {
        designMode.changeScreen(elementUtils.getId(element));
      }
    }
  });
};

designMode.configureDesignToggleRow = function () {
  var designToggleRow = document.getElementById('designToggleRow');
  if (!designToggleRow) {
    return;
  }

  var firstScreen = elementUtils.getId($('#designModeViz .screen')[0]);
  designMode.changeScreen(firstScreen);
};

/**
 * Create a new screen
 * @returns {string} The id of the newly created screen
 */
designMode.createScreen = function () {
  var newScreen = elementLibrary.createElement('SCREEN', 0, 0);
  $("#designModeViz").append(newScreen);

  return elementUtils.getId(newScreen);
};

/**
 * Changes the active screen by toggling all screens to be non-visible, unless
 * they match the provided screenId. Also updates our dropdown to reflect the
 * change, and opens the element property editor for the new screen.
 */
designMode.changeScreen = function (screenId) {
  currentScreenId = screenId;
  var screenIds = [];
  $('#designModeViz .screen').each(function () {
    screenIds.push(elementUtils.getId(this));
    $(this).toggle(elementUtils.getId(this) === screenId);
  });

  var designToggleRow = document.getElementById('designToggleRow');
  if (designToggleRow) {
    // View Data must simulate a run button click, to load the channel id.
    var viewDataClick = studioApp.runButtonClickWrapper.bind(
        studioApp, Applab.onViewData);
    var throttledViewDataClick = _.debounce(viewDataClick, 250, true);

    React.render(
      React.createElement(DesignToggleRow, {
        hideToggle: Applab.hideDesignModeToggle(),
        hideViewDataButton: Applab.hideViewDataButton(),
        startInDesignMode: Applab.startInDesignMode(),
        initialScreen: screenId,
        screens: screenIds,
        onDesignModeButton: Applab.onDesignModeButton,
        onCodeModeButton: Applab.onCodeModeButton,
        onViewDataButton: throttledViewDataClick,
        onScreenChange: designMode.changeScreen,
        onScreenCreate: designMode.createScreen
      }),
      designToggleRow
    );
  }

  designMode.editElementProperties(elementUtils.getElementById(screenId));
};

designMode.getCurrentScreenId = function() {
  return currentScreenId;
};

/**
 * Load our default screen (ie. the first one in the DOM), creating a screen
 * if we have none.
 */
designMode.loadDefaultScreen = function () {
  var defaultScreen;
  if ($('#designModeViz .screen').length === 0) {
    defaultScreen = designMode.createScreen();
  } else {
    defaultScreen = elementUtils.getId($('#designModeViz .screen')[0]);
  }
  designMode.changeScreen(defaultScreen);
};

designMode.renderDesignWorkspace = function(element) {
  var designWorkspace = document.getElementById('designWorkspace');
  if (!designWorkspace) {
    return;
  }

  var props = {
    handleDragStart: function() {
      if ($('#resetButton').is(':visible')) {
        studioApp.resetButtonClick();
      }
    },
    element: element || null,
    handleChange: designMode.onPropertyChange.bind(this, element),
    onDepthChange: designMode.onDepthChange,
    onDelete: designMode.onDeletePropertiesButton.bind(this, element),
    onInsertEvent: designMode.onInsertEvent.bind(this),
    handleManageAssets: showAssetManager,
    isDimmed: Applab.running
  };
  React.render(React.createElement(DesignWorkspace, props), designWorkspace);
};

/**
 * Early versions of applab didn't have screens, and instead all elements
 * existed under the root div. If we find one of those, convert it to be a single
 * screen app.
 */
designMode.addScreenIfNecessary = function(html) {
  var rootDiv = $(html);
  if (rootDiv.children().length === 0 ||
      rootDiv.children().eq(0).hasClass('screen')) {
    // no children, or first child is a screen
    return html;
  }

  var screenElement = elementLibrary.createElement(
    elementLibrary.ElementType.SCREEN);
  rootDiv.children().appendTo(screenElement);
  rootDiv.append(screenElement);

  return rootDiv[0].outerHTML;
};

designMode.addKeyboardHandlers = function () {
  $('#designModeViz').keydown(function (event) {
    if (!Applab.isInDesignMode() || Applab.isRunning()) {
      return;
    }
    if (!currentlyEditedElement || $(currentlyEditedElement).hasClass('screen')) {
      return;
    }

    var current, property, newValue;

    switch (event.which) {
      case KeyCodes.LEFT:
        current = parseInt(currentlyEditedElement.style.left, 10);
        newValue = current - 1;
        property = 'left';
        break;
      case KeyCodes.RIGHT:
        current = parseInt(currentlyEditedElement.style.left, 10);
        newValue = current + 1;
        property = 'left';
        break;
      case KeyCodes.UP:
        current = parseInt(currentlyEditedElement.style.top, 10);
        newValue = current - 1;
        property = 'top';
        break;
      case KeyCodes.DOWN:
        current = parseInt(currentlyEditedElement.style.top, 10);
        newValue = current + 1;
        property = 'top';
        break;
      default:
        return;
    }
    designMode.onPropertyChange(currentlyEditedElement, property, newValue);
  });
};

designMode.resetIds = function() {
  elementLibrary.resetIds();
};
