import { assert } from '../../../util/configuredChai';
import _ from 'lodash';
import reducer, {
  setStudioUrl,
  setValidLoginTypes,
  setValidGrades,
  setValidAssignments,
  setSections,
  updateSection,
  assignmentId
} from '@cdo/apps/templates/teacherDashboard/teacherSectionsRedux';

// Our actual student object are much more complex than this, but really all we
// care about is how many there are.
const fakeStudents = num => _.range(num).map(x => ({id: x}));

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
    students: fakeStudents(10)
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
    students: fakeStudents(1)
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
      id: 46,
      name: 'infinity'
    },
    course_id: null,
    students: []
  }
];

const validCourses = [
  {
    id: 29,
    name: "CS Discoveries",
    script_name: "csd",
    category: "Full Courses",
    position: 1,
    category_priority: -1,
  },
  {
    id: 30,
    name: "CS Principles",
    script_name: "csp",
    category: "Full Courses",
    position: 0,
    category_priority: -1,
  }];

  const validScripts = [
  {
    id: 1,
    name: "Accelerated Course",
    script_name: "20-hour",
    category: "CS Fundamentals",
    position: 0,
    category_priority: 0,
  },
  {
    id: 2,
    name: "Hour of Code *",
    script_name: "Hour of Code",
    category: "Hour of Code",
    position: 1,
    category_priority: 0,
  },
  {
    id: 3,
    name: "edit-code *",
    script_name: "edit-code",
    category: "other",
    position: null,
    category_priority: 3,
  },
  {
    id: 4,
    name: "events *",
    script_name: "events",
    category: "other",
    position: null,
    category_priority: 3,
  },
  {
    id: 36,
    name: "Course 3",
    script_name: "course3",
    category: "CS Fundamentals",
    position: 3,
    category_priority: 0,
  },
  {
    id: 46,
    name: "Infinity Play Lab",
    script_name: "infinity",
    category: "Hour of Code",
    position: 12,
    category_priority: 0,
  }
];

describe('teacherSectionsRedux', () => {
  const initialState = reducer(undefined, {});

  describe('setStudioUrl', () => {
    it('sets our url', () => {
      const action = setStudioUrl('//test-studio.code.org');
      const nextState = reducer(initialState, action);
      assert.equal(nextState.studioUrl, '//test-studio.code.org');
    });
  });

  describe('setValidLoginTypes', () => {
    it('sets a list of valid login types', () => {
      const action = setValidLoginTypes(['email', 'password', 'picture']);
      const nextState = reducer(initialState, action);
      assert.deepEqual(nextState.validLoginTypes, ['email', 'password', 'picture']);
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
    const startState = reducer(initialState, setStudioUrl('//test-studio.code.org'));

    it('combines validCourse and scripts into an object keyed by assignId', () => {
      const action = setValidAssignments(validCourses, validScripts);
      const nextState = reducer(startState, action);
      assert.equal(Object.keys(nextState.validAssignments).length,
        validCourses.length + validScripts.length);
    });

    it('adds courseId/scriptId/assignId to courses', () => {
      const action = setValidAssignments(validCourses, validScripts);
      const nextState = reducer(startState, action);
      const assignId = assignmentId(validCourses[0].id, null);
      assert.strictEqual(nextState.validAssignments[assignId].courseId, 29);
      assert.strictEqual(nextState.validAssignments[assignId].scriptId, null);
      assert.strictEqual(nextState.validAssignments[assignId].assignId, assignId);
    });

    it('adds courseId/scriptId/assignId to scripts', () => {
      const action = setValidAssignments(validCourses, validScripts);
      const nextState = reducer(startState, action);
      const assignId = assignmentId(null, validScripts[0].id);
      assert.strictEqual(nextState.validAssignments[assignId].courseId, null);
      assert.strictEqual(nextState.validAssignments[assignId].scriptId, 1);
      assert.strictEqual(nextState.validAssignments[assignId].assignId, assignId);
    });

    it('adds path to courses', () => {
      const action = setValidAssignments(validCourses, validScripts);
      const nextState = reducer(startState, action);
      const assignId = assignmentId(validCourses[0].id, null);
      assert.strictEqual(nextState.validAssignments[assignId].path,
        '//test-studio.code.org/courses/csd');
    });

    it('adds path to scripts', () => {
      const action = setValidAssignments(validCourses, validScripts);
      const nextState = reducer(startState, action);
      const assignId = assignmentId(null, validScripts[0].id);
      assert.strictEqual(nextState.validAssignments[assignId].path,
        '//test-studio.code.org/s/20-hour');
    });
  });

  describe('setSections', () => {
    const stateWithUrl = reducer(initialState, setStudioUrl('//test-studio.code.org'));
    const startState = reducer(stateWithUrl, setValidAssignments(validCourses, validScripts));

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
  });

  describe('updateSection', () => {
    // create a state that has our sections set, and valid courses/scripts
    const stateWithUrl = reducer(initialState, setStudioUrl('//test-studio.code.org'));
    const stateWithAssigns = reducer(stateWithUrl, setValidAssignments(validCourses, validScripts));
    const stateWithSections = reducer(stateWithAssigns, setSections(sections));

    const updatedSection = {
      ...sections[0],
      // change login type from picture to word
      login_type: 'word'
    };

    it('does not change our list of section ids', () => {
      const action = updateSection(sections[0].id, updatedSection);
      const state = reducer(stateWithSections, action);
      assert.strictEqual(state.sectionIds, stateWithSections.sectionIds);
    });

    it('modifies the given section id', () => {
      const sectionId = sections[0].id;
      const action = updateSection(sectionId, updatedSection);
      const state = reducer(stateWithSections, action);

      assert.strictEqual(stateWithSections.sections[sectionId].loginType, 'picture');
      assert.strictEqual(state.sections[sectionId].loginType, 'word');

      // Other fields should remain unchanged
      Object.keys(stateWithSections.sections[sectionId]).forEach(field => {
        if (field === 'loginType') {
          return;
        }
        assert.strictEqual(state.sections[sectionId][field],
          stateWithSections.sections[sectionId][field]);
      });
    });

    it('does not modify other section ids', () => {
      const action = updateSection(sections[0].id, updatedSection);
      const state = reducer(stateWithSections, action);
      const otherSectionId = sections[1].id;

      assert.strictEqual(state.sections[otherSectionId],
        stateWithSections.sections[otherSectionId]);
    });
  });
});
