// Main page for Foorm Library Editor interface. Will initially show a choice
// between loading an existing configuration or an empty configuration.
// After that choice is made, will render FoormLibraryEditor with the chosen configuration.

import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {Button, DropdownButton, MenuItem} from 'react-bootstrap';
import FoormLibraryEditor from './FoormLibraryEditor';
import {
  resetAvailableLibraries,
  resetAvailableLibraryQuestions,
  setLastSaved,
  setSaveError,
  setLibraryQuestionData,
  setHasError,
  setLastSavedQuestion,
  setLibraryData
} from './library_editor/foormLibraryEditorRedux';

const styles = {
  loadError: {
    fontWeight: 'bold',
    padding: '1em'
  }
};

class FoormLibraryEditorManager extends React.Component {
  static propTypes = {
    populateCodeMirror: PropTypes.func,
    resetCodeMirror: PropTypes.func,
    libraryNamesAndVersions: PropTypes.array,
    libraryCategories: PropTypes.array,

    // populated by redux
    libraryId: PropTypes.number,
    availableLibraries: PropTypes.array,
    resetAvailableLibraries: PropTypes.func,
    availableLibraryQuestionsForCurrentLibrary: PropTypes.array,
    resetAvailableLibraryQuestions: PropTypes.func,
    setLastSaved: PropTypes.func,
    setSaveError: PropTypes.func,
    setLibraryQuestionData: PropTypes.func,
    setHasError: PropTypes.func,
    setLastSavedQuestion: PropTypes.func,
    setLibraryData: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      showCodeMirror: false,
      hasLoadError: false
    };

    this.props.resetAvailableLibraries(this.props.libraryNamesAndVersions);
  }

  getFormattedLibraryDropdownOptions() {
    return this.props.availableLibraries.map((libraryNameAndVersion, i) => {
      const libraryName = libraryNameAndVersion['name'];
      const libraryVersion = libraryNameAndVersion['version'];

      return this.renderMenuItem(
        () => this.loadLibraryQuestions(libraryNameAndVersion),
        `${libraryName}, version ${libraryVersion}`,
        i
      );
    });
  }

  getFormattedLibraryQuestionDropdownOptions() {
    return this.props.availableLibraryQuestionsForCurrentLibrary.map(
      (libraryQuestionAndType, i) => {
        const libraryQuestionName = libraryQuestionAndType['name'];
        const libraryQuestionType = libraryQuestionAndType['type'];
        const libraryQuestionId = libraryQuestionAndType['id'];

        return this.renderMenuItem(
          () => this.loadLibraryQuestionContent(libraryQuestionId),
          `${libraryQuestionName} (${libraryQuestionType})`,
          i
        );
      }
    );
  }

  renderMenuItem = (clickHandler, textToDisplay, key) => {
    return (
      <MenuItem key={key} eventKey={key} onClick={clickHandler}>
        {textToDisplay}
      </MenuItem>
    );
  };

  loadLibraryQuestions(selectedLibraryNameAndVersion) {
    const libraryId = selectedLibraryNameAndVersion['id'];

    this.props.setLibraryData(selectedLibraryNameAndVersion);
    this.initializeLibraryQuestion(false);

    $.ajax({
      url: `/foorm/libraries/${libraryId}/question_names`,
      type: 'get'
    })
      .done(result => {
        this.props.resetAvailableLibraryQuestions(result);
        this.setState({
          hasLoadError: false
        });
      })
      .fail(() => {
        this.setState({
          hasLoadError: true
        });
      });
  }

  loadLibraryQuestionContent(libraryQuestionId) {
    this.resetSaveStatus();
    $.ajax({
      url: `/foorm/library_questions/${libraryQuestionId}`,
      type: 'get'
    })
      .done(result => {
        this.updateLibraryQuestionData(result);
        this.setState({
          showCodeMirror: true,
          hasLoadError: false
        });
      })
      .fail(() => {
        this.updateLibraryQuestionData({
          question: {},
          name: null,
          id: null
        });
        this.setState({
          showCodeMirror: true,
          hasLoadError: true
        });
      });
  }

  initializeNewLibrary = () => {
    this.props.resetAvailableLibraryQuestions([]);
    this.props.setLibraryData({
      name: null,
      version: null,
      id: null
    });
    this.initializeLibraryQuestion(true);
  };

  initializeLibraryQuestion = showCodeMirror => {
    this.updateLibraryQuestionData({
      question: {},
      name: null,
      id: null
    });

    this.resetSaveStatus();
    this.setState({
      hasLoadError: false,
      showCodeMirror: showCodeMirror
    });
  };

  resetSaveStatus = () => {
    this.props.setLastSaved(null);
    this.props.setSaveError(null);
  };

  updateLibraryQuestionData = libraryQuestionData => {
    this.props.setLibraryQuestionData(libraryQuestionData);
    this.props.setHasError(false);
    this.props.setLastSavedQuestion(libraryQuestionData['question']);
    this.props.resetCodeMirror(libraryQuestionData['question']);
  };

  areLibraryQuestionOptionsAvailable = () => {
    return !!(
      this.props.libraryId &&
      this.props.availableLibraryQuestionsForCurrentLibrary
    );
  };

  render() {
    return (
      <div>
        <h1>Foorm Library Editor</h1>
        <p>
          Interface for creating and making updates to Foorm libraries. Check
          out our{' '}
          <a
            href="https://github.com/code-dot-org/code-dot-org/wiki/%5BLevelbuilder%5D-The-Foorm-Editor"
            target="_blank"
            rel="noopener noreferrer"
          >
            How To
          </a>{' '}
          to get started.
        </p>
        <div>
          <DropdownButton
            id="load_config"
            title="Load Library..."
            className="btn"
          >
            {this.getFormattedLibraryDropdownOptions()}
          </DropdownButton>
          <Button onClick={this.initializeNewLibrary} className="btn">
            New Library
          </Button>
        </div>
        <div>
          <DropdownButton
            id="load_config"
            title="Load Library Question..."
            className="btn"
            disabled={!this.areLibraryQuestionOptionsAvailable()}
          >
            {this.getFormattedLibraryQuestionDropdownOptions()}
          </DropdownButton>
          <Button
            onClick={() => this.initializeLibraryQuestion(true)}
            className="btn"
            disabled={!this.areLibraryQuestionOptionsAvailable()}
          >
            New Library Question
          </Button>
        </div>
        {this.state.hasLoadError && (
          <div style={styles.loadError}>
            Could not load the selected library or library question.
          </div>
        )}
        {this.state.showCodeMirror && (
          <FoormLibraryEditor
            populateCodeMirror={this.props.populateCodeMirror}
            libraryCategories={this.props.libraryCategories}
            resetCodeMirror={this.props.resetCodeMirror}
          />
        )}
      </div>
    );
  }
}

export default connect(
  state => ({
    libraryQuestion: state.foorm.libraryQuestion || {},
    availableLibraries: state.foorm.availableLibraries || [],
    availableLibraryQuestionsForCurrentLibrary:
      state.foorm.availableLibraryQuestionsForCurrentLibrary || [],
    libraryId: state.foorm.libraryId
  }),
  dispatch => ({
    resetAvailableLibraries: librariesMetadata =>
      dispatch(resetAvailableLibraries(librariesMetadata)),
    resetAvailableLibraryQuestions: libraryQuestionsMetadata =>
      dispatch(resetAvailableLibraryQuestions(libraryQuestionsMetadata)),
    setLastSaved: lastSaved => dispatch(setLastSaved(lastSaved)),
    setSaveError: saveError => dispatch(setSaveError(saveError)),
    setLibraryQuestionData: libraryQuestionData =>
      dispatch(setLibraryQuestionData(libraryQuestionData)),
    setHasError: hasError => dispatch(setHasError(hasError)),
    setLastSavedQuestion: libraryQuestion =>
      dispatch(setLastSavedQuestion(libraryQuestion)),
    setLibraryData: libraryData => dispatch(setLibraryData(libraryData))
  })
)(FoormLibraryEditorManager);
