import React, {Component, PropTypes} from 'react';
import {Table, sort} from 'reactabular';
import wrappedSortable from '../tables/wrapped_sortable';
import orderBy from 'lodash/orderBy';
import PasswordReset from './PasswordReset';
import ShowSecret from './ShowSecret';
import {SectionLoginType} from '@cdo/apps/util/sharedConstants';
import i18n from "@cdo/locale";
import {tableLayoutStyles, sortableOptions} from "../tables/tableConstants";
import ManageStudentsNameCell from './ManageStudentsNameCell';
import ManageStudentsAgeCell from './ManageStudentsAgeCell';
import ManageStudentsGenderCell from './ManageStudentsGenderCell';
import ManageStudentsActionsCell from './ManageStudentsActionsCell';
import ManageStudentsActionsHeaderCell from './ManageStudentsActionsHeaderCell';
import SharingControlActionsHeaderCell from './SharingControlActionsHeaderCell';
import {convertStudentDataToArray, AddStatus, RowType, saveAllStudents} from './manageStudentsRedux';
import { connect } from 'react-redux';
import Notification, {NotificationType} from '../Notification';
import AddMultipleStudents from './AddMultipleStudents';
import Button from '../Button';
import experiments from '@cdo/apps/util/experiments';

const showShareColumn = experiments.isEnabled(experiments.SHARE_COLUMN);

const styles = {
  headerName: {
    width: '60%',
    float: 'left',
    marginRight: 5,
  },
  headerIcon : {
    width: '20%',
    float: 'left',
  }
};

const LOGIN_TYPES_WITH_PASSWORD_COLUMN = [
  SectionLoginType.word,
  SectionLoginType.picture,
  SectionLoginType.email,
];
const LOGIN_TYPES_WITH_ACTIONS_COLUMN = [
  SectionLoginType.word,
  SectionLoginType.picture,
  SectionLoginType.email,
  SectionLoginType.google_classroom,
  SectionLoginType.clever,
];

export const studentSectionDataPropType = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string,
  username: PropTypes.string,
  email: PropTypes.string,
  age: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  gender: PropTypes.string,
  secretWords: PropTypes.string,
  secretPicturePath: PropTypes.string,
  sectionId: PropTypes.number,
  loginType: PropTypes.string,
  rowType: PropTypes.oneOf(Object.values(RowType)),
});

/** @enum {number} */
export const COLUMNS = {
  NAME: 0,
  AGE: 1,
  GENDER: 2,
  PASSWORD: 3,
  ACTIONS: 4,
};

// Cell formatters.

const passwordFormatter = (loginType, {rowData}) => {
  return (
    <div>
      {!rowData.isEditing &&
        <div>
          {rowData.loginType === SectionLoginType.email &&
            <PasswordReset
              initialIsResetting={false}
              id={rowData.id}
            />
          }
          {(rowData.loginType === SectionLoginType.word || rowData.loginType === SectionLoginType.picture) &&
            <ShowSecret
              initialIsShowing={false}
              secretWord={rowData.secretWords}
              secretPicture={rowData.secretPicturePath}
              loginType={rowData.loginType}
              id={rowData.id}
            />
          }
        </div>
      }
      {rowData.isEditing &&
        <div>
          {i18n.autoGenerated()}
        </div>
      }
    </div>
  );
};

// The "add row" should always be pinned to the top when sorting.
// The "new student rows" should always be next.
// This function takes into account having multiple "add rows"
export const sortRows = (data, columnIndexList, orderList) => {
  let addRows = [];
  let newStudentRows = [];
  let studentRows = [];
  for (let i = 0; i<data.length; i++) {
    if (data[i].rowType === RowType.ADD) {
      addRows.push(data[i]);
    } else if (data[i].rowType === RowType.NEW_STUDENT) {
      newStudentRows.push(data[i]);
    } else {
      studentRows.push(data[i]);
    }
  }
  addRows = orderBy(addRows, columnIndexList, orderList);
  newStudentRows = orderBy(newStudentRows, columnIndexList, orderList);
  studentRows = orderBy(studentRows, columnIndexList, orderList);
  return addRows.concat(newStudentRows).concat(studentRows);
};

class ManageStudentsTable extends Component {
  static propTypes = {
    // Provided by redux
    studentData: PropTypes.arrayOf(studentSectionDataPropType),
    loginType: PropTypes.string,
    editingData: PropTypes.object,
    addStatus: PropTypes.object,
    saveAllStudents: PropTypes.func,
  };

  state = {
    [COLUMNS.NAME]: {
      direction: 'desc',
      position: 0
    }
  };

  ageFormatter = (age, {rowData}) => {
    const editedValue = rowData.isEditing ? this.props.editingData[rowData.id].age : 0;
    return (
      <ManageStudentsAgeCell
        age={age}
        id={rowData.id}
        isEditing={rowData.isEditing}
        editedValue={editedValue}
      />
    );
  };

  genderFormatter = (gender, {rowData}) => {
    const editedValue = rowData.isEditing ? this.props.editingData[rowData.id].gender : '';
    return (
      <ManageStudentsGenderCell
        gender={gender}
        id={rowData.id}
        isEditing={rowData.isEditing}
        editedValue={editedValue}
      />
    );
  };

  nameFormatter = (name, {rowData}) => {
    const editedValue = rowData.isEditing ? this.props.editingData[rowData.id].name : '';
    return (
      <ManageStudentsNameCell
        id={rowData.id}
        sectionId={rowData.sectionId}
        name={name}
        username={rowData.username}
        email={rowData.email}
        isEditing={rowData.isEditing}
        editedValue={editedValue}
      />
    );
  };

  actionsFormatter = (actions, {rowData}) => {
    let disableSaving = rowData.isEditing ? (this.props.editingData[rowData.id].name.length === 0) : false;
    return (
      <ManageStudentsActionsCell
        id={rowData.id}
        sectionId={rowData.sectionId}
        isEditing={rowData.isEditing}
        isSaving={rowData.isSaving}
        disableSaving={disableSaving}
        rowType={rowData.rowType}
        loginType={rowData.loginType}
      />
    );
  };

  actionsHeaderFormatter = () => {
    const numberOfEditingRows = Object.keys(this.props.editingData).length;
    return (
      <div>
        {numberOfEditingRows > 1 &&
          <Button
            onClick={this.props.saveAllStudents}
            color={Button.ButtonColor.orange}
            text={i18n.saveAll()}
          />
        }
        {numberOfEditingRows <= 1 &&
          <span>
            <div style={styles.headerName}>
              {i18n.actions()}
            </div>
            <div style={styles.headerIcon}>
              {showShareColumn &&
                <ManageStudentsActionsHeaderCell/>
              }
            </div>
          </span>
        }
      </div>
    );
  };

  projectSharingHeaderFormatter = () => {
    return (
      <span>
        <div style={styles.headerName}>
          {i18n.projectSharingColumnHeader()}
        </div>
        <div style={styles.headerIcon}>
          <SharingControlActionsHeaderCell/>
        </div>
      </span>
    );
  };

  getSortingColumns = () => {
    return this.state.sortingColumns || {};
  };

  // The user requested a new sorting column. Adjust the state accordingly.
  onSort = (selectedColumn) => {
    this.setState({
      sortingColumns: sort.byColumn({
        sortingColumns: this.state.sortingColumns,
        // Custom sortingOrder removes 'no-sort' from the cycle
        sortingOrder: {
          FIRST: 'asc',
          asc: 'desc',
          desc: 'asc'
        },
        selectedColumn
      })
    });
  };

  getColumns = (sortable) => {
    const {loginType} = this.props;
    const passwordLabel = loginType === SectionLoginType.email ? i18n.password() : i18n.secret();
    let dataColumns = [
      {
        property: 'name',
        header: {
          label: i18n.name(),
          props: {
            style: {
            ...tableLayoutStyles.headerCell,
            width: 300
          }},
          transforms: [sortable],
        },
        cell: {
          format: this.nameFormatter,
          props: {
            style: {
            ...tableLayoutStyles.cell,
            width: 300
          }}
        }
      },
      {
        property: 'age',
        header: {
          label: i18n.age(),
          props: {
            style: {
            ...tableLayoutStyles.headerCell,
            width: 100,
          }},
          transforms: [sortable],
        },
        cell: {
          format: this.ageFormatter,
          props: {
            style: {
            ...tableLayoutStyles.cell,
            width: 100,
          }}
        }
      },
      {
        property: 'gender',
        header: {
          label: i18n.gender(),
          props: {
            style: {
            ...tableLayoutStyles.headerCell,
            width: 130,
          }},
          transforms: [sortable],
        },
        cell: {
          format: this.genderFormatter,
          props: {
            style: {
            ...tableLayoutStyles.cell,
            width: 130,
          }}
        }
      },
    ];
    const passwordColumn = [
      {
        property: 'password',
        header: {
          label: passwordLabel,
          props: {
            style: {
            ...tableLayoutStyles.headerCell,
            ...tableLayoutStyles.unsortableHeader,
            width: 180,
          }},
        },
        cell: {
          format: passwordFormatter,
          props: {
            style: {
            ...tableLayoutStyles.cell,
            width: 180,
          }}
        }
      },
    ];
    const projectSharingColumn = [
      {
        property: 'projectSharing',
        header: {
          label: i18n.projectSharingColumnHeader(),
          format: this.projectSharingHeaderFormatter,
          props: {
            style: {
            ...tableLayoutStyles.headerCell,
            ...tableLayoutStyles.unsortableHeader,
          }},
        },
        cell: {
          props: {
            style: {
            ...tableLayoutStyles.cell,
          }}
        }
      },
    ];
    const controlsColumn = [
      {
        property: 'actions',
        header: {
          label: i18n.actions(),
          format: this.actionsHeaderFormatter,
          props: {
            style: {
            ...tableLayoutStyles.headerCell,
            ...tableLayoutStyles.unsortableHeader,
          }},
        },
        cell: {
          format: this.actionsFormatter,
          props: {
            style: {
            ...tableLayoutStyles.cell,
          }}
        }
      },
    ];

    if (LOGIN_TYPES_WITH_PASSWORD_COLUMN.includes(loginType)) {
      dataColumns = dataColumns.concat(passwordColumn);
    }
    //For now always show this column if the experiment flag is on.
    // TODO: (Erin B & Caley) update so visibility is controlled by project sharing dialog.
    if (showShareColumn) {
      dataColumns = dataColumns.concat(projectSharingColumn);
    }
    if (LOGIN_TYPES_WITH_ACTIONS_COLUMN.includes(loginType)) {
      dataColumns = dataColumns.concat(controlsColumn);
    }

    return dataColumns;
  };

  render() {
    // Define a sorting transform that can be applied to each column
    const sortable = wrappedSortable(this.getSortingColumns, this.onSort, sortableOptions);
    const columns = this.getColumns(sortable);
    const sortingColumns = this.getSortingColumns();

    const sortedRows = sort.sorter({
      columns,
      sortingColumns,
      sort: sortRows,
    })(this.props.studentData);

    const {addStatus, loginType} = this.props;

    return (
      <div>
        {addStatus.status === AddStatus.SUCCESS &&
          <Notification
            type={NotificationType.success}
            notice={i18n.manageStudentsNotificationSuccess()}
            details={i18n.manageStudentsNotificationAddSuccess({numStudents: addStatus.numStudents})}
            dismissible={false}
          />
        }
        {addStatus.status === AddStatus.FAIL &&
          <Notification
            type={NotificationType.failure}
            notice={i18n.manageStudentsNotificationFailure()}
            details={i18n.manageStudentsNotificationCannotAdd({numStudents: addStatus.numStudents})}
            dismissible={false}
          />
        }
        {(loginType === SectionLoginType.word || loginType === SectionLoginType.picture) &&
          <AddMultipleStudents/>
        }
        <Table.Provider
          columns={columns}
          style={tableLayoutStyles.table}
        >
          <Table.Header />
          <Table.Body rows={sortedRows} rowKey="id" />
        </Table.Provider>
      </div>
    );
  }
}

export const UnconnectedManageStudentsTable = ManageStudentsTable;

export default connect(state => ({
  loginType: state.manageStudents.loginType,
  studentData: convertStudentDataToArray(state.manageStudents.studentData),
  editingData: state.manageStudents.editingData,
  addStatus: state.manageStudents.addStatus,
}), dispatch => ({
  saveAllStudents() {
    dispatch(saveAllStudents());
  },
}))(ManageStudentsTable);
