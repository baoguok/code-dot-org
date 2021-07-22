import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import color from '@cdo/apps/util/color';
import JavalabConsole from './JavalabConsole';
import JavalabEditor from './JavalabEditor';
import {appendOutputLog, setIsDarkMode, setIsRunning} from './javalabRedux';
import StudioAppWrapper from '@cdo/apps/templates/StudioAppWrapper';
import TopInstructions from '@cdo/apps/templates/instructions/TopInstructions';
import VisualizationResizeBar from '@cdo/apps/lib/ui/VisualizationResizeBar';
import ControlButtons from './ControlButtons';

const FOOTER_BUFFER = 10;

class JavalabView extends React.Component {
  static propTypes = {
    handleVersionHistory: PropTypes.func.isRequired,
    onMount: PropTypes.func.isRequired,
    onRun: PropTypes.func.isRequired,
    onContinue: PropTypes.func.isRequired,
    onCommitCode: PropTypes.func.isRequired,
    onInputMessage: PropTypes.func.isRequired,
    suppliedFilesVersionId: PropTypes.string,
    visualization: PropTypes.object,
    onTopInstructionsHeightResize: PropTypes.func,

    // populated by redux
    isProjectLevel: PropTypes.bool.isRequired,
    isReadOnlyWorkspace: PropTypes.bool.isRequired,
    isDarkMode: PropTypes.bool.isRequired,
    appendOutputLog: PropTypes.func,
    setIsDarkMode: PropTypes.func,
    channelId: PropTypes.string,
    isEditingStartSources: PropTypes.bool,
    isRunning: PropTypes.bool,
    setIsRunning: PropTypes.func,
    showProjectTemplateWorkspaceIcon: PropTypes.bool.isRequired
  };

  state = {
    isTesting: false,
    rightContainerHeight: 800
  };

  componentDidMount() {
    this.props.onMount();
    this.setRightContainerHeight();
  }

  compile = () => {
    this.props.appendOutputLog('Compiling program...');
    this.props.appendOutputLog('Compiled!');
  };

  // Sends redux call to update dark mode, which handles user preferences
  renderSettings = () => {
    const {isDarkMode, setIsDarkMode} = this.props;
    return [
      <a onClick={() => setIsDarkMode(!isDarkMode)} key="theme-setting">
        Switch to {isDarkMode ? 'light mode' : 'dark mode'}
      </a>
    ];
  };

  // This controls the 'run' button state, but stopping program execution is not yet
  // implemented and will need to be added here.
  toggleRun = () => {
    const toggledIsRunning = !this.props.isRunning;
    this.props.setIsRunning(toggledIsRunning);
    if (toggledIsRunning) {
      this.props.onRun();
    } else {
      // TODO: Stop program execution.
    }
  };

  // This controls the 'test' button state, but running/stopping tests
  // is not yet implemented and will need to be added here.
  toggleTest = () => {
    this.setState(
      state => ({isTesting: !state.isTesting}),
      () => {
        // TODO: Run/stop tests.
      }
    );
  };

  renderVisualization = () => {
    const {visualization} = this.props;
    if (visualization) {
      return (
        <div id="visualization-container" style={styles.preview}>
          {visualization}
        </div>
      );
    }

    // This workaround is necessary because <VisualizationResizeBar /> requires
    // an element with ID 'visualization' or it will not resize.
    return <div id="visualization" style={{margin: '0 auto'}} />;
  };

  setRightContainerHeight = () => {
    let rightContainerHeight = this.editorAndVisualization.getBoundingClientRect()
      .top;
    let topPos = window.innerHeight - rightContainerHeight - FOOTER_BUFFER;
    this.setState({
      rightContainerHeight: topPos
    });
  };

  render() {
    const {
      isDarkMode,
      onCommitCode,
      onInputMessage,
      onContinue,
      handleVersionHistory,
      isEditingStartSources,
      isRunning,
      showProjectTemplateWorkspaceIcon,
      onTopInstructionsHeightResize,
      isReadOnlyWorkspace
    } = this.props;
    const {isTesting, rightContainerHeight} = this.state;

    if (isDarkMode) {
      document.body.style.backgroundColor = '#1b1c17';
    } else {
      document.body.style.backgroundColor = color.background_gray;
    }

    return (
      <StudioAppWrapper>
        <div
          style={{
            ...styles.javalab,
            ...{height: rightContainerHeight}
          }}
        >
          <div
            ref={ref => (this.editorAndVisualization = ref)}
            style={styles.editorAndVisualization}
          >
            <div
              id="visualizationColumn"
              className="responsive"
              style={styles.instructionsAndPreview}
            >
              <TopInstructions
                mainStyle={styles.instructions}
                standalone
                displayDocumentationTab
                displayReviewTab
                onHeightResize={onTopInstructionsHeightResize}
              />
              {this.renderVisualization()}
            </div>
            <VisualizationResizeBar />
            <div
              style={{
                ...styles.editorAndConsole,
                color: isDarkMode ? color.white : color.black
              }}
              className="editor-column"
            >
              <JavalabEditor
                onCommitCode={onCommitCode}
                handleVersionHistory={handleVersionHistory}
                showProjectTemplateWorkspaceIcon={
                  showProjectTemplateWorkspaceIcon
                }
                renderSettings={this.renderSettings}
              />
              <JavalabConsole
                onInputMessage={onInputMessage}
                style={styles.consoleParent}
                leftColumn={
                  <ControlButtons
                    isRunning={isRunning}
                    isDarkMode={isDarkMode}
                    isTesting={isTesting}
                    toggleRun={this.toggleRun}
                    toggleTest={this.toggleTest}
                    isEditingStartSources={isEditingStartSources}
                    isReadOnlyWorkspace={isReadOnlyWorkspace}
                    onContinue={onContinue}
                  />
                }
              />
            </div>
          </div>
        </div>
      </StudioAppWrapper>
    );
  }
}

const styles = {
  instructionsAndPreview: {
    color: color.black,
    right: '15px'
  },
  instructions: {
    width: '100%',
    position: 'relative',
    marginLeft: 0,
    color: color.black,
    left: 0
  },
  editorAndConsole: {
    right: '15px',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  consoleParent: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flexGrow: 1,
    overflowY: 'hidden'
  },
  editorAndVisualization: {
    display: 'flex',
    flexGrow: '1',
    height: '100%'
  },
  preview: {
    //backgroundColor: color.light_gray,
    //height: '200px',
    marginTop: '13px'
  },
  javalab: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  clear: {
    clear: 'both'
  },
  buttons: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    margin: '10px 0',
    overflowY: 'hidden'
  }
};

// We use the UnconnectedJavalabView to make this component's methods testable.
// This is a deprecated pattern but calling shallow().dive().instance() on the
// connected JavalabView does not give us access to the methods owned by JavalabView.
export const UnconnectedJavalabView = JavalabView;
export default connect(
  state => ({
    isProjectLevel: state.pageConstants.isProjectLevel,
    isReadOnlyWorkspace: state.pageConstants.isReadOnlyWorkspace,
    channelId: state.pageConstants.channelId,
    isDarkMode: state.javalab.isDarkMode,
    isEditingStartSources: state.pageConstants.isEditingStartSources,
    isRunning: state.javalab.isRunning,
    showProjectTemplateWorkspaceIcon: !!state.pageConstants
      .showProjectTemplateWorkspaceIcon
  }),
  dispatch => ({
    appendOutputLog: log => dispatch(appendOutputLog(log)),
    setIsDarkMode: isDarkMode => dispatch(setIsDarkMode(isDarkMode)),
    setIsRunning: isRunning => dispatch(setIsRunning(isRunning))
  })
)(UnconnectedJavalabView);
