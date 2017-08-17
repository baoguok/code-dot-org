import sinon from 'sinon';
import { assert, expect } from '../../../util/configuredChai';
import {stubRedux, restoreRedux, registerReducers, getStore} from '@cdo/apps/redux';
import reducer, {
  USER_EDITABLE_SECTION_PROPS,
  PENDING_NEW_SECTION_ID,
  __testInterface__,
  setOAuthProvider,
  setValidGrades,
  setValidAssignments,
  setSections,
  removeSection,
  beginEditingNewSection,
  beginEditingSection,
  editSectionProperties,
  cancelEditingSection,
  finishEditingSection,
  asyncLoadSectionData,
  assignmentId,
  assignmentNames,
  assignmentPaths,
  sectionFromServerSection,
  isAddingSection,
  isEditingSection,
  beginImportRosterFlow,
  cancelImportRosterFlow,
  importOrUpdateRoster,
  isRosterDialogOpen,
  oauthProvider,
  sectionCode,
  sectionName,
  sectionProvider,
  isSectionProviderManaged,
} from '@cdo/apps/templates/teacherDashboard/teacherSectionsRedux';
import { OAuthSectionTypes } from '@cdo/apps/templates/teacherDashboard/shapes';

const {
  EDIT_SECTION_SUCCESS,
  IMPORT_ROSTER_FLOW_BEGIN,
  IMPORT_ROSTER_FLOW_LIST_LOADED,
} = __testInterface__;

const sections = [
  {
    id: 11,
    location: "/v2/sections/11",
    name: "brent_section",
    login_type: "picture",
    grade: "2",
    code: "PMTKVH",
    stage_extras: false,
    pairing_allowed: true,
    script: null,
    course_id: 29,
    studentCount: 10,
  },
  {
    id: 12,
    location: "/v2/sections/12",
    name: "section2",
    login_type: "picture",
    grade: "11",
    code: "DWGMFX",
    stage_extras: false,
    pairing_allowed: true,
    script: {
      id: 36,
      name: 'course3'
    },
    course_id: null,
    studentCount: 1,
  },
  {
    id: 307,
    location: "/v2/sections/307",
    name: "plc",
    login_type: "email",
    grade: "10",
    code: "WGYXTR",
    stage_extras: true,
    pairing_allowed: false,
    script: {
      id: 112,
      name: 'csp1'
    },
    course_id: 29,
    studentCount: 0,
  }
];

const validCourses = [
  {
    id: 29,
    name: "CS Discoveries",
    script_name: "csd",
    category: "Full Courses",
    position: 1,
    category_priority: 0,
  },
  {
    id: 30,
    name: "CS Principles",
    script_name: "csp",
    category: "Full Courses",
    position: 0,
    category_priority: 0,
    script_ids: [112, 113],
  }];

  const validScripts = [
  {
    id: 1,
    name: "Accelerated Course",
    script_name: "20-hour",
    category: "CS Fundamentals International",
    position: 0,
    category_priority: 3,
  },
  {
    id: 2,
    name: "Hour of Code *",
    script_name: "Hour of Code",
    category: "Hour of Code",
    position: 1,
    category_priority: 2,
  },
  {
    id: 3,
    name: "edit-code *",
    script_name: "edit-code",
    category: "other",
    position: null,
    category_priority: 15,
  },
  {
    id: 4,
    name: "events *",
    script_name: "events",
    category: "other",
    position: null,
    category_priority: 15,
  },
  {
    id: 112,
    name: "Unit 1: The Internet",
    script_name: "csp1",
    category: "'16-'17 CS Principles",
    position: 0,
    category_priority: 7,
  },
  {
    id: 113,
    name: "Unit 2: Digital Information",
    script_name: "csp2",
    category: "'16-'17 CS Principles",
    position: 1,
    category_priority: 7,
  }
];

describe('teacherSectionsRedux', () => {
  const initialState = reducer(undefined, {});
  let store;

  beforeEach(() => {
    stubRedux();
    registerReducers({teacherSections: reducer});
    store = getStore();
  });

  afterEach(() => {
    restoreRedux();
  });

  const getState = () => store.getState();

  describe('setOAuthProvider', () => {
    it('sets oauth provider', () => {
      expect(oauthProvider(getState())).to.be.null;
      store.dispatch(setOAuthProvider('clever'));
      expect(oauthProvider(getState())).to.equal('clever');
      store.dispatch(setOAuthProvider('google_classroom'));
      expect(oauthProvider(getState())).to.equal('google_classroom');
    });
  });

  describe('setValidGrades', () => {
    it('sets a list of valid grades', () => {
      const action = setValidGrades(['K', '1', '2']);
      const nextState = reducer(initialState, action);
      assert.deepEqual(nextState.validGrades, ['K', '1', '2']);
    });
  });

  describe('setValidAssignments', () => {
    const action = setValidAssignments(validCourses, validScripts);
    const nextState = reducer(initialState, action);

    it('combines validCourse and scripts into an object keyed by assignId', () => {
      assert.equal(Object.keys(nextState.validAssignments).length,
        validCourses.length + validScripts.length);
    });

    it('adds courseId/scriptId/assignId to courses', () => {
      const assignId = assignmentId(validCourses[0].id, null);
      assert.strictEqual(nextState.validAssignments[assignId].courseId, 29);
      assert.strictEqual(nextState.validAssignments[assignId].scriptId, null);
      assert.strictEqual(nextState.validAssignments[assignId].assignId, assignId);
    });

    it('adds courseId/scriptId/assignId to scripts', () => {
      const assignId = assignmentId(null, validScripts[0].id);
      assert.strictEqual(nextState.validAssignments[assignId].courseId, null);
      assert.strictEqual(nextState.validAssignments[assignId].scriptId, 1);
      assert.strictEqual(nextState.validAssignments[assignId].assignId, assignId);
    });

    it('adds path to courses', () => {
      const assignId = assignmentId(validCourses[0].id, null);
      assert.strictEqual(nextState.validAssignments[assignId].path,
        '/courses/csd');
    });

    it('adds path to scripts', () => {
      const assignId = assignmentId(null, validScripts[0].id);
      assert.strictEqual(nextState.validAssignments[assignId].path,
        '/s/20-hour');
    });

    it('adds scriptAssignIds for a course', () => {
      const assignId = assignmentId(validCourses[1].id, null);
      assert.deepEqual(nextState.validAssignments[assignId].scriptAssignIds,
        [assignmentId(null, 112), assignmentId(null, 113)]);
    });

    it('adds primaryAssignmentId for a course', () => {
      const primaryIds = nextState.primaryAssignmentIds;
      validCourses.forEach(course => {
        assert(primaryIds.includes(assignmentId(course.id, null)));
      });
    });

    it('adds primaryAssignmentId for a script that is not in a course', () => {
      const primaryIds = nextState.primaryAssignmentIds;
      const courselessScript = validScripts[0];
      assert(!primaryIds.includes(courselessScript.id));
    });

    it('does not add primaryAssignmentId for a script that is in a course', () => {
      const primaryIds = nextState.primaryAssignmentIds;
      const scriptInCourse = validScripts[4];
      assert(!primaryIds.includes(scriptInCourse.id));
    });
  });

  describe('setSections', () => {
    const startState = reducer(initialState, setValidAssignments(validCourses, validScripts));

    it('adds an id for each section', () => {
      const action = setSections(sections);
      const nextState = reducer(startState, action);
      assert.deepEqual(nextState.sectionIds, [11, 12, 307]);
    });

    it('groups our sections by id', () => {
      const action = setSections(sections);
      const nextState = reducer(startState, action);
      assert.deepEqual(Object.keys(nextState.sections), ['11', '12', '307']);
      assert.strictEqual(nextState.sections[11].id, 11);
      assert.strictEqual(nextState.sections[12].id, 12);
      assert.strictEqual(nextState.sections[307].id, 307);
    });

    it('empties the store when reset param is set', () => {
      const action = setSections([{
        id: 308,
        location: "/v2/sections/308",
        name: "added_section",
        login_type: "email",
        grade: "2",
        code: "ZVTKVH",
        stage_extras: false,
        pairing_allowed: true,
        script: null,
        course_id: 29,
        studentCount: 0,
      }], true);

      const state = reducer(startState, setSections(sections));
      assert.deepEqual(Object.keys(state.sections), ['11', '12', '307']);
      assert.deepEqual(state.sectionIds, [11, 12, 307]);

      const finalState = reducer(state, action);
      assert.deepEqual(finalState.sectionIds, [308]);
      assert.deepEqual(Object.keys(finalState.sections), ['308']);
    });
  });

  describe('removeSection', () => {
    const stateWithSections = reducer(initialState, setSections(sections));

    it('removes sectionid for a persisted section', () => {
      const sectionId = sections[0].id;
      const action = removeSection(sectionId);
      const state = reducer(stateWithSections, action);
      assert.equal(state.sectionIds.includes(sectionId), false);
    });

    it('removes a persisted section', () => {
      const sectionId = sections[0].id;
      const action = removeSection(sectionId);
      const state = reducer(stateWithSections, action);
      assert.strictEqual(state.sections[sectionId], undefined);
    });

    it('doesnt let you remove a non-existent section',  () => {
      assert.throws(() => {
        reducer(stateWithSections, removeSection(1234));
      });
    });
  });

  describe('beginEditingNewSection', () => {
    it('populates sectionBeingEdited', () => {
      assert.isNull(initialState.sectionBeingEdited);
      const state = reducer(initialState, beginEditingNewSection());
      assert.deepEqual(state.sectionBeingEdited, {
        id: PENDING_NEW_SECTION_ID,
        name: '',
        loginType: undefined,
        grade: '',
        providerManaged: false,
        stageExtras: false,
        pairingAllowed: true,
        studentCount: 0,
        code: '',
        courseId: null,
        scriptId: null
      });
    });
  });

  describe('beginEditingSection', () => {
    it('populates sectionBeingEdited', () => {
      const stateWithSections = reducer(initialState, setSections(sections));
      assert.isNull(stateWithSections.sectionBeingEdited);
      const state = reducer(stateWithSections, beginEditingSection(12));
      assert.deepEqual(state.sectionBeingEdited, {
        id: 12,
        name: "section2",
        loginType: "picture",
        grade: "11",
        providerManaged: false,
        code: "DWGMFX",
        stageExtras: false,
        pairingAllowed: true,
        scriptId: 36,
        courseId: null,
        studentCount: 1,
      });
    });
  });

  describe('editSectionProperties', () => {
    let editingNewSectionState;

    before(() => {
      editingNewSectionState = reducer(initialState, beginEditingNewSection());
    });

    it('throws if not currently editing a section', () => {
      expect(() => {
        reducer(initialState, editSectionProperties({name: 'New Name'}));
      }).to.throw();
    });

    // Enumerate user-editable section properties
    USER_EDITABLE_SECTION_PROPS.forEach(editableProp => {
      it(`allows editing ${editableProp}`, () => {
        const state = reducer(
          editingNewSectionState,
          editSectionProperties({[editableProp]: 'newValue'})
        );
        expect(state.sectionBeingEdited[editableProp]).to.equal('newValue');
      });
    });

    // Check some uneditable section properties
    [
      'id',
      'studentCount',
      'code',
      'providerManaged',
    ].forEach(uneditableProp => {
      it(`does not allow editing ${uneditableProp}`, () => {
        expect(() => reducer(
          editingNewSectionState,
          editSectionProperties({[uneditableProp]: 'newValue'})
        )).to.throw();
      });
    });

    it('can edit multiple props at once', () => {
      const state = reducer(
        editingNewSectionState,
        editSectionProperties({
          name: 'newName',
          courseId: 61,
        })
      );
      expect(state.sectionBeingEdited.name).to.equal('newName');
      expect(state.sectionBeingEdited.courseId).to.equal(61);
    });

    it('when editing multiple props, throws if any are uneditable', () => {
      expect(() => reducer(
        editingNewSectionState,
        editSectionProperties({
          name: 'newName',
          courseId: 61,
          providerManaged: false, // Uneditable!
        })
      )).to.throw();
    });
  });

  describe('cancelEditingSection', () => {
    it('clears sectionBeingEdited', () => {
      const initialState = reducer(initialState, beginEditingNewSection());
      assert.isNotNull(initialState.sectionBeingEdited);
      const state = reducer(initialState, cancelEditingSection());
      assert.isNull(state.sectionBeingEdited);
    });
  });

  describe('finishEditingSection', () => {
    let server;

    // Fake server responses to reuse in our tests
    const newSectionDefaults = {
      id: 13,
      name: 'New Section',
      login_type: 'email',
      grade: undefined,
      providerManaged: false,
      stage_extras: false,
      pairing_allowed: true,
      student_count: 0,
      code: 'BCDFGH',
      course_id: null,
      script_id: null,
    };

    function successResponse(customProps = {}) {
      const editingSectionId = state().sectionBeingEdited.id;
      const existingSection = sections.find(s => s.id === editingSectionId);
      return [
        200,
        {"Content-Type": "application/json"},
        JSON.stringify({
          ...(existingSection || newSectionDefaults),
          id: existingSection ? editingSectionId : 13,
          ...customProps,
        })
      ];
    }

    const failureResponse = [500, {}, ''];

    function state() {
      return getState().teacherSections;
    }

    beforeEach(function () {
      // Stub server responses
      server = sinon.fakeServer.create();

      // Test with a real redux store, not just the reducer, because this
      // action depends on the redux-thunk extension.
      store.dispatch(setSections(sections));
    });

    afterEach(function () {
      server.restore();
    });

    it('immediately makes saveInProgress true', () => {
      store.dispatch(beginEditingNewSection());
      expect(state().saveInProgress).to.be.false;

      store.dispatch(finishEditingSection());
      expect(state().saveInProgress).to.be.true;
    });

    it('makes saveInProgress false after the server responds with success', () => {
      store.dispatch(beginEditingNewSection());
      server.respondWith('POST', '/v2/sections', successResponse());

      store.dispatch(finishEditingSection());
      expect(state().saveInProgress).to.be.true;

      server.respond();
      expect(state().saveInProgress).to.be.false;
    });

    it('makes saveInProgress false after the server responds with failure', () => {
      store.dispatch(beginEditingNewSection());
      server.respondWith('POST', '/v2/sections', failureResponse);

      store.dispatch(finishEditingSection()).catch(() => {});
      expect(state().saveInProgress).to.be.true;

      server.respond();
      expect(state().saveInProgress).to.be.false;
    });

    it('resolves a returned promise when the server responds with success', () => {
      store.dispatch(beginEditingNewSection());
      server.respondWith('POST', '/v2/sections', successResponse());

      const promise = store.dispatch(finishEditingSection());
      server.respond();
      return expect(promise).to.be.fulfilled;
    });

    it('rejects a returned promise when the server responds with failure', () => {
      store.dispatch(beginEditingNewSection());
      server.respondWith('POST', '/v2/sections', failureResponse);

      const promise = store.dispatch(finishEditingSection());
      server.respond();
      return expect(promise).to.be.rejected;
    });

    it('clears sectionBeingEdited after the server responds with success', () => {
      store.dispatch(beginEditingNewSection());
      server.respondWith('POST', '/v2/sections', successResponse());

      store.dispatch(finishEditingSection());
      expect(state().sectionBeingEdited).not.to.be.null;

      server.respond();
      expect(state().sectionBeingEdited).to.be.null;
    });

    it('keeps sectionBeingEdited after the server responds with failure', () => {
      store.dispatch(beginEditingNewSection());
      const originalSectionBeingEdited = state().sectionBeingEdited;
      expect(originalSectionBeingEdited).not.to.be.null;
      server.respondWith('POST', '/v2/sections', failureResponse);

      store.dispatch(finishEditingSection()).catch(() => {});
      expect(state().sectionBeingEdited).to.equal(originalSectionBeingEdited);

      server.respond();
      expect(state().sectionBeingEdited).to.equal(originalSectionBeingEdited);
    });

    it('adds a new section to the sections map on success', () => {
      const originalSections = state().sections;
      store.dispatch(beginEditingNewSection());
      store.dispatch(editSectionProperties({
        name: 'Aquarius PM Block 2',
        loginType: 'picture',
        grade: '3',
      }));
      server.respondWith('POST', '/v2/sections', successResponse({
        name: 'Aquarius PM Block 2',
        login_type: 'picture',
        grade: '3',
      }));

      store.dispatch(finishEditingSection());
      expect(state().sections).to.equal(originalSections);

      server.respond();
      expect(state().sections).to.deep.equal({
        ...originalSections,
        [13]: {
          id: 13,
          name: 'Aquarius PM Block 2',
          loginType: 'picture',
          grade: '3',
          providerManaged: false,
          stageExtras: false,
          pairingAllowed: true,
          studentCount: undefined,
          code: 'BCDFGH',
          courseId: null,
          scriptId: null,
        }
      });
    });

    it('updates an edited section in the section map on success', () => {
      const sectionId = 12;
      store.dispatch(beginEditingSection(sectionId));
      store.dispatch(editSectionProperties({grade: 'K'}));

      // Set up matching server response
      server.respondWith('POST', `/v2/sections/${sectionId}/update`,
        successResponse({grade: 'K'}));

      store.dispatch(finishEditingSection());
      expect(state().sectionBeingEdited).to.have.property('grade', 'K');
      expect(state().sections[sectionId]).to.have.property('grade', '11');

      server.respond();
      expect(state().sectionBeingEdited).to.be.null;
      expect(state().sections[sectionId]).to.have.property('grade', 'K');
    });

    it('does not modify sections map on failure', () => {
      store.dispatch(beginEditingNewSection());
      server.respondWith('POST', '/v2/sections', failureResponse);
      const originalSections = state().sections;

      store.dispatch(finishEditingSection()).catch(() => {});
      server.respond();
      expect(state().sections).to.equal(originalSections);
    });
  });

  describe('asyncLoadSectionData', () => {
    let server;

    function successResponse(response = []) {
      return [
        200,
        {"Content-Type": "application/json"},
        JSON.stringify(response)
      ];
    }

    const failureResponse = [500, {}, 'CustomErrorBody'];

    function state() {
      return getState().teacherSections;
    }

    beforeEach(function () {
      // Stub server responses
      server = sinon.fakeServer.create();
    });

    afterEach(function () {
      server.restore();
    });

    it('immediately sets asyncLoadComplete to false', () => {
      store.dispatch(asyncLoadSectionData());
      expect(state().asyncLoadComplete).to.be.false;
    });

    it('sets asyncLoadComplete to true after success responses', () => {
      const promise = store.dispatch(asyncLoadSectionData());

      expect(server.requests).to.have.length(3);
      server.respondWith('GET', '/dashboardapi/sections', successResponse());
      server.respondWith('GET', '/dashboardapi/courses', successResponse());
      server.respondWith('GET', '/v2/sections/valid_scripts', successResponse());
      server.respond();

      return promise.then(() => {
        expect(state().asyncLoadComplete).to.be.true;
      });
    });

    it('sets asyncLoadComplete to true after first failure response', () => {
      console.error.reset(); // Already stubbed in tests
      const promise = store.dispatch(asyncLoadSectionData());

      server.respondWith('GET', '/dashboardapi/sections', failureResponse);
      server.respond();

      return promise.then(() => {
        expect(state().asyncLoadComplete).to.be.true;
        expect(console.error).to.have.been.calledOnce;
        expect(console.error.getCall(0).args[0])
          .to.include('url: /dashboardapi/sections')
          .and
          .to.include('status: 500')
          .and
          .to.include('statusText: Internal Server Error')
          .and
          .to.include('responseText: CustomErrorBody');
      });
    });

    it('sets sections from server response', () => {
      const promise = store.dispatch(asyncLoadSectionData());
      expect(state().sections).to.deep.equal({});

      expect(server.requests).to.have.length(3);
      server.respondWith('GET', '/dashboardapi/sections', successResponse(sections));
      server.respondWith('GET', '/dashboardapi/courses', successResponse());
      server.respondWith('GET', '/v2/sections/valid_scripts', successResponse());
      server.respond();

      return promise.then(() => {
        expect(Object.keys(state().sections)).to.have.length(sections.length);
      });
    });

    it('sets validAssignments from server responses', () => {
      const promise = store.dispatch(asyncLoadSectionData());
      expect(state().validAssignments).to.deep.equal({});

      expect(server.requests).to.have.length(3);
      server.respondWith('GET', '/dashboardapi/sections', successResponse());
      server.respondWith('GET', '/dashboardapi/courses', successResponse(validCourses));
      server.respondWith('GET', '/v2/sections/valid_scripts', successResponse(validScripts));
      server.respond();

      return promise.then(() => {
        expect(Object.keys(state().validAssignments)).to.have.length(
          validCourses.length + validScripts.length
        );
      });
    });
  });

  describe('sectionFromServerSection', () => {
    const serverSection = {
      id: 11,
      location: "/v2/sections/11",
      name: "brent_section",
      login_type: "picture",
      grade: "2",
      code: "PMTKVH",
      stage_extras: false,
      pairing_allowed: true,
      script: null,
      course_id: 29,
      studentCount: 10,
    };

    it('transfers some fields directly, mapping from snake_case to camelCase', () => {
      const section = sectionFromServerSection(serverSection);
      assert.strictEqual(section.id, serverSection.id);
      assert.strictEqual(section.name, serverSection.name);
      assert.strictEqual(section.login_type, serverSection.loginType);
      assert.strictEqual(section.grade, serverSection.grade);
      assert.strictEqual(section.code, serverSection.code);
      assert.strictEqual(section.stage_extras, serverSection.stageExtras);
      assert.strictEqual(section.pairing_allowed, serverSection.pairingAllowed);
      assert.strictEqual(section.course_id, serverSection.courseId);
    });

    it('maps from a script object to a script_id', () => {
      const sectionWithoutScript = sectionFromServerSection(serverSection);
      assert.strictEqual(sectionWithoutScript.scriptId, null);

      const sectionWithScript = sectionFromServerSection({
        ...serverSection,
        script: {
          id: 1,
          name: 'Accelerated Course'
        }
      });
      assert.strictEqual(sectionWithScript.scriptId, 1);
    });

    it('sets student count', () => {
      const section = sectionFromServerSection(serverSection);
      assert.equal(section.studentCount, 10);
    });
  });

  describe('assignmentNames/assignmentPaths', () => {
    const stateWithAssigns = reducer(initialState, setValidAssignments(validCourses, validScripts));
    const stateWithSections = reducer(stateWithAssigns, setSections(sections));
    const stateWithUnassignedSection = reducer(stateWithSections, {
      type: EDIT_SECTION_SUCCESS,
      sectionId: '12',
      serverSection: {
        ...sections[1],
        course_id: null,
        script: null,
      }
    });

    const assignedSection = stateWithUnassignedSection.sections["11"];
    const unassignedSection = stateWithUnassignedSection.sections["12"];
    const assignedSectionWithUnit = stateWithUnassignedSection.sections["307"];

    it('assignmentNames returns the name if the section is assigned a course/script', () => {
      const names = assignmentNames(stateWithUnassignedSection.validAssignments, assignedSection);
      assert.deepEqual(names, ['CS Discoveries']);
    });

    it('assignmentNames returns the names of course and script if assigned both', () => {
      const names = assignmentNames(stateWithUnassignedSection.validAssignments, assignedSectionWithUnit);
      assert.deepEqual(names, ['CS Discoveries', 'Unit 1: The Internet']);
    });

    it('assignmentName returns empty array if unassigned', () => {
      const names = assignmentNames(stateWithUnassignedSection.validAssignments, unassignedSection);
      assert.deepEqual(names, []);
    });

    it('assignmentPaths returns the path if the section is assigned a course/script', () => {
      const paths = assignmentPaths(stateWithUnassignedSection.validAssignments, assignedSection);
      assert.deepEqual(paths, ['/courses/csd']);
    });

    it('assignmentPaths returns the paths of course and script if assigned both', () => {
      const paths = assignmentPaths(stateWithUnassignedSection.validAssignments, assignedSectionWithUnit);
      assert.deepEqual(paths, ['/courses/csd', '/s/csp1']);
    });

    it('assignmentPaths returns empty array if unassigned', () => {
      const paths = assignmentPaths(stateWithUnassignedSection, unassignedSection);
      assert.deepEqual(paths, []);
    });
  });

  describe('isAddingSection', () => {
    it('is false in initial state', () => {
      assert.isFalse(isAddingSection(initialState));
    });

    it('is true when creating a new section', () => {
      const state = reducer(initialState, beginEditingNewSection());
      assert(isAddingSection(state));
    });

    it('is false when editing an existing section', () => {
      const stateWithSections = reducer(initialState, setSections(sections));
      const state = reducer(stateWithSections, beginEditingSection(12));
      assert.isFalse(isAddingSection(state));
    });

    it('is false after editing is cancelled', () => {
      const initialState = reducer(initialState, beginEditingNewSection());
      const state = reducer(initialState, cancelEditingSection());
      assert.isFalse(isAddingSection(state));
    });
  });

  describe('isEditingSection', () => {
    it('is false in initial state', () => {
      assert.isFalse(isEditingSection(initialState));
    });

    it('is false when creating a new section', () => {
      const state = reducer(initialState, beginEditingNewSection());
      assert.isFalse(isEditingSection(state));
    });

    it('is true when editing an existing section', () => {
      const stateWithSections = reducer(initialState, setSections(sections));
      const state = reducer(stateWithSections, beginEditingSection(12));
      assert(isEditingSection(state));
    });

    it('is false after editing is cancelled', () => {
      const initialState = reducer(initialState, beginEditingNewSection());
      const state = reducer(initialState, cancelEditingSection());
      assert.isFalse(isEditingSection(state));
    });
  });

  describe('the beginImportRosterFlow action', () => {
    let server;
    beforeEach(() => {
      server = sinon.fakeServer.create();
      // set up some default success responses
      server.respondWith(
        'GET', '/dashboardapi/google_classrooms',
        successResponse()
      );
      server.respondWith(
        'GET', '/dashboardapi/clever_classrooms',
        successResponse()
      );
    });
    afterEach(() => server.restore());

    const successResponse = (body = {}) => [
      200,
      {"Content-Type": "application/json"},
      JSON.stringify(body)
    ];

    const failureResponse = [500, {}, 'test-failure-body'];

    const withGoogle = () => store.dispatch(setOAuthProvider(OAuthSectionTypes.google_classroom));
    const withClever = () => store.dispatch(setOAuthProvider(OAuthSectionTypes.clever));

    it('throws if no oauth provider has been set', () => {
      return expect(store.dispatch(beginImportRosterFlow()))
        .to.be.rejected;
    });

    it('does nothing if the roster dialog was already open', () => {
      withGoogle();
      store.dispatch({type: IMPORT_ROSTER_FLOW_BEGIN});
      expect(isRosterDialogOpen(getState())).to.be.true;
      const promise = store.dispatch(beginImportRosterFlow());
      expect(isRosterDialogOpen(getState())).to.be.true;
      expect(server.requests).to.have.length(0);
      return expect(promise).to.be.fulfilled;
    });

    it('opens the roster dialog if it was closed', () => {
      withGoogle();
      expect(isRosterDialogOpen(getState())).to.be.false;
      const promise = store.dispatch(beginImportRosterFlow());
      expect(isRosterDialogOpen(getState())).to.be.true;
      server.respond();
      return expect(promise).to.be.fulfilled;
    });

    it('requests one api for Google Classroom', () => {
      withGoogle();
      const promise = store.dispatch(beginImportRosterFlow());
      expect(server.requests).to.have.length(1);
      expect(server.requests[0].method).to.equal('GET');
      expect(server.requests[0].url).to.equal('/dashboardapi/google_classrooms');
      server.respond();
      return expect(promise).to.be.fulfilled;
    });

    it('requests a different api for Clever', () => {
      withClever();
      const promise = store.dispatch(beginImportRosterFlow());
      expect(server.requests).to.have.length(1);
      expect(server.requests[0].method).to.equal('GET');
      expect(server.requests[0].url).to.equal('/dashboardapi/clever_classrooms');
      server.respond();
      return expect(promise).to.be.fulfilled;
    });

    it('sets the classroom list on success', () => {
      withGoogle();
      server.respondWith(
        'GET', '/dashboardapi/google_classrooms',
        successResponse({courses: [1, 2, 3]})
      );
      expect(getState().teacherSections.classrooms).to.be.null;
      expect(getState().teacherSections.loadError).to.be.null;

      const promise = store.dispatch(beginImportRosterFlow());
      expect(getState().teacherSections.classrooms).to.be.null;
      expect(getState().teacherSections.loadError).to.be.null;

      server.respond();
      expect(getState().teacherSections.classrooms).to.deep.equal(
        [1, 2, 3]
      );
      expect(getState().teacherSections.loadError).to.be.null;
      return expect(promise).to.be.fulfilled;
    });

    it('sets the loadError on failure', () => {
      withGoogle();
      server.respondWith(
        'GET', '/dashboardapi/google_classrooms',
        failureResponse
      );
      expect(getState().teacherSections.classrooms).to.be.null;
      expect(getState().teacherSections.loadError).to.be.null;

      const promise = store.dispatch(beginImportRosterFlow());
      expect(getState().teacherSections.classrooms).to.be.null;
      expect(getState().teacherSections.loadError).to.be.null;

      server.respond();
      expect(getState().teacherSections.classrooms).to.be.null;
      expect(getState().teacherSections.loadError).to.deep.equal({
        status: 500,
        message: 'Unknown error.',
      });
      return expect(promise).to.be.rejected;
    });
  });

  describe('the cancelImportRosterFlow action', () => {
    it('closes the roster dialog if it was open', () => {
      store.dispatch({type: IMPORT_ROSTER_FLOW_BEGIN});
      expect(isRosterDialogOpen(getState())).to.be.true;
      store.dispatch(cancelImportRosterFlow());
      expect(isRosterDialogOpen(getState())).to.be.false;
    });

    it('clears the classroom list', () => {
      store.dispatch({type: IMPORT_ROSTER_FLOW_LIST_LOADED, classrooms: [1, 2, 3]});
      expect(getState().teacherSections.classrooms).to.deep.equal([1, 2, 3]);
      store.dispatch(cancelImportRosterFlow());
      expect(getState().teacherSections.classrooms).to.be.null;
    });
  });

  describe('the importOrUpdateRoster action', () => {
    let server;
    const TEST_COURSE_ID = 'test-course-id';
    const TEST_COURSE_NAME = 'test-course-name';

    beforeEach(() => {
      server = sinon.fakeServer.create();
      // We have chained server requests separated by promises in these
      // tests, so have the fake server respond immediately becaue it's
      // difficult to trigger the fake responses at the right times.
      server.respondImmediately = true;
      // set up some default success responses
      server.respondWith('GET', `/dashboardapi/import_google_classroom?courseId=${TEST_COURSE_ID}&courseName=${TEST_COURSE_NAME}`, successResponse({}));
      server.respondWith('GET', `/dashboardapi/import_clever_classroom?courseId=${TEST_COURSE_ID}&courseName=${TEST_COURSE_NAME}`, successResponse({}));
      server.respondWith('GET', '/dashboardapi/sections', successResponse([]));
      server.respondWith('GET', '/dashboardapi/courses', successResponse([]));
      server.respondWith('GET', '/v2/sections/valid_scripts', successResponse([]));
    });
    afterEach(() => server.restore());

    const successResponse = (body = {}) => [
      200,
      {"Content-Type": "application/json"},
      JSON.stringify(body)
    ];

    const withGoogle = () => store.dispatch(setOAuthProvider(OAuthSectionTypes.google_classroom));
    const withClever = () => store.dispatch(setOAuthProvider(OAuthSectionTypes.clever));

    it('immediately clears the classroom list', () => {
      withGoogle();
      store.dispatch({type: IMPORT_ROSTER_FLOW_LIST_LOADED, classrooms: [1, 2, 3]});
      expect(getState().teacherSections.classrooms).to.deep.equal([1, 2, 3]);

      const promise = store.dispatch(importOrUpdateRoster(TEST_COURSE_ID, TEST_COURSE_NAME));
      expect(getState().teacherSections.classrooms).to.be.null;

      return expect(promise).to.be.fulfilled;
    });

    it('uses one api for Google Classroom', () => {
      withGoogle();
      const promise = store.dispatch(importOrUpdateRoster(TEST_COURSE_ID, TEST_COURSE_NAME));

      expect(server.requests).to.have.length(1);
      expect(server.requests[0].method).to.equal('GET');
      expect(server.requests[0].url)
        .to.equal('/dashboardapi/import_google_classroom?courseId=test-course-id&courseName=test-course-name');

      return expect(promise).to.be.fulfilled;
    });

    it('uses a different api for Clever', () => {
      withClever();
      const promise = store.dispatch(importOrUpdateRoster(TEST_COURSE_ID, TEST_COURSE_NAME));

      expect(server.requests).to.have.length(1);
      expect(server.requests[0].method).to.equal('GET');
      expect(server.requests[0].url)
        .to.equal('/dashboardapi/import_clever_classroom?courseId=test-course-id&courseName=test-course-name');

      return expect(promise).to.be.fulfilled;
    });

    it('closes the dialog on success', () => {
      withClever();
      store.dispatch({type: IMPORT_ROSTER_FLOW_BEGIN});
      expect(isRosterDialogOpen(getState())).to.be.true;

      const promise = store.dispatch(importOrUpdateRoster(TEST_COURSE_ID, TEST_COURSE_NAME));
      expect(isRosterDialogOpen(getState())).to.be.true;

      return expect(promise).to.be.fulfilled.then(() => {
        expect(isRosterDialogOpen(getState())).to.be.false;
      });
    });

    it('reloads the section data on success', () => {
      // Set up custom server sections response
      server.respondWith('GET', '/dashboardapi/sections', successResponse(sections));

      withClever();
      store.dispatch({type: IMPORT_ROSTER_FLOW_BEGIN});
      expect(getState().teacherSections.sections).to.deep.equal({});

      const promise = store.dispatch(importOrUpdateRoster(TEST_COURSE_ID, TEST_COURSE_NAME));
      return expect(promise).to.be.fulfilled.then(() => {
        expect(server.requests).to.have.length(4);
        expect(server.requests[1].method).to.equal('GET');
        expect(server.requests[1].url).to.equal('/dashboardapi/sections');
        expect(server.requests[2].method).to.equal('GET');
        expect(server.requests[2].url).to.equal('/dashboardapi/courses');
        expect(server.requests[3].method).to.equal('GET');
        expect(server.requests[3].url).to.equal('/v2/sections/valid_scripts');
        expect(Object.keys(getState().teacherSections.sections))
          .to.have.length(sections.length);
      });
    });

    it('starts editing the new section on success', () => {
      // Set up custom section import response
      server.respondWith('GET', `/dashboardapi/import_google_classroom?courseId=${TEST_COURSE_ID}&courseName=${TEST_COURSE_NAME}`, successResponse({
        id: 1111,
      }));
      // Set up custom section load response to simulate the new section
      server.respondWith('GET', '/dashboardapi/sections', successResponse([
        ...sections,
        {id: 1111}
      ]));

      withGoogle();
      store.dispatch({type: IMPORT_ROSTER_FLOW_BEGIN});
      expect(getState().teacherSections.sectionBeingEdited).to.be.null;

      const promise = store.dispatch(importOrUpdateRoster(TEST_COURSE_ID, TEST_COURSE_NAME));
      return expect(promise).to.be.fulfilled.then(() => {
        expect(getState().teacherSections.sectionBeingEdited).not.to.be.null;
        expect(getState().teacherSections.sectionBeingEdited.id).to.equal(1111);
      });
    });
  });

  describe('the sectionCode selector', () => {
    it('undefined if the section is not found', () => {
      expect(sectionCode(getState(), 42)).to.be.undefined;
    });

    it('the section code if the section is found', () => {
      store.dispatch(setSections(sections));
      expect(sectionCode(getState(), 11)).to.equal('PMTKVH');
    });
  });

  describe('the sectionName selector', () => {
    it('undefined if the section is not found', () => {
      expect(sectionName(getState(), 42)).to.be.undefined;
    });

    it('the section name if the section is found', () => {
      store.dispatch(setSections(sections));
      expect(sectionName(getState(), 11)).to.equal('brent_section');
    });
  });

  describe('the sectionProvider selector', () => {
    beforeEach(() => store.dispatch(setOAuthProvider('google_classroom')));

    it('null if the section is not found', () => {
      expect(sectionProvider(getState(), 42)).to.be.null;
    });

    it('null if the section is not provider managed', () => {
      store.dispatch(setSections(sections));
      expect(sectionProvider(getState(), 11)).to.be.null;
    });

    it('the current user oauth provider if the section is provider managed', () => {
      store.dispatch(setSections([
        {
          id: 11,
          name: 'google test section',
          login_type: 'google_classroom',
          code: 'G-123456',
          studentCount: 10,
          providerManaged: true,
        },
      ]));
      expect(sectionProvider(getState(), 11)).to.equal('google_classroom');
    });
  });

  describe('the isSectionProviderManaged selector', () => {
    it('false if the section is not found', () => {
      expect(isSectionProviderManaged(getState(), 42)).to.be.false;
    });

    it('false if the section is not provider managed', () => {
      store.dispatch(setSections(sections));
      expect(isSectionProviderManaged(getState(), 11)).to.be.false;
    });

    it('true if the section is provider managed', () => {
      store.dispatch(setSections([
        {
          id: 11,
          name: 'google test section',
          login_type: 'google_classroom',
          code: 'G-123456',
          studentCount: 10,
          providerManaged: true,
        },
      ]));
      expect(isSectionProviderManaged(getState(), 11)).to.be.true;
    });
  });
});
