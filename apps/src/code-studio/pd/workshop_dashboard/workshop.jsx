/**
 * Workshop view / edit. Displays and optionally edits details for a workshop.
 * Routes:
 *   /workshops/:workshopId
 *   /Workshops/:workshopId/edit
 */
import $ from 'jquery';
import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import moment from 'moment';
import {Grid, Row, Col, ButtonToolbar, Button} from 'react-bootstrap';
import ConfirmationDialog from '../components/confirmation_dialog';
import MoveEnrollmentsDialog from './components/move_enrollments_dialog';
import WorkshopForm from './components/workshop_form';
import WorkshopEnrollment from './components/workshop_enrollment';
import Spinner from '../components/spinner';
import {PermissionPropType, WorkshopAdmin} from './permission';
import WorkshopPanel from './WorkshopPanel';
import SignUpPanel from './SignUpPanel';
import IntroPanel from './IntroPanel';
import AttendancePanel from './AttendancePanel';

const styles = {
  linkButton: {
    color: 'inherit'
  },
  error: {
    color: 'red',
    display: 'inline',
    paddingLeft: '10px'
  }
};

export class Workshop extends React.Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  static propTypes = {
    params: PropTypes.shape({
      workshopId: PropTypes.string.isRequired
    }).isRequired,
    route: PropTypes.shape({
      view: PropTypes.string
    }).isRequired,
    permission: PermissionPropType.isRequired
  };

  constructor(props) {
    super(props);

    if (props.params.workshopId) {
      this.state = {
        loadingWorkshop: true,
        loadingEnrollments: true,
        enrollmentActiveTab: 0,
        showAdminEditConfirmation: false,
        selectedEnrollments: [],
        isMoveEnrollmentsDialogOpen: false
      };
    }
  }

  componentDidMount() {
    this.loadWorkshop();
    this.loadEnrollments();
  }

  shouldComponentUpdate() {
    // Workshop admins can always edit
    if (this.props.permission.has(WorkshopAdmin)) {
      return true;
    }

    // Don't allow editing a workshop that has been started.
    if (
      this.props.route.view === 'edit' &&
      this.state.workshop &&
      this.state.workshop.state !== 'Not Started'
    ) {
      this.context.router.replace(`/workshops/${this.props.params.workshopId}`);
      return false;
    }
    return true;
  }

  loadWorkshop() {
    this.loadWorkshopRequest = $.ajax({
      method: 'GET',
      url: `/api/v1/pd/workshops/${this.props.params.workshopId}`,
      dataType: 'json'
    })
      .done(data => {
        this.setState({
          loadingWorkshop: false,
          workshop: _.pick(data, [
            'id',
            'organizer',
            'facilitators',
            'location_name',
            'location_address',
            'capacity',
            'enrolled_teacher_count',
            'on_map',
            'funded',
            'funding_type',
            'course',
            'subject',
            'notes',
            'sessions',
            'state',
            'account_required_for_attendance?',
            'ready_to_close?',
            'regional_partner_name',
            'regional_partner_id',
            'scholarship_workshop?',
            'potential_organizers',
            'created_at'
          ])
        });
      })
      .fail(data => {
        if (data.statusText !== 'abort') {
          this.setState({
            loadingWorkshop: false,
            workshop: null
          });
        }
      })
      .always(() => {
        this.loadWorkshopRequest = null;
      });
  }

  loadEnrollments() {
    this.setState({loadingEnrollments: true});
    this.loadEnrollmentsRequest = $.ajax({
      method: 'GET',
      url: `/api/v1/pd/workshops/${this.props.params.workshopId}/enrollments`,
      dataType: 'json'
    }).done(data => {
      this.setState({
        loadingEnrollments: false,
        enrollments: data,
        workshop: _.merge(_.cloneDeep(this.state.workshop), {
          enrolled_teacher_count: data.length
        })
      });
      this.loadEnrollmentsRequest = null;
    });
  }

  handleDeleteEnrollment = id => {
    this.deleteEnrollmentRequest = $.ajax({
      method: 'DELETE',
      url: `/api/v1/pd/workshops/${
        this.props.params.workshopId
      }/enrollments/${id}`,
      dataType: 'json'
    }).done(() => {
      // reload
      this.loadEnrollments();
      this.deleteEnrollmentRequest = null;
    });
  };

  handleMoveEnrollments = (destinationWorkshopId, selectedEnrollments) => {
    const enrollmentIds = selectedEnrollments.map(enrollment => {
      return enrollment.id;
    });
    const urlParams = `destination_workshop_id=${destinationWorkshopId}&enrollment_ids[]=${enrollmentIds.join(
      '&enrollment_ids[]='
    )}`;
    this.moveEnrollmentRequest = $.ajax({
      method: 'POST',
      url: `/api/v1/pd/enrollments/move?${urlParams}`,
      traditional: true
    })
      .done(() => {
        // reload
        this.loadEnrollments();
        this.moveEnrollmentRequest = null;
      })
      .fail(() => {
        this.setState({
          error: 'Error: unable to move enrollments'
        });
        this.loadEnrollments();
        this.moveEnrollmentRequest = null;
      });
  };

  handleClickSelect = enrollment => {
    if (
      this.state.selectedEnrollments.findIndex(e => e.id === enrollment.id) >= 0
    ) {
      this.setState(state => {
        const selectedEnrollments = state.selectedEnrollments.filter(e => {
          return e.id !== enrollment.id;
        });
        return {selectedEnrollments};
      });
    } else {
      this.setState(state => {
        state.selectedEnrollments.push({
          id: enrollment.id,
          email: enrollment.email,
          first_name: enrollment.first_name,
          last_name: enrollment.last_name
        });
      });
    }
  };

  handleClickMove = () => {
    this.setState({isMoveEnrollmentsDialogOpen: true});
  };

  handleMoveEnrollmentsCanceled = () => {
    this.setState({
      isMoveEnrollmentsDialogOpen: false
    });
  };

  handleMoveEnrollmentsConfirmed = destinationWorkshopId => {
    this.setState({
      isMoveEnrollmentsDialogOpen: false,
      selectedEnrollments: []
    });
    this.handleMoveEnrollments(
      destinationWorkshopId,
      this.state.selectedEnrollments
    );
  };

  componentWillUnmount() {
    if (this.loadWorkshopRequest) {
      this.loadWorkshopRequest.abort();
    }
    if (this.loadEnrollmentsRequest) {
      this.loadEnrollmentsRequest.abort();
    }
    if (this.deleteEnrollmentRequest) {
      this.deleteEnrollmentRequest.abort();
    }
  }

  handleAdminEditClick = () => this.setState({showAdminEditConfirmation: true});
  handleAdminEditCancel = () =>
    this.setState({showAdminEditConfirmation: false});
  handleAdminEditConfirmed = () => {
    this.setState({showAdminEditConfirmation: false});
    this.handleEditClick();
  };

  handleEditClick = () => {
    this.context.router.push(`/workshops/${this.props.params.workshopId}/edit`);
  };

  handleBackClick = () => {
    this.context.router.push('/workshops');
  };

  handleWorkshopSaved = workshop => {
    this.setState({workshop: workshop});
    this.context.router.replace(`/workshops/${this.props.params.workshopId}`);
  };

  handleSaveClick = () => {
    // This button is just a shortcut to click the Save button in the form component,
    // which will handle the logic.
    $('#workshop-form-save-btn').trigger('click');
  };

  handleEnrollmentRefreshClick = () => {
    this.loadEnrollments();
  };

  handleEnrollmentDownloadClick = () => {
    window.open(
      `/api/v1/pd/workshops/${this.props.params.workshopId}/enrollments.csv`
    );
  };

  handleEnrollmentActiveTabSelect = enrollmentActiveTab => {
    this.setState({enrollmentActiveTab});
  };

  renderDetailsPanelHeader() {
    let button = null;

    if (this.props.route.view === 'edit') {
      button = (
        <Button
          bsSize="xsmall"
          bsStyle="primary"
          onClick={this.handleSaveClick}
        >
          Save
        </Button>
      );
    } else if (this.state.workshop.state === 'Not Started') {
      button = (
        <Button bsSize="xsmall" onClick={this.handleEditClick}>
          Edit
        </Button>
      );
    } else if (this.props.permission.has(WorkshopAdmin)) {
      if (this.state.showAdminEditConfirmation) {
        return (
          <ConfirmationDialog
            show={true}
            onOk={this.handleAdminEditConfirmed}
            onCancel={this.handleAdminEditCancel}
            headerText={`Edit ${this.state.workshop.state} Workshop?`}
            bodyText={`Are you sure you want to edit this ${this.state.workshop.state.toLowerCase()} workshop?
            Use caution! Note that deleting a session (day)
            will also delete all associated attendance records.
            `}
          />
        );
      }
      button = (
        <Button bsSize="xsmall" onClick={this.handleAdminEditClick}>
          Edit (admin)
        </Button>
      );
    }

    return <span>Workshop Details: {button}</span>;
  }

  renderDetailsPanelContent() {
    if (this.props.route.view === 'edit') {
      return (
        <div>
          <WorkshopForm
            workshop={this.state.workshop}
            onSaved={this.handleWorkshopSaved}
          />
        </div>
      );
    }

    let editButton = null;
    if (this.state.workshop.state === 'Not Started') {
      editButton = <Button onClick={this.handleEditClick}>Edit</Button>;
    }

    return (
      <div>
        <WorkshopForm workshop={this.state.workshop} readOnly>
          <Row>
            <Col sm={4}>
              <ButtonToolbar>
                {editButton}
                <Button onClick={this.handleBackClick}>Back</Button>
              </ButtonToolbar>
            </Col>
          </Row>
        </WorkshopForm>
      </div>
    );
  }

  renderDetailsPanel() {
    return (
      <WorkshopPanel header={this.renderDetailsPanelHeader()}>
        {this.renderDetailsPanelContent()}
      </WorkshopPanel>
    );
  }

  renderEnrollmentsPanel() {
    const header = (
      <div>
        Workshop Enrollment: {this.state.workshop.enrolled_teacher_count}/
        {this.state.workshop.capacity}
        <Button
          bsStyle="link"
          style={styles.linkButton}
          onClick={this.handleEnrollmentRefreshClick}
        >
          <i className="fa fa-refresh" />
        </Button>
        <Button
          bsStyle="link"
          style={styles.linkButton}
          onClick={this.handleEnrollmentDownloadClick}
        >
          <i className="fa fa-arrow-circle-down" />
        </Button>
        {this.props.permission.has(WorkshopAdmin) && (
          <Button
            bsSize="xsmall"
            disabled={this.state.selectedEnrollments.length === 0}
            onClick={this.handleClickMove}
          >
            Move (admin)
            <MoveEnrollmentsDialog
              show={this.state.isMoveEnrollmentsDialogOpen}
              selectedEnrollments={this.state.selectedEnrollments}
              onCancel={this.handleMoveEnrollmentsCanceled}
              onMove={this.handleMoveEnrollmentsConfirmed}
            />
          </Button>
        )}
        <p style={styles.error}>{this.state.error}</p>
      </div>
    );

    let contents = null;
    if (this.state.loadingEnrollments) {
      contents = <Spinner />;
    } else {
      const firstSessionDate = moment
        .utc(this.state.workshop.sessions[0].start)
        .format('MMMM Do');
      contents = (
        <WorkshopEnrollment
          workshopId={this.props.params.workshopId}
          workshopCourse={this.state.workshop.course}
          workshopSubject={this.state.workshop.subject}
          workshopDate={firstSessionDate}
          numSessions={this.state.workshop.sessions.length}
          enrollments={this.state.enrollments}
          onDelete={this.handleDeleteEnrollment}
          onClickSelect={this.handleClickSelect}
          accountRequiredForAttendance={
            this.state.workshop['account_required_for_attendance?']
          }
          scholarshipWorkshop={this.state.workshop['scholarship_workshop?']}
          activeTab={this.state.enrollmentActiveTab}
          onTabSelect={this.handleEnrollmentActiveTabSelect}
          selectedEnrollments={this.state.selectedEnrollments}
        />
      );
    }

    return <WorkshopPanel header={header}>{contents}</WorkshopPanel>;
  }

  render() {
    if (this.state.loadingWorkshop) {
      return <Spinner />;
    } else if (!this.state.workshop) {
      return <p>No workshop found</p>;
    }

    const {workshopId} = this.props.params;
    const {workshop} = this.state;
    const {sessions, state: workshopState} = workshop;

    return (
      <Grid>
        {workshopState === 'Not Started' && (
          <SignUpPanel workshopId={workshopId} />
        )}
        <IntroPanel
          workshopId={workshopId}
          workshopState={workshopState}
          sessions={sessions}
          isAccountRequiredForAttendance={
            this.state.workshop['account_required_for_attendance?']
          }
          isWorkshopAdmin={this.props.permission.has(WorkshopAdmin)}
          loadWorkshop={this.loadWorkshop.bind(this)}
        />
        {workshopState !== 'Not Started' && (
          <AttendancePanel workshopId={workshopId} sessions={sessions} />
        )}
        {workshopState === 'In Progress' && (
          <EndWorkshopPanel
            workshopId={workshopId}
            isReadyToClose={this.state.workshop['ready_to_close?']}
            loadWorkshop={this.loadWorkshop.bind(this)}
          />
        )}
        {this.renderEnrollmentsPanel()}
        {this.renderDetailsPanel()}
        <MetadataFooter createdAt={this.state.workshop.created_at} />
      </Grid>
    );
  }
}

export default connect(state => ({
  permission: state.workshopDashboard.permission
}))(Workshop);

/**
 * A small, right-aligned section at the end of the workshop dashboard showing
 * metadata we want to be able to check occasionally, like the workshop created_at date.
 * @param {string} createdAt - and ISO 8601 date string
 * @returns {Component}
 * @constructor
 */
const MetadataFooter = ({createdAt}) => (
  <Row>
    <Col sm={12}>
      <div style={METADATA_FOOTER_STYLE}>
        Workshop created {new Date(createdAt).toLocaleDateString('en-US')}.
      </div>
    </Col>
  </Row>
);
MetadataFooter.propTypes = {
  createdAt: PropTypes.string.isRequired // An ISO 8601 date string
};
const METADATA_FOOTER_STYLE = {
  textAlign: 'right',
  fontSize: 'smaller',
  fontStyle: 'italic'
};

class EndWorkshopPanel extends React.Component {
  static propTypes = {
    workshopId: PropTypes.string,
    isReadyToClose: PropTypes.bool,
    loadWorkshop: PropTypes.func.isRequired
  };

  state = {
    showEndWorkshopConfirmation: false
  };

  componentWillUnmount() {
    if (this.endRequest) {
      this.endRequest.abort();
    }
  }

  handleEndWorkshopClick = () => {
    this.setState({showEndWorkshopConfirmation: true});
  };

  handleEndWorkshopCancel = () => {
    this.setState({showEndWorkshopConfirmation: false});
  };

  handleEndWorkshopConfirmed = () => {
    const {workshopId, loadWorkshop} = this.props;

    this.endRequest = $.ajax({
      method: 'POST',
      url: `/api/v1/pd/workshops/${workshopId}/end`,
      dataType: 'json'
    })
      .done(() => {
        this.setState({showEndWorkshopConfirmation: false});
        loadWorkshop();
      })
      .fail(data => {
        if (data.statusText !== 'abort') {
          console.log(`Failed to end workshop: ${workshopId}`);
          alert(
            "We're sorry, we were unable to end the workshop. Please try again."
          );
        }
      })
      .always(() => {
        this.endRequest = null;
      });
  };

  render() {
    const {isReadyToClose} = this.props;
    return (
      <WorkshopPanel header="End Workshop:">
        <div>
          <p>
            After the last day of your workshop, you must end the workshop. This
            will generate a report to Code.org as well as email teachers a
            survey regarding the workshop.
          </p>
          <Button onClick={this.handleEndWorkshopClick}>
            End Workshop and Send Survey
          </Button>
          <ConfirmationDialog
            show={this.state.showEndWorkshopConfirmation}
            onOk={this.handleEndWorkshopConfirmed}
            okText={isReadyToClose ? 'OK' : 'Yes, end this workshop'}
            onCancel={this.handleEndWorkshopCancel}
            headerText="End Workshop and Send Survey"
            bodyText={
              isReadyToClose
                ? 'Are you sure? Once ended, the workshop cannot be restarted.'
                : 'There are still sessions remaining in this workshop. ' +
                  'Once a workshop is ended, attendees can no longer mark themselves as attended for the remaining sessions. ' +
                  'Are you sure you want to end this workshop?'
            }
            width={isReadyToClose ? 500 : 800}
          />
        </div>
      </WorkshopPanel>
    );
  }
}
