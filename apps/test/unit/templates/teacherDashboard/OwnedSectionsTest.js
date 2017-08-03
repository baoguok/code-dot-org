import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { assert } from '../../../util/configuredChai';
import { throwOnConsoleErrors, throwOnConsoleWarnings }
  from '../../../util/testUtils';
import { UnconnectedOwnedSections as OwnedSections }
  from '@cdo/apps/templates/teacherDashboard/OwnedSections';
import experiments, {SECTION_FLOW_2017} from '@cdo/apps/util/experiments';

const defaultProps = {
  numSections: 3,
  classrooms: null,
  studioUrl: '',
  asyncLoadComplete: true,
  newSection: () => {},
  loadClassroomList: () => {},
  importClassroomStarted: () => {},
  beginEditingNewSection: () => {},
  beginEditingSection: () => {},
  asyncLoadSectionData: () => {},
};

describe('OwnedSections', () => {
  throwOnConsoleErrors();
  throwOnConsoleWarnings();

  beforeEach(() => experiments.setEnabled(SECTION_FLOW_2017, false));

  it('provides default course id when creating new section', () => {
    const newSectionFunction = sinon.spy();
    const wrapper = shallow(
      <OwnedSections
        {...defaultProps}
        defaultCourseId={30}
        defaultScriptId={112}
        newSection={newSectionFunction}
      />
    );

    const newSectionButton = wrapper.find('Button').first();
    newSectionButton.simulate('click');
    assert.deepEqual(newSectionFunction.firstCall.args, [30]);
  });

  describe('with sections flow experiment', () => {
    beforeEach(() => experiments.setEnabled(SECTION_FLOW_2017, true));
    afterEach(() => experiments.setEnabled(SECTION_FLOW_2017, false));

    it('provides default courseId and scriptId when creating new section', () => {
      const newSectionFunction = sinon.spy();
      const wrapper = shallow(
        <OwnedSections
          {...defaultProps}
          defaultCourseId={30}
          defaultScriptId={112}
          beginEditingNewSection={newSectionFunction}
        />
      );

      const newSectionButton = wrapper.find('Button').first();
      newSectionButton.simulate('click');
      assert.deepEqual(newSectionFunction.firstCall.args, [30, 112]);
    });
  });
});
