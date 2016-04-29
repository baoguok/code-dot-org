var Radium = require('radium');
var ProtectedStatefulDiv = require('./ProtectedStatefulDiv');
var JsDebugger = require('./JsDebugger');
var PaneHeader = require('./PaneHeader');
var msg = require('../locale');
var commonStyles = require('../commonStyles');
var styleConstants = require('../styleConstants');
var color = require('../color');
var experiments = require('../experiments');

var styles = {
  workspaceHeader: {
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    height: styleConstants["workspace-headers-height"],
    lineHeight: styleConstants["workspace-headers-height"] + 'px',
  },
  workspaceHeaderButton: {
    cursor: 'pointer',
    float: 'right',
    overflow: 'hidden',
    backgroundColor: color.light_purple,
    marginTop: 3,
    marginBottom: 3,
    marginRight: 3,
    marginLeft: 0,
    height: 24,
    borderRadius: 4,
    fontFamily: '"Gotham 5r", sans-serif',
    lineHeight: '18px',
    ':hover': {
      backgroundColor: color.cyan
    }
  },
  workspaceHeaderButtonRunning: {
    backgroundColor: color.lightest_purple
  },
  headerButtonSpan: {
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 0,
    paddingBottom: 0
  },
  blocksGlyph: {
    display: 'none',
    height: 18,
    verticalAlign: 'text-bottom',
    paddingRight: 8
  },
  headerIcon: {
    fontSize: 18
  },
  headerButtonIcon: {
    lineHeight: '24px',
    paddingRight: 8,
    fontSize: 15
  },
  noPadding: {
    padding: 0
  },
  bold: {
    fontWeight: 'bold'
  },
  chevron: {
    fontSize: 18,
  },
  runningChevron: {
    color: color.dark_charcoal
  }
};

var CodeWorkspace = React.createClass({
  propTypes: {
    localeDirection: React.PropTypes.oneOf(['rtl', 'ltr']).isRequired,
    editCode: React.PropTypes.bool.isRequired,
    readonlyWorkspace: React.PropTypes.bool.isRequired,
    showDebugger: React.PropTypes.bool,
    isRunning: React.PropTypes.bool
  },

  shouldComponentUpdate: function (nextProps) {
    // This component is current semi-protected. We don't want to completely
    // disallow rerendering, since that would prevent us from being able to
    // update styles. However, we do want to prevent property changes that would
    // change the DOM structure.
    Object.keys(nextProps).forEach(function (key) {
      // isRunning only affects style, and can be updated
      if (key === 'isRunning') {
        return;
      }

      if (nextProps[key] !== this.props[key]) {
        throw new Error('Attempting to change key ' + key + ' in CodeWorkspace');
      }
    }.bind(this));

    // Should be no need to update unless we have runModeIndicators enabled
    return experiments.isEnabled('runModeIndicators');
  },

  render: function () {
    var props = this.props;

    var runModeIndicators = experiments.isEnabled('runModeIndicators');

    var chevronStyle = [
      commonStyles.hidden,
      styles.chevron,
      runModeIndicators && props.isRunning && styles.runningChevron
    ];

    var headerButtonStyle = [
      styles.workspaceHeaderButton,
      runModeIndicators && props.isRunning && styles.workspaceHeaderButtonRunning
    ];

    return (
      <span id="codeWorkspaceWrapper">
        <PaneHeader
            id="headers"
            dir={props.localeDirection}
            hasFocus={!props.isRunning}
        >
          <div id="codeModeHeaders">
            <div id="toolbox-header" style={styles.workspaceHeader}>
              <i id="hide-toolbox-icon" style={chevronStyle} className="fa fa-chevron-circle-right"/>
              <span>{props.editCode ? msg.toolboxHeaderDroplet() : msg.toolboxHeader()}</span>
            </div>
            <div id="show-toolbox-header" style={[styles.workspaceHeader, commonStyles.hidden]}>
              <i id="show-toolbox-icon" styles={styles.headerIcon} className="fa fa-chevron-circle-right"/>
              <span>{msg.showToolbox()}</span>
            </div>
            <div
                id="show-code-header"
                key="show-code-header"
                style={[styles.workspaceHeader, headerButtonStyle]}>
              <span style={styles.headerButtonSpan}>
                <img src="/blockly/media/applab/blocks_glyph.gif" style={styles.blocksGlyph} />
                <i className="fa fa-code" style={[styles.bold, styles.headerButtonIcon]}/>
                <span style={styles.noPadding}>{msg.showCodeHeader()}</span>
              </span>
            </div>
            {!props.readonlyWorkspace &&
            <div
                id="clear-puzzle-header"
                key="clear-puzzle-header"
                style={[styles.workspaceHeader, headerButtonStyle]}>
              <span style={styles.headerButtonSpan}>
                <i className="fa fa-undo" style={styles.headerButtonIcon}/>
                <span style={styles.noPadding}>{msg.clearPuzzle()}</span>
              </span>
            </div>
            }
            <div
                id="versions-header"
                key="versions-header"
                style={[styles.workspaceHeader, headerButtonStyle]}>
              <span style={styles.headerButtonSpan}>
                <i className="fa fa-clock-o" style={styles.headerButtonIcon}/>
                <span style={styles.noPadding}>{msg.showVersionsHeader()}</span>
              </span>
            </div>
            <div id="workspace-header" style={styles.workspaceHeader}>
              <span id="workspace-header-span">
                {props.readonlyWorkspace ? msg.readonlyWorkspaceHeader() : msg.workspaceHeaderShort()}
              </span>
              <div id="blockCounter">
                <div id="blockUsed" className='block-counter-default'>
                </div>
                <span> / </span>
                <span id="idealBlockNumber"></span>
                <span>{" " + msg.blocks()}</span>
              </div>
            </div>
          </div>
        </PaneHeader>
        {props.editCode && <ProtectedStatefulDiv id="codeTextbox"/>}
        {props.showDebugger && <JsDebugger/>}
      </span>
    );
  }
});

module.exports = Radium(CodeWorkspace);
