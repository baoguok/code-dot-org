import { assert } from '../../../util/configuredChai';
import manageStudents, {
  setLoginType,
  setSectionId,
  setStudents,
  convertStudentDataToArray,
  startEditingStudent,
  cancelEditingStudent,
  removeStudent,
  setSecretImage,
  setSecretWords,
  editStudent,
  startSavingStudent,
  saveStudentSuccess,
} from '@cdo/apps/templates/manageStudents/manageStudentsRedux';

const studentEmailData = {
  1: {
      id: 1,
      name: 'StudentNameA',
      username: 'student1',
      userType: 'student',
      age: 17,
      gender: 'f',
      loginType: 'email',
      secretWords: 'wizard',
      secretPictureName: 'wizard',
      secretPicturePath: '/wizard.jpg',
      sectionId: 53,
    },
  2: {
      id: 2,
      name: 'StudentNameC',
      username: 'student2',
      userType: 'student',
      age: 14,
      gender: 'm',
      loginType: 'email',
      secretWords: 'wizard',
      secretPictureName: 'wizard',
      secretPicturePath: '/wizard.jpg',
      sectionId: 53,
    },
  3: {
      id: 3,
      name: 'StudentNameD',
      username: 'student3',
      userType: 'student',
      age: 9,
      gender: 'm',
      loginType: 'email',
      secretWords: 'wizard',
      secretPictureName: 'wizard',
      secretPicturePath: '/wizard.jpg',
      sectionId: 53,
    },
};

const studentPictureData = {
  1: {
      id: 1,
      name: 'StudentNameA',
      username: 'student1',
      userType: 'student',
      age: 17,
      gender: 'f',
      loginType: 'picture',
      secretWords: 'wizard',
      secretPictureName: 'wizard',
      secretPicturePath: '/wizard.jpg',
      sectionId: 53,
    },
  2: {
      id: 2,
      name: 'StudentNameC',
      username: 'student2',
      userType: 'student',
      age: 14,
      gender: 'm',
      loginType: 'picture',
      secretWords: 'wizard',
      secretPictureName: 'wizard',
      secretPicturePath: '/wizard.jpg',
      sectionId: 53,
    },
  3: {
      id: 3,
      name: 'StudentNameD',
      username: 'student3',
      userType: 'student',
      age: 9,
      gender: 'm',
      loginType: 'picture',
      secretWords: 'wizard',
      secretPictureName: 'wizard',
      secretPicturePath: '/wizard.jpg',
      sectionId: 53,
    },
};

describe('manageStudentsRedux', () => {
  const initialState = manageStudents(undefined, {});

  describe('setLoginType', () => {
    it('sets login type for the section in view', () => {
      const action = setLoginType('picture');
      const nextState = manageStudents(initialState, action);
      assert.deepEqual(nextState.loginType, 'picture');
    });
  });

  describe('setSectionId', () => {
    it('sets section id for the section in view', () => {
      const action = setSectionId('123abc');
      const nextState = manageStudents(initialState, action);
      assert.deepEqual(nextState.sectionId, '123abc');
    });
  });

  describe('setStudents', () => {
    it('sets student data for the section in view', () => {
      const action = setStudents(studentEmailData);
      const nextState = manageStudents(initialState, action);
      assert.deepEqual(nextState.studentData, studentEmailData);
    });
  });

  describe('convertStudentDataToArray', () => {
    it('converts studentData to an array of student objects', () => {
      const studentDataArray = convertStudentDataToArray(studentEmailData);
      assert.equal(studentDataArray.length, 3);
      assert.equal(studentDataArray[0], studentEmailData[1]);
      assert.equal(studentDataArray[1], studentEmailData[2]);
      assert.equal(studentDataArray[2], studentEmailData[3]);
    });
  });

  describe('startEditingStudent', () => {
    it('sets student isEditing to true', () => {
      const setStudentsAction = setStudents(studentEmailData);
      const nextState = manageStudents(initialState, setStudentsAction);
      const startEditingStudentAction = startEditingStudent(1);
      const finalState = manageStudents(nextState, startEditingStudentAction);
      assert.deepEqual(finalState.studentData[1].isEditing, true);
    });

    it('sets editingData to be studentData', () => {
      const setStudentsAction = setStudents(studentEmailData);
      const nextState = manageStudents(initialState, setStudentsAction);
      const startEditingStudentAction = startEditingStudent(1);
      const finalState = manageStudents(nextState, startEditingStudentAction);
      assert.deepEqual(finalState.editingData[1], studentEmailData[1]);
    });
  });

  describe('cancelEditingStudent', () => {
    it('sets student isEditing to false', () => {
      const setStudentsAction = setStudents(studentEmailData);
      const nextState = manageStudents(initialState, setStudentsAction);
      const startEditingStudentAction = startEditingStudent(1);
      const stateAfterEditing = manageStudents(nextState, startEditingStudentAction);
      const cancelEditingStudentAction = cancelEditingStudent(1);
      const finalState = manageStudents(stateAfterEditing, cancelEditingStudentAction);
      assert.deepEqual(finalState.studentData[1].isEditing, false);
    });
  });

  describe('removeStudent', () => {
    it('deletes a student with a given id', () => {
      const setStudentsAction = setStudents(studentEmailData);
      const nextState = manageStudents(initialState, setStudentsAction);
      const removeStudentAction = removeStudent(1);
      const stateAfterDeleting = manageStudents(nextState, removeStudentAction);
      assert.equal(stateAfterDeleting.studentData[1], undefined);
      assert.deepEqual(stateAfterDeleting.studentData[2], studentEmailData[2]);
      assert.deepEqual(stateAfterDeleting.studentData[3], studentEmailData[3]);
    });
  });

  describe('setSecretImage', () => {
    it('sets an image for a student given id', () => {
      const setStudentsAction = setStudents(studentPictureData);
      const nextState = manageStudents(initialState, setStudentsAction);
      const setSecretImageAction = setSecretImage(1, '/cat.jpg');
      const stateAfterUpdating = manageStudents(nextState, setSecretImageAction);
      assert.equal(stateAfterUpdating.studentData[1].secretPicturePath, '/cat.jpg');
      assert.deepEqual(stateAfterUpdating.studentData[2].secretPicturePath, studentEmailData[2].secretPicturePath);
      assert.deepEqual(stateAfterUpdating.studentData[3].secretPicturePath, studentEmailData[3].secretPicturePath);
    });
  });

  describe('setSecretWords', () => {
    it('sets words for a student given id', () => {
      const setStudentsAction = setStudents(studentPictureData);
      const nextState = manageStudents(initialState, setStudentsAction);
      const setSecretWordsAction = setSecretWords(1, 'cats');
      const stateAfterUpdating = manageStudents(nextState, setSecretWordsAction);
      assert.equal(stateAfterUpdating.studentData[1].secretWords, 'cats');
      assert.deepEqual(stateAfterUpdating.studentData[2].secretWords, studentEmailData[2].secretWords);
      assert.deepEqual(stateAfterUpdating.studentData[3].secretWords, studentEmailData[3].secretWords);
    });
  });

  describe('editStudent', () => {
    it('sets editingData to new updated values', () => {
      // Set up a student that is in the editing state.
      const setStudentsAction = setStudents(studentEmailData);
      const nextState = manageStudents(initialState, setStudentsAction);
      const startEditingStudentAction = startEditingStudent(1);
      const editingState = manageStudents(nextState, startEditingStudentAction);

      // Edit name, age, and gender and verify data is updated.
      const editStudentNameAction = editStudent(1, {name: "New name"});
      const stateWithName = manageStudents(editingState, editStudentNameAction);
      assert.deepEqual(stateWithName.editingData[1], {
        ...studentEmailData[1],
        name: "New name",
      });

      const editStudentAgeAction = editStudent(1, {age: 13});
      const stateWithAge = manageStudents(stateWithName, editStudentAgeAction);
      assert.deepEqual(stateWithAge.editingData[1], {
        ...studentEmailData[1],
        name: "New name",
        age: 13,
      });

      const editStudentGenderAction = editStudent(1, {gender: 'm'});
      const stateWithGender = manageStudents(stateWithAge, editStudentGenderAction);
      assert.deepEqual(stateWithGender.editingData[1], {
        ...studentEmailData[1],
        name: "New name",
        age: 13,
        gender: 'm',
      });
    });
  });

  describe('saving edited data of a student', () => {
    it('startSavingStudent sets student to disabled saving mode', () => {
      // Start editing student
      const setStudentsAction = setStudents(studentEmailData);
      const nextState = manageStudents(initialState, setStudentsAction);
      const startEditingStudentAction = startEditingStudent(1);
      const editingState = manageStudents(nextState, startEditingStudentAction);

      // Start saving student
      const startSavingAction = startSavingStudent(1);
      const startedSavingState = manageStudents(editingState, startSavingAction);
      assert.equal(startedSavingState.studentData[1].isEditing, true);
      assert.equal(startedSavingState.studentData[1].isSaving, true);
    });

    it('saveStudentSuccess updates studentData and removes editingData', () => {
      // Edit and start saving a student
      const setStudentsAction = setStudents(studentEmailData);
      const nextState = manageStudents(initialState, setStudentsAction);
      const startEditingStudentAction = startEditingStudent(1);
      const editingState = manageStudents(nextState, startEditingStudentAction);
      const editStudentNameAction = editStudent(1, {name: "New name"});
      const editedState = manageStudents(editingState, editStudentNameAction);
      const startSavingAction = startSavingStudent(1);
      const startedSavingState = manageStudents(editedState, startSavingAction);

      // Save student success
      const saveStudentSuccessAction = saveStudentSuccess(1);
      const afterSaveState = manageStudents(startedSavingState, saveStudentSuccessAction);

      assert.equal(afterSaveState.editingData[1], null);
      assert.equal(afterSaveState.studentData[1].isEditing, false);
      assert.equal(afterSaveState.studentData[1].isSaving, false);
      assert.equal(afterSaveState.studentData[1].name, "New name");
    });
  });

  describe('add student', () => {
    const expectedBlankRow = {
      id: 0,
      name: '',
      age: '',
      gender: '',
      username: '',
      loginType: '',
      isEditing: true,
      isAddRow: true,
    };
    it('setLoginType creates an add row for word login types', () => {
      const action = setLoginType('word');
      const nextState = manageStudents(initialState, action);
      assert.deepEqual(nextState.studentData[0], {...expectedBlankRow, loginType: 'word'});
      assert.deepEqual(nextState.editingData[0], {...expectedBlankRow, loginType: 'word'});
    });

    it('setLoginType creates an add row for picture login types', () => {
      const action = setLoginType('picture');
      const nextState = manageStudents(initialState, action);
      assert.deepEqual(nextState.studentData[0], {...expectedBlankRow, loginType: 'picture'});
      assert.deepEqual(nextState.editingData[0], {...expectedBlankRow, loginType: 'picture'});
    });


  });
});
