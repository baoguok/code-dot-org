/**
 * @overview UI controller for the packet editor which allows editing multiple
 *           encodings at once and lives inside the send panel.
 * @see NetSimSendPanel for how this is used.
 */
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
'use strict';

require('../utils'); // For Function.prototype.inherits()
var netsimMsg = require('./locale');
var markup = require('./NetSimPacketEditor.html.ejs');
var KeyCodes = require('../constants').KeyCodes;
var NetSimEncodingControl = require('./NetSimEncodingControl');
var NetSimLogPanel = require('./NetSimLogPanel');
var Packet = require('./Packet');
var dataConverters = require('./dataConverters');
var netsimConstants = require('./netsimConstants');
var netsimGlobals = require('./netsimGlobals');

var EncodingType = netsimConstants.EncodingType;
var BITS_PER_BYTE = netsimConstants.BITS_PER_BYTE;

var minifyBinary = dataConverters.minifyBinary;
var formatAB = dataConverters.formatAB;
var formatBinary = dataConverters.formatBinary;
var formatHex = dataConverters.formatHex;
var alignDecimal = dataConverters.alignDecimal;
var abToBinary = dataConverters.abToBinary;
var abToInt = dataConverters.abToInt;
var binaryToAB = dataConverters.binaryToAB;
var binaryToHex = dataConverters.binaryToHex;
var binaryToInt = dataConverters.binaryToInt;
var binaryToDecimal = dataConverters.binaryToDecimal;
var binaryToAscii = dataConverters.binaryToAscii;
var hexToBinary = dataConverters.hexToBinary;
var intToAB = dataConverters.intToAB;
var intToBinary = dataConverters.intToBinary;
var intToHex = dataConverters.intToHex;
var decimalToBinary = dataConverters.decimalToBinary;
var asciiToBinary = dataConverters.asciiToBinary;

/**
 * Generator and controller for message sending view.
 * @param {Object} initialConfig
 * @param {MessageGranularity} initialConfig.messageGranularity
 * @param {Packet.HeaderType[]} initialConfig.packetSpec
 * @param {number} [initialConfig.toAddress]
 * @param {number} [initialConfig.fromAddress]
 * @param {number} [initialConfig.packetIndex]
 * @param {number} [initialConfig.packetCount]
 * @param {string} [initialConfig.message]
 * @param {number} [initialConfig.maxPacketSize]
 * @param {number} [initialConfig.chunkSize]
 * @param {number} [initialConfig.bitRate]
 * @param {EncodingType[]} [initialConfig.enabledEncodings]
 * @param {function} initialConfig.removePacketCallback
 * @param {function} initialConfig.contentChangeCallback
 * @param {function} initialConfig.enterKeyPressedCallback
 * @constructor
 */
var NetSimPacketEditor = module.exports = function (initialConfig) {
  var level = netsimGlobals.getLevelConfig();

  /**
   * @type {jQuery}
   * @private
   */
  this.rootDiv_ = $('<div>').addClass('netsim-packet');

  /**
   * @type {MessageGranularity}
   * @private
   */
  this.messageGranularity_ = initialConfig.messageGranularity;

  /**
   * @type {Packet.HeaderType[]}
   * @private
   */
  this.packetSpec_ = initialConfig.packetSpec;

  /** @type {string} */
  this.toAddress = initialConfig.toAddress ||
      dataConverters.binaryToAddressString('0', level.addressFormat);
  
  /** @type {string} */
  this.fromAddress = initialConfig.fromAddress ||
      dataConverters.binaryToAddressString('0', level.addressFormat);
  
  /** @type {number} */
  this.packetIndex = initialConfig.packetIndex !== undefined ?
      initialConfig.packetIndex : 1;
  
  /** @type {number} */
  this.packetCount = initialConfig.packetCount !== undefined ?
      initialConfig.packetCount : 1;

  /**
   * Binary string of message body, live-interpreted to other values.
   * @type {string}
   */
  this.message = initialConfig.message || '';

  /**
   * Maximum packet length configurable by slider.
   * @type {Number}
   * @private
   */
  this.maxPacketSize_ = initialConfig.maxPacketSize || 8192;

  /**
   * Bits per chunk/byte for parsing and formatting purposes.
   * @type {number}
   * @private
   */
  this.currentChunkSize_ = initialConfig.chunkSize || BITS_PER_BYTE;

  /**
   * Local device bitrate (bps), which affects send-animation speed.
   * @type {number}
   * @private
   */
  this.bitRate_ = initialConfig.bitRate || Infinity;

  /**
   * Which encodings should be visible in the editor.
   * @type {EncodingType[]}
   * @private
   */
  this.enabledEncodings_ = initialConfig.enabledEncodings || [];

  /**
   * Method to call in order to remove this packet from its parent.
   * Function should take this PacketEditor as an argument.
   * @type {function}
   * @private
   */
  this.removePacketCallback_ = initialConfig.removePacketCallback;

  /**
   * Method to notify our parent container that the packet's binary
   * content has changed.
   * @type {function}
   * @private
   */
  this.contentChangeCallback_ = initialConfig.contentChangeCallback;

  /**
   * Method to notify our parent container that the enter key has been
   * pressed
   * @type {function}
   * @private
   */
  this.enterKeyPressedCallback_ = initialConfig.enterKeyPressedCallback;

  /**
   * @type {jQuery}
   * @private
   */
  this.removePacketButton_ = null;

  /**
   * @type {jQuery}
   * @private
   */
  this.bitCounter_ = null;

  /**
   * Flag noting whether this packet editor is in a non-interactive mode
   * where it animates bits draining/being sent.
   * @type {boolean}
   * @private
   */
  this.isPlayingSendAnimation_ = false;

  /**
   * Flag for whether this editor is in the middle of an async send command.
   * @type {boolean}
   * @private
   */
  this.isSendingPacketToRemote_ = false;

  /**
   * Reference to local client node, used for sending messages.
   * @type {NetSimLocalClientNode}
   * @private
   */
  this.myNode_ = null;

  /**
   * Capture packet binary before the send animation begins so that we can
   * send the whole packet to remote storage when the animation is done.
   * @type {string}
   * @private
   */
  this.originalBinary_ = '';

  /**
   * We capture the packet binary before we start the sending animation,
   * and drain this variable as we go; mostly because getPacketBinary()
   * will always include packet headers.
   * @type {string}
   * @private
   */
  this.remainingBinary_ = '';

  /**
   * Simulation-time timestamp (ms) of the last bit-send animation.
   * @type {number}
   * @private
   */
  this.lastBitSentTime_ = undefined;
  
  this.render();
};

/**
 * Return root div, for hooking up to a parent element.
 * @returns {jQuery}
 */
NetSimPacketEditor.prototype.getRoot = function () {
  return this.rootDiv_;
};

/**
 * Returns the first visible message box, so that we can focus() on it
 * @returns {jQuery}
 */
NetSimPacketEditor.prototype.getFirstVisibleMessageBox = function () {
  return this.getRoot().find('textarea.message:visible').first();
};

/** Replace contents of our root element with our own markup. */
NetSimPacketEditor.prototype.render = function () {
  var newMarkup = $(markup({
    messageGranularity: this.messageGranularity_,
    packetSpec: this.packetSpec_
  }));
  this.rootDiv_.html(newMarkup);
  this.bindElements_();
  this.updateFields_();
  this.updateRemoveButtonVisibility_();
  NetSimLogPanel.adjustHeaderColumnWidths(this.rootDiv_);
  NetSimEncodingControl.hideRowsByEncoding(this.rootDiv_, this.enabledEncodings_);
};

/**
 * Put this packet in a mode where it's not editable.  Instead, it will drain
 * its binary at the current bitrate and call the given callback when all
 * of the binary has been drained/"sent"
 * @param {NetSimLocalClientNode} myNode
 */
NetSimPacketEditor.prototype.beginSending = function (myNode) {
  this.isPlayingSendAnimation_ = true;
  this.originalBinary_ = this.getPacketBinary().substr(0, this.maxPacketSize_);
  this.remainingBinary_ = this.originalBinary_;
  this.myNode_ = myNode;

  // Finish now if the packet is empty.
  if (this.remainingBinary_.length === 0) {
    this.finishSending();
  }
};

/**
 * Kick off the async send-to-remote operation for the original packet binary.
 * When it's done, remove this now-empty packet.
 */
NetSimPacketEditor.prototype.finishSending = function () {
  this.isPlayingSendAnimation_ = false;
  this.isSendingPacketToRemote_ = true;
  this.myNode_.sendMessage(this.originalBinary_, function () {
    this.isSendingPacketToRemote_ = false;
    this.removePacketCallback_(this);
  }.bind(this));
};

/**
 * @returns {boolean} TRUE if this packet is currently being sent.
 */
NetSimPacketEditor.prototype.isSending = function () {
  return this.isPlayingSendAnimation_ || this.isSendingPacketToRemote_;
};

/**
 * Packet Editor tick is called (manually by the NetSimSendPanel) to advance
 * its sending animation.
 * @param {RunLoop.Clock} clock
 */
NetSimPacketEditor.prototype.tick = function (clock) {
  // Before we start animating, or after we are done animating, do nothing.
  if (!this.isPlayingSendAnimation_ || this.isSendingPacketToRemote_) {
    return;
  }

  if (!this.lastBitSentTime_) {
    this.lastBitSentTime_ = clock.time;
  }

  // How many characters should be consumed this tick?
  var msSinceLastBitConsumed = clock.time - this.lastBitSentTime_;
  var msPerBit = 1000 * (1 / this.bitRate_);
  var maxBitsToSendThisTick = Math.floor(msSinceLastBitConsumed / msPerBit);
  if (maxBitsToSendThisTick > 0) {
    this.lastBitSentTime_ = clock.time;
    this.remainingBinary_ = this.remainingBinary_.substr(maxBitsToSendThisTick);
    this.setPacketBinary(this.remainingBinary_);
    if (this.remainingBinary_.length === 0) {
      this.finishSending();
    }
  }
};

/**
 * Focus event handler.  If the target element has a 'watermark' class then
 * it contains text we intend to clear before any editing occurs.  This
 * handler clears that text and removes the class.
 * @param focusEvent
 */
var removeWatermark = function (focusEvent) {
  var target = $(focusEvent.target);
  if (target.hasClass('watermark')) {
    target.val('');
    target.removeClass('watermark');
  }
};

/**
 * Helper method for determining if a given keyPress event represents a
 * CLEAN enter press. As in, one without the Shift or Control modifiers.
 * @param {Event} jqueryEvent
 * @returns {boolean} true iff the given event represents a clean enter
 */
var isUnmodifiedEnterPress = function (jqueryEvent) {
  return (jqueryEvent.keyCode == 13 && !(jqueryEvent.ctrlKey || jqueryEvent.shiftKey));
};

/**
 * Creates a keyPress handler that allows only the given characters to be
 * typed into a text field.
 * @param {RegExp} whitelistRegex
 * @return {function} appropriate to pass to .keypress()
 */
var makeKeypressHandlerWithWhitelist = function (whitelistRegex) {
  /**
   * A keyPress handler that blocks all visible characters except those
   * matching the whitelist.  Passes through invisible characters (backspace,
   * delete) and control combinations (copy, paste).
   *
   * @param keyEvent
   * @returns {boolean} - Whether to propagate this event.  Should return
   *          FALSE if we handle the event and don't want to pass it on, TRUE
   *          if we are not handling the event.
   */
  return function (keyEvent) {

    // Don't block control combinations (copy, paste, etc.)
    if (keyEvent.metaKey || keyEvent.ctrlKey) {
      return true;
    }

    // Don't block invisible characters; we want to allow backspace, delete, etc.
    if (keyEvent.which < KeyCodes.SPACE || keyEvent.which >= KeyCodes.DELETE) {
      return true;
    }

    // At this point, if the character doesn't match, we should block it.
    var key = String.fromCharCode(keyEvent.which);
    if (!whitelistRegex.test(key)) {
      keyEvent.preventDefault();
      return false;
    }
  };
};

/**
 * Generate a jQuery-appropriate keyup handler for a text field.
 * Grabs the new value of the text field, runs it through the provided
 * converter function, sets the result on the SendWidget's internal state
 * and triggers a field update on the widget that skips the field being edited.
 *
 * Similar to makeBlurHandler, but does not update the field currently
 * being edited.
 *
 * @param {string} fieldName - name of internal state field that the text
 *        field should update.
 * @param {function} converterFunction - Takes the text field's value and
 *        converts it to a format appropriate to the internal state field.
 * @param {number} [fieldWidth] - maximum number of bits for field, passed
 *        through as second argument to converter function.
 * @returns {function} that can be passed to $.keyup()
 */
NetSimPacketEditor.prototype.makeKeyupHandler = function (fieldName,
    converterFunction, fieldWidth) {
  return function (jqueryEvent) {
    var newValue = converterFunction(jqueryEvent.target.value, fieldWidth);
    if (typeof newValue === 'string' || !isNaN(newValue)) {
      this[fieldName] = newValue;
      this.updateFields_(jqueryEvent.target);
    }
  }.bind(this);
};

/**
 * Generate a jQuery-appropriate blur handler for a text field.
 * Grabs the new value of the text field, runs it through the provided
 * converter function, sets the result on the SendWidget's internal state
 * and triggers a full field update of the widget (including the field that was
 * just edited).
 *
 * Similar to makeKeyupHandler, but also updates the field that was
 * just edited.
 *
 * @param {string} fieldName - name of internal state field that the text
 *        field should update.
 * @param {function} converterFunction - Takes the text field's value and
 *        converts it to a format appropriate to the internal state field.
 * @param {number} [fieldWidth] - maximum number of bits for field, passed
 *        through as second argument to converter function.
 * @returns {function} that can be passed to $.blur()
 */
NetSimPacketEditor.prototype.makeBlurHandler = function (fieldName,
    converterFunction, fieldWidth) {
  return function (jqueryEvent) {
    var newValue = converterFunction(jqueryEvent.target.value, fieldWidth);
    if (typeof newValue === 'number' && isNaN(newValue)) {
      newValue = converterFunction('0');
    }
    this[fieldName] = newValue;
    this.updateFields_();
  }.bind(this);
};

/**
 * Specification for an encoding row in the editor, which designates character
 * whitelists to limit typing in certain fields, and rules for intepreting the
 * field from binary.
 * @typedef {Object} rowType
 * @property {EncodingType} typeName
 * @property {RegExp} addressFieldAllowedCharacters - Whitelist of characters
 *           that may be typed into an address field.
 * @property {function} addressFieldConversion - How to convert from binary
 *           to an address string in this row when the binary is updated.
 * @property {RegExp} shortNumberAllowedCharacters - Whitelist of characters
 *           that may be typed into a header field.
 * @property {function} shortNumberConversion - How to convert from binary
 *           to a header value in this row when the binary is updated.
 * @property {RegExp} messageAllowedCharacters - Whitelist of characters
 *           that may be typed into the message field.
 * @property {function} messageConversion - How to convert from binary to
 *           the message value in this row when the binary is updated.
 */

/**
 * Convert binary to an integer, intentionally limiting the binary width so
 * that overflow can occur.
 * @param {string} binaryString (interpreted as unsigned)
 * @param {number} maxWidth in bits
 * @returns {number}
 */
var truncatedBinaryToInt = function (binaryString, maxWidth) {
  return binaryToInt(binaryString.substr(-maxWidth));
};

/**
 * Convert ABs to an integer, intentionally limiting the width so that overflow
 * can occur (analagous to truncatedBinaryToInt).  A is treated as zero, B as
 * one.
 * @param {string} abString
 * @param {number} maxWidth in bits
 * @returns {number}
 */
var truncatedABToInt = function (abString, maxWidth) {
  return abToInt(abString.substr(-maxWidth));
};

/**
 * Convert a hexadecimal string to a single integer, intentionally limiting
 * the bit-width to so that overflow can occur.
 * @param {string} hexString
 * @param {number} maxWidth in bits
 * @returns {number}
 */
var truncatedHexToInt = function (hexString, maxWidth) {
  return truncatedBinaryToInt(hexToBinary(hexString), maxWidth);
};

/**
 * Convert a decimal string to an integer, intentionally limiting the bit-width
 * so that overflow can occur.
 * @param {string} decimalString
 * @param {number} maxWidth in bits
 * @returns {number}
 */
var truncatedDecimalToInt = function (decimalString, maxWidth) {
  return truncatedBinaryToInt(intToBinary(parseInt(decimalString, 10)), maxWidth);
};

/**
 * Convert an address string to binary and back using the level's address
 * format, which coerces it to the exact format the level wants.
 * @param {string} originalString
 * @returns {string}
 */
var cleanAddressString = function (originalString) {
  var level = netsimGlobals.getLevelConfig();
  var binaryForm = dataConverters.addressStringToBinary(
      originalString, level.addressFormat);
  return dataConverters.binaryToAddressString(
      binaryForm, level.addressFormat);
};

/**
 * Get relevant elements from the page and bind them to local variables.
 * @private
 */
NetSimPacketEditor.prototype.bindElements_ = function () {
  var level = netsimGlobals.getLevelConfig();
  var rootDiv = this.rootDiv_;

  /** @type {rowType[]} */
  var rowTypes = [
    {
      typeName: EncodingType.A_AND_B,
      addressFieldAllowedCharacters: /[AB\s]/i,
      addressFieldConversion: function (abString) {
        return dataConverters.binaryToAddressString(
            dataConverters.abToBinary(abString), level.addressFormat);
      },
      shortNumberAllowedCharacters: /[AB]/i,
      shortNumberConversion: truncatedABToInt,
      messageAllowedCharacters: /[AB\s]/i,
      messageConversion: abToBinary
    },
    {
      typeName: EncodingType.BINARY,
      addressFieldAllowedCharacters: /[01\s]/i,
      addressFieldConversion: function (binaryString) {
        return dataConverters.binaryToAddressString(
            binaryString, level.addressFormat);
      },
      shortNumberAllowedCharacters: /[01]/,
      shortNumberConversion: truncatedBinaryToInt,
      messageAllowedCharacters: /[01\s]/,
      messageConversion: minifyBinary
    },
    {
      typeName: EncodingType.HEXADECIMAL,
      addressFieldAllowedCharacters: /[0-9a-f\s]/i,
      addressFieldConversion: function (hexString) {
        return dataConverters.binaryToAddressString(
            dataConverters.hexToBinary(hexString), level.addressFormat);
      },
      shortNumberAllowedCharacters: /[0-9a-f]/i,
      shortNumberConversion: truncatedHexToInt,
      messageAllowedCharacters: /[0-9a-f\s]/i,
      messageConversion: hexToBinary
    },
    {
      typeName: EncodingType.DECIMAL,
      addressFieldAllowedCharacters: /[0-9.\s]/i,
      addressFieldConversion: cleanAddressString,
      shortNumberAllowedCharacters: /[0-9]/,
      shortNumberConversion: truncatedDecimalToInt,
      messageAllowedCharacters: /[0-9\s]/,
      messageConversion: function (decimalString) {
        return decimalToBinary(decimalString, this.currentChunkSize_);
      }.bind(this)
    },
    {
      typeName: EncodingType.ASCII,
      addressFieldAllowedCharacters: /[0-9.\s]/i,
      addressFieldConversion: cleanAddressString,
      shortNumberAllowedCharacters: /[0-9]/,
      shortNumberConversion: truncatedDecimalToInt,
      messageAllowedCharacters: /./,
      messageConversion: function (asciiString) {
        return asciiToBinary(asciiString, this.currentChunkSize_);
      }.bind(this)
    }
  ];

  rowTypes.forEach(function (rowType) {
    var tr = rootDiv.find('tr.' + rowType.typeName);
    var rowUIKey = rowType.typeName + 'UI';
    this[rowUIKey] = {};
    var rowFields = this[rowUIKey];

    // We attach focus (sometimes) to clear the field watermark, if present
    // We attach keypress to block certain characters
    // We attach keyup to live-update the widget as the user types
    // We attach blur to reformat the edited field when the user leaves it,
    //    and to catch non-keyup cases like copy/paste.

    var level = netsimGlobals.getLevelConfig();
    var encoder = new Packet.Encoder(level.addressFormat,
        level.packetCountBitWidth, this.packetSpec_);

    this.packetSpec_.forEach(function (fieldSpec) {
      /** @type {Packet.HeaderType} */
      var fieldName = fieldSpec;
      /** @type {number} */
      var fieldWidth = encoder.getFieldBitWidth(fieldName);

      var allowedCharacterFunction, conversionFunction;
      if (Packet.isAddressField(fieldName)) {
        allowedCharacterFunction = rowType.addressFieldAllowedCharacters;
        conversionFunction = rowType.addressFieldConversion;
      } else {
        allowedCharacterFunction = rowType.shortNumberAllowedCharacters;
        conversionFunction = rowType.shortNumberConversion;
      }

      rowFields[fieldName] = tr.find('input.' + fieldName);
      rowFields[fieldName].keypress(makeKeypressHandlerWithWhitelist(
          allowedCharacterFunction));
      rowFields[fieldName].keyup(this.makeKeyupHandler(fieldName,
          conversionFunction, fieldWidth));
      rowFields[fieldName].blur(this.makeBlurHandler(fieldName,
          conversionFunction, fieldWidth));
    }, this);

    rowFields.message = tr.find('textarea.message');
    rowFields.message.focus(removeWatermark);
    rowFields.message.keypress(
        makeKeypressHandlerWithWhitelist(rowType.messageAllowedCharacters));
    rowFields.message.keydown(function(jqueryEvent){
      if (isUnmodifiedEnterPress(jqueryEvent)) {
        this.enterKeyPressedCallback_(jqueryEvent);
      }
    }.bind(this));
    rowFields.message.keyup(
        this.makeKeyupHandler('message', rowType.messageConversion));
    rowFields.message.blur(
        this.makeBlurHandler('message', rowType.messageConversion));
  }, this);

  this.removePacketButton_ = rootDiv.find('.remove-packet-button');
  this.removePacketButton_.click(this.onRemovePacketButtonClick_.bind(this));
  this.bitCounter_ = rootDiv.find('.bit-counter');
};

/**
 * Update send widget display
 * @param {HTMLElement} [skipElement] - A field to skip while updating,
 *        because we don't want to transform content out from under the
 *        user's cursor.
 * @private
 */
NetSimPacketEditor.prototype.updateFields_ = function (skipElement) {
  var chunkSize = this.currentChunkSize_;
  var liveFields = [];

  var level = netsimGlobals.getLevelConfig();
  var encoder = new Packet.Encoder(level.addressFormat,
      level.packetCountBitWidth, this.packetSpec_);

  this.packetSpec_.forEach(function (fieldSpec) {
    /** @type {Packet.HeaderType} */
    var fieldName = fieldSpec;
    /** @type {number} */
    var fieldWidth = encoder.getFieldBitWidth(fieldName);

    var abConverter, binaryConverter, hexConverter, decimalConverter, asciiConverter;
    if (Packet.isAddressField(fieldName)) {
      abConverter = function (addressString) {
        return dataConverters.binaryToAB(
            dataConverters.addressStringToBinary(
                addressString, level.addressFormat));
      };
      binaryConverter = function (addressString) {
        return dataConverters.formatBinaryForAddressHeader(
            dataConverters.addressStringToBinary(
                addressString,
                level.addressFormat),
            level.addressFormat);
      };
      hexConverter = function (addressString) {
        return dataConverters.binaryToHex(
            dataConverters.addressStringToBinary(
                addressString, level.addressFormat));
      };
      decimalConverter = cleanAddressString;
      asciiConverter = cleanAddressString;
    } else {
      abConverter = intToAB;
      binaryConverter = intToBinary;
      hexConverter = intToHex;
      decimalConverter = function (val) {
        return val.toString(10);
      };
      asciiConverter = decimalConverter;
    }

    liveFields.push({
      inputElement: this.a_and_bUI[fieldName],
      newValue: abConverter(this[fieldName], fieldWidth)
    });

    liveFields.push({
      inputElement: this.binaryUI[fieldName],
      newValue: binaryConverter(this[fieldName], fieldWidth)
    });

    liveFields.push({
      inputElement: this.hexadecimalUI[fieldName],
      newValue: hexConverter(this[fieldName], Math.ceil(fieldWidth / 4))
    });

    liveFields.push({
      inputElement: this.decimalUI[fieldName],
      newValue: decimalConverter(this[fieldName], fieldWidth)
    });

    liveFields.push({
      inputElement: this.asciiUI[fieldName],
      newValue: asciiConverter(this[fieldName], fieldWidth)
    });
  }, this);

  liveFields.push({
    inputElement: this.a_and_bUI.message,
    newValue: formatAB(binaryToAB(this.message), chunkSize),
    watermark: netsimMsg.a_and_b()
  });

  liveFields.push({
    inputElement: this.binaryUI.message,
    newValue: formatBinary(this.message, chunkSize),
    watermark: netsimMsg.binary()
  });

  liveFields.push({
    inputElement: this.hexadecimalUI.message,
    newValue: formatHex(binaryToHex(this.message), chunkSize),
    watermark: netsimMsg.hexadecimal()
  });

  liveFields.push({
    inputElement: this.decimalUI.message,
    newValue: alignDecimal(binaryToDecimal(this.message, chunkSize)),
    watermark: netsimMsg.decimal()
  });

  liveFields.push({
    inputElement: this.asciiUI.message,
    newValue: binaryToAscii(this.message, chunkSize),
    watermark: netsimMsg.ascii()
  });

  liveFields.forEach(function (field) {
    if (field.inputElement[0] !== skipElement) {
      if (field.watermark && field.newValue === '') {
        field.inputElement.val(field.watermark);
        field.inputElement.addClass('watermark');
      } else {
        field.inputElement.val(field.newValue);
        field.inputElement.removeClass('watermark');
      }
    }
  });

  this.updateBitCounter();
  this.contentChangeCallback_();
};

/**
 * If there's only one packet, applies "display: none" to the button so the
 * last packet can't be removed.  Otherwise, clears the CSS property override.
 * @private
 */
NetSimPacketEditor.prototype.updateRemoveButtonVisibility_ = function () {
  this.removePacketButton_.css('display', (this.packetCount === 1 ? 'none' : ''));
};

/**
 * Produces a single binary string in the current packet format, based
 * on the current state of the widget (content of its internal fields).
 * @returns {string} - binary representation of packet
 * @private
 */
NetSimPacketEditor.prototype.getPacketBinary = function () {
  var level = netsimGlobals.getLevelConfig();
  var encoder = new Packet.Encoder(level.addressFormat,
      level.packetCountBitWidth, this.packetSpec_);
  return encoder.concatenateBinary(
      encoder.makeBinaryHeaders({
        toAddress: this.toAddress,
        fromAddress: this.fromAddress,
        packetIndex: this.packetIndex,
        packetCount: this.packetCount
      }),
      this.message);
};

/**
 * Sets editor fields from a complete packet binary, according to
 * the configured header specification.
 * @param {string} rawBinary
 */
NetSimPacketEditor.prototype.setPacketBinary = function (rawBinary) {
  var packet = new Packet(this.packetSpec_, rawBinary);

  if (this.specContainsHeader_(Packet.HeaderType.TO_ADDRESS)) {
    this.toAddress = packet.getHeaderAsAddressString(Packet.HeaderType.TO_ADDRESS);
  }

  if (this.specContainsHeader_(Packet.HeaderType.FROM_ADDRESS)) {
    this.fromAddress = packet.getHeaderAsAddressString(Packet.HeaderType.FROM_ADDRESS);
  }

  if (this.specContainsHeader_(Packet.HeaderType.PACKET_INDEX)) {
    this.packetIndex = packet.getHeaderAsInt(Packet.HeaderType.PACKET_INDEX);
  }

  if (this.specContainsHeader_(Packet.HeaderType.PACKET_COUNT)) {
    this.packetCount = packet.getHeaderAsInt(Packet.HeaderType.PACKET_COUNT);
  }

  this.message = packet.getBodyAsBinary();

  // Re-render all encodings
  this.updateFields_();
};

/**
 * @param {Packet.HeaderType} headerKey
 * @returns {boolean}
 * @private
 */
NetSimPacketEditor.prototype.specContainsHeader_ = function (headerKey) {
  return this.packetSpec_.some(function (headerSpec) {
    return headerSpec === headerKey;
  });
};

/**
 * Get just the first bit of the packet binary if it exists, for
 * single-bit sending mode.
 * @returns {string|undefined} a single bit if it exists, as "0" or "1",
 * or undefined if none does.
 */
NetSimPacketEditor.prototype.getFirstBit = function () {
  var binary = this.getPacketBinary();
  return binary.length > 0 ? binary.substr(0, 1) : undefined;
};

/** @param {number} fromAddress */
NetSimPacketEditor.prototype.setFromAddress = function (fromAddress) {
  this.fromAddress = fromAddress;
  this.updateFields_();
};

/** @param {number} packetIndex */
NetSimPacketEditor.prototype.setPacketIndex = function (packetIndex) {
  this.packetIndex = packetIndex;
  this.updateFields_();
};

/** @param {number} packetCount */
NetSimPacketEditor.prototype.setPacketCount = function (packetCount) {
  this.packetCount = packetCount;
  this.updateFields_();
  this.updateRemoveButtonVisibility_();
};

/** @param {number} maxPacketSize */
NetSimPacketEditor.prototype.setMaxPacketSize = function (maxPacketSize) {
  this.maxPacketSize_ = maxPacketSize;
  this.updateBitCounter();
};

/**
 * Show or hide parts of the send UI based on the currently selected encoding
 * mode.
 * @param {EncodingType[]} newEncodings
 */
NetSimPacketEditor.prototype.setEncodings = function (newEncodings) {
  this.enabledEncodings_ = newEncodings;
  NetSimEncodingControl.hideRowsByEncoding(this.rootDiv_, newEncodings);
};

/**
 * Change how data is interpreted and formatted by this component, triggering
 * an update of all input fields.
 * @param {number} newChunkSize
 */
NetSimPacketEditor.prototype.setChunkSize = function (newChunkSize) {
  this.currentChunkSize_ = newChunkSize;
  this.updateFields_();
};

/**
 * Change local device bitrate which changes send animation speed.
 * @param {number} newBitRate in bits per second
 */
NetSimPacketEditor.prototype.setBitRate = function (newBitRate) {
  this.bitRate_ = newBitRate;
};

/**
 * Update the visual state of the bit counter to reflect the current
 * message binary length and maximum packet size.
 */
NetSimPacketEditor.prototype.updateBitCounter = function () {
  var size = this.getPacketBinary().length;
  var maxSize = this.maxPacketSize_;
  this.bitCounter_.html(netsimMsg.bitCounter({
    x: size,
    y: maxSize
  }));

  this.bitCounter_.toggleClass('oversized', size > this.maxPacketSize_);
};

/**
 * Handler for the "Remove Packet" button. Calls handler provided by
 * parent, passing self, so that parent can remove this packet.
 * @param {Event} jQueryEvent
 * @private
 */
NetSimPacketEditor.prototype.onRemovePacketButtonClick_ = function (jQueryEvent) {
  var thisButton = $(jQueryEvent.target);
  // We also check parent elements here, because this button uses a font-awesome
  // glyph that can receive the event instead of the actual button.
  if (thisButton.is('[disabled]') || thisButton.parents().is('[disabled]')) {
    return;
  }

  this.removePacketCallback_(this);
};

/**
 * Remove the first bit of the packet binary, used when sending one bit
 * at a time.
 */
NetSimPacketEditor.prototype.consumeFirstBit = function () {
  this.setPacketBinary(this.getPacketBinary().substr(1));
};
