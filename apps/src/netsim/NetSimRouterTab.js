/* jshint
 funcscope: true,
 newcap: true,
 nonew: true,
 shadow: false,
 unused: true,

 maxlen: 90,
 maxstatements: 200
 */
/* global $ */
'use strict';

var markup = require('./NetSimRouterTab.html');
var NetSimBandwidthControl = require('./NetSimBandwidthControl');
var NetSimMemoryControl = require('./NetSimMemoryControl');
var NetSimRouterLogTable = require('./NetSimRouterLogTable');
var NetSimRouterStatsTable = require('./NetSimRouterStatsTable');

/**
 * Generator and controller for router information view.
 * @param {jQuery} rootDiv - Parent element for this component.
 * @param {netsimLevelConfiguration} levelConfig
 * @param {function} bandwidthChangeCallback
 * @param {function} memoryChangeCallback
 * @constructor
 */
var NetSimRouterTab = module.exports = function (rootDiv, levelConfig,
    bandwidthChangeCallback, memoryChangeCallback) {
  /**
   * Component root, which we fill whenever we call render()
   * @type {jQuery}
   * @private
   */
  this.rootDiv_ = rootDiv;

  /**
   * @type {netsimLevelConfiguration}
   * @private
   */
  this.levelConfig_ = levelConfig;

  /**
   * @type {function}
   * @private
   */
  this.bandwidthChangeCallback_ = bandwidthChangeCallback;

  /**
   * @type {function}
   * @private
   */
  this.memoryChangeCallback_ = memoryChangeCallback;

  /**
   * @type {NetSimRouterLogTable}
   * @private
   */
  this.routerLogTable_ = null;

  /**
   * @type {NetSimRouterStatsTable}
   * @private
   */
  this.routerStatsTable_ = null;

  /**
   * @type {NetSimBandwidthControl}
   * @private
   */
  this.bandwidthControl_ = null;

  /**
   * @type {NetSimMemoryControl}
   * @private
   */
  this.memoryControl_ = null;

  // Initial render
  this.render();
};

/**
 * Fill the root div with new elements reflecting the current state.
 */
NetSimRouterTab.prototype.render = function () {
  var renderedMarkup = $(markup({
    level: this.levelConfig_
  }));
  this.rootDiv_.html(renderedMarkup);
  this.routerLogTable_ = new NetSimRouterLogTable(
      this.rootDiv_.find('.router_log_table'), this.levelConfig_);
  this.routerStatsTable_ = new NetSimRouterStatsTable(
      this.rootDiv_.find('.router-stats'));
  if (this.levelConfig_.showRouterBandwidthControl) {
    this.bandwidthControl_ = new NetSimBandwidthControl(
        this.rootDiv_.find('.bandwidth-control'), this.bandwidthChangeCallback_);
  }
  if (this.levelConfig_.showRouterMemoryControl) {
    this.memoryControl_ = new NetSimMemoryControl(
        this.rootDiv_.find('.memory-control'), this.memoryChangeCallback_);
  }
};

/**
 * @param {NetSimLogEntry[]} logData
 */
NetSimRouterTab.prototype.setRouterLogData = function (logData) {
  this.routerLogTable_.setRouterLogData(logData);
  if (this.routerStatsTable_) {
    this.routerStatsTable_.setRouterLogData(logData);
  }
};

/**
 * @param {number} newBandwidth in bits/second
 */
NetSimRouterTab.prototype.setBandwidth = function (newBandwidth) {
  if (this.bandwidthControl_) {
    this.bandwidthControl_.setValue(newBandwidth);
  }
};

/** @param {number} newMemory in bits/second */
NetSimRouterTab.prototype.setMemory = function (newMemory) {
  if (this.memoryControl_) {
    this.memoryControl_.setValue(newMemory);
  }
  if (this.routerStatsTable_) {
    this.routerStatsTable_.setTotalMemory(newMemory);
  }
};

/** @param {number} usedMemoryInBits */
NetSimRouterTab.prototype.setMemoryInUse = function (usedMemoryInBits) {
  if (this.routerStatsTable_) {
    this.routerStatsTable_.setMemoryInUse(usedMemoryInBits);
  }
};
