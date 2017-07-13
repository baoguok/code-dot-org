import React from 'react';
import BaseDialog from '../BaseDialog';
import { classroomShape, loadErrorShape } from './shapes';
import color from '../../util/color';
import locale from '@cdo/locale';

const styles = {
  title: {
    position: 'absolute',
    left: 20,
    color: color.dark_charcoal,
    margin: '15px 0',
  },
  content: {
    position: 'absolute',
    left: 20,
    top: 50,
    right: 20,
    bottom: 70,
    overflowY: 'scroll',
  },
  classroomRow: {
    padding: 10,
    cursor: 'pointer',
  },
  highlightRow: {
    backgroundColor: color.default_blue,
    color: color.white,
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    right: 20,
    left: 20,
  },
  buttonPrimary: {
    float: 'right',
    background: color.orange,
    color: color.white,
    border: '1px solid #b07202',
    borderRadius: 3,
    boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.63)',
    fontSize: 14,
    padding: '8px 20px',
  },
  buttonSecondary: {
    float: 'left',
    background: '#eee',
    color: '#5b6770',
    border: '1px solid #c5c5c5',
  },
  error: {
    fontSize: 10,
    color: color.light_gray,
  },
};

const ClassroomList = ({classrooms, onSelect, selectedId, provider}) => classrooms.length ?
  <div>
    {classrooms.map(classroom => (
      <div
        style={Object.assign({},
          styles.classroomRow,
          selectedId === classroom.id && styles.highlightRow
        )}
        key={classroom.id}
        onClick={onSelect.bind(null, classroom.id)}
      >
        {classroom.name}
        {classroom.section &&
          <span style={{color: '#aaa'}}> ({classroom.section})</span>
        }
        <span style={{float: 'right'}}>
          {locale.code()}
          <span style={{fontFamily: 'monospace'}}> {classroom.enrollment_code}</span>
        </span>
      </div>
    ))}
  </div> :
  <div>
    <p>
      {locale.noClassroomsFound()}
    </p>
    {provider === 'google' ?
      <a href="https://classroom.google.com/">
        {locale.addRemoveGoogleClassrooms()}
      </a> :
      <a href="https://clever.com/">
        {locale.addRemoveCleverClassrooms()}
      </a>
    }
  </div>
;
ClassroomList.propTypes = {
  classrooms: React.PropTypes.array.isRequired,
  onSelect: React.PropTypes.func.isRequired,
  selectedId: React.PropTypes.string,
  provider: React.PropTypes.oneOf(['google', 'clever']),
};

const LoadError = ({error, studioUrl}) =>
  <div>
    <a href={`${studioUrl}/users/auth/google_oauth2?scope=classroom.courses.readonly,classroom.rosters.readonly`}>
      {locale.authorizeGoogleClassrooms()}
    </a>
    <p style={styles.error}>
      {error.status} {error.message}
    </p>
  </div>;
LoadError.propTypes = {
  error: loadErrorShape,
  studioUrl: React.PropTypes.string.isRequired,
};

export default class RosterDialog extends React.Component {
  static propTypes = {
    handleImport: React.PropTypes.func,
    handleCancel: React.PropTypes.func,
    isOpen: React.PropTypes.bool,
    classrooms: React.PropTypes.arrayOf(classroomShape),
    loadError: loadErrorShape,
    studioUrl: React.PropTypes.string.isRequired,
    provider: React.PropTypes.oneOf(['google', 'clever']),
  }

  constructor(props) {
    super(props);
    this.state = {};
  }

  importClassroom = () => {
    this.props.handleImport(this.state.selectedId);
    this.setState({selectedId: null});
  };

  cancel = () => {
    this.props.handleCancel();
  };

  onClassroomSelected = id => {
    this.setState({selectedId: id});
  };

  render() {
    return (
      <BaseDialog
        useUpdatedStyles
        isOpen={this.props.isOpen}
        handleClose={this.cancel}
        assetUrl={() => ''}
        {...this.props}
      >
        <h2 style={styles.title}>
          {this.props.provider === 'google' ?
            locale.selectGoogleClassroom() :
            locale.selectCleverClassroom()
          }
        </h2>
        <div style={styles.content}>
          {this.props.loadError ?
            <LoadError
              error={this.props.loadError}
              studioUrl={this.props.studioUrl}
            /> :
            this.props.classrooms ?
              <ClassroomList
                classrooms={this.props.classrooms}
                onSelect={this.onClassroomSelected}
                selectedId={this.state.selectedId}
                provider={this.props.provider}
              /> :
              locale.loading()
          }
        </div>
        <div style={styles.footer}>
          <button
            onClick={this.cancel}
            style={{...styles.buttonPrimary, ...styles.buttonSecondary}}
          >
            {locale.dialogCancel()}
          </button>
          <button
            onClick={this.importClassroom}
            style={Object.assign({},
              styles.buttonPrimary,
              !this.state.selectedId && {opacity: 0.5}
            )}
            disabled={!this.state.selectedId}
          >
            {locale.chooseSection()}
          </button>
        </div>
      </BaseDialog>
    );
  }
}
