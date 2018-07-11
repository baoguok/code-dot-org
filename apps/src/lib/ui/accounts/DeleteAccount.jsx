import React, {PropTypes} from 'react';
import $ from 'jquery';
import i18n from '@cdo/locale';
import color from '@cdo/apps/util/color';
import {ADD_A_PERSONAL_LOGIN_HELP_URL} from '@cdo/apps/lib/util/urlHelpers';
import {navigateToHref} from '@cdo/apps/utils';
import BootstrapButton from './BootstrapButton';
import DeleteAccountDialog from './DeleteAccountDialog';

export const DELETE_VERIFICATION_STRING = i18n.deleteAccountDialog_verificationString();
const styles = {
  container: {
    paddingTop: 20,
  },
  hr: {
    borderColor: color.red,
  },
  header: {
    fontSize: 22,
    color: color.red,
  },
  warning: {
    marginTop: 10,
    marginBottom: 10,
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
};
const DEFAULT_STATE = {
  isDialogOpen: false,
  password: '',
  passwordError: '',
  deleteVerification: '',
  deleteError: '',
};

export default class DeleteAccount extends React.Component {
  static propTypes = {
    isPasswordRequired: PropTypes.bool.isRequired,
    isTeacher: PropTypes.bool.isRequired,
  };

  state = DEFAULT_STATE;

  toggleDialog = () => {
    this.setState(state => {
      return {
        ...DEFAULT_STATE,
        isDialogOpen: !state.isDialogOpen
      };
    });
  };

  onPasswordChange = (event) => {
    this.setState({
      password: event.target.value
    });
  };

  onDeleteVerificationChange = (event) => {
    this.setState({
      deleteVerification: event.target.value
    });
  };

  isValid = () => {
    const {password, deleteVerification} = this.state;
    const isPasswordValid = this.props.isPasswordRequired ? (password.length > 0) : true;
    return isPasswordValid && deleteVerification === DELETE_VERIFICATION_STRING;
  };

  deleteUser = () => {
    const payload = {
      new_destroy_flow: true,
      password_confirmation: this.state.password
    };

    $.ajax({
      url: '/users',
      method: 'DELETE',
      data: payload
    }).done(result => {
      navigateToHref('/');
    }).fail((jqXhr, _) => {
      this.onFailure(jqXhr);
    });
  };

  onFailure = (xhr) => {
    const responseJSON = xhr.responseJSON;
    let newState;
    if (responseJSON && responseJSON.error) {
      const passwordErrors = responseJSON.error.current_password;
      newState = {passwordError: passwordErrors[0]};
    } else {
      newState = {deleteError: `Unexpected error: ${xhr.status}`};
    }

    this.setState(newState);
  };

  render() {
    return (
      <div style={styles.container}>
        <hr style={styles.hr} />
        <h2 style={styles.header}>
          {i18n.deleteAccount()}
        </h2>
        <div style={styles.warning}>
          {!this.props.isTeacher && i18n.deleteAccount_studentWarning()}
          {this.props.isTeacher &&
            <div>
              <p>
                {i18n.deleteAccount_teacherWarning1()}
                <strong>{i18n.deleteAccount_teacherWarning2()}</strong>
                {i18n.deleteAccount_teacherWarning3()}
              </p>
              <p>
                {i18n.deleteAccount_teacherWarning4()}
                <a
                  href={ADD_A_PERSONAL_LOGIN_HELP_URL}
                  target="_blank"
                >
                  {i18n.deleteAccount_teacherWarning5()}
                </a>
                {i18n.deleteAccount_teacherWarning6()}
              </p>
            </div>
          }
        </div>
        <div style={styles.buttonContainer}>
          {/* This button intentionally uses BootstrapButton to match other account page buttons */}
          <BootstrapButton
            type="danger"
            text={i18n.deleteAccount()}
            onClick={this.toggleDialog}
          />
        </div>
        <DeleteAccountDialog
          isOpen={this.state.isDialogOpen}
          isPasswordRequired={this.props.isPasswordRequired}
          isTeacher={this.props.isTeacher}
          password={this.state.password}
          passwordError={this.state.passwordError}
          deleteVerification={this.state.deleteVerification}
          onPasswordChange={this.onPasswordChange}
          onDeleteVerificationChange={this.onDeleteVerificationChange}
          onCancel={this.toggleDialog}
          disableConfirm={!this.isValid()}
          deleteUser={this.deleteUser}
          deleteError={this.state.deleteError}
        />
      </div>
    );
  }
}
