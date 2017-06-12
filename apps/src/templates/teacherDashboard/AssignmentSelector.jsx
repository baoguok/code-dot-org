import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import { assignmentShape } from './shapes';

export default class AssignmentSelector extends Component {
  static propTypes = {
    courseId: PropTypes.number,
    scriptId: PropTypes.number,
    validCourses: PropTypes.arrayOf(assignmentShape).isRequired,
    validScripts: PropTypes.arrayOf(assignmentShape).isRequired,
  };

  getSelectedAssignment() {
    const assignment = this.assignments[this.root.value];
    return {
      course_id: assignment.course_id,
      script_id: assignment.script_id
    };
  }

  render() {
    const { courseId, scriptId, validCourses, validScripts } = this.props;

    // TODO(bjvanminnen): It's not clear that all of this data manipulation belongs
    // here. If we move our data to redux, it likely belongs there. Otherwise, it
    // may still make more sense for this to all happen before instantiating our
    // React tree.

    // Differentiate courses and ids by giving them course_ids and script_ids fields.
    const courses = validCourses.map(course => ({
      ...course,
      course_id: course.id
    }));
    const scripts = validScripts.map(script => ({
      ...script,
      script_id: script.id
    }));

    // concat courses and scripts, givin them an index to that we can easily
    // get back to assignment.
    const assignments = courses.concat(scripts).map((assignment, index) => ({
      ...assignment,
      index
    }));

    // store as instance variable so that getSelectedAssignment doesnt need to
    // regenerate
    this.assignments = assignments;

    let currentAssignment = '';
    if (courseId) {
      const selectedCourse = validCourses.findIndex(c => c.id === courseId);
      if (selectedCourse !== -1) {
        currentAssignment = selectedCourse;
      }
    } else if (scriptId) {
      const selectedScript = validScripts.findIndex(s => s.id === scriptId);
      currentAssignment = validCourses.length + selectedScript;
    }

    const grouped = _.groupBy(
      _.orderBy(assignments, ['category_priority', 'category', 'position', 'name']),
      'category'
    );

    return (
      <select
        defaultValue={currentAssignment}
        ref={element => this.root = element}
      >
        <option key="default"/>
        {Object.keys(grouped).map((groupName, index) => (
          <optgroup key={index} label={groupName}>
            {grouped[groupName].map((assignment) => (
              <option
                key={assignment.index}
                value={assignment.index}
              >
                {assignment.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    );
  }
}
