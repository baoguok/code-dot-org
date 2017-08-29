import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import ReactTooltip from 'react-tooltip';
import _ from 'lodash';
import TeacherInfoBox from '@cdo/apps/templates/progress/TeacherInfoBox';
import HiddenStageToggle from '@cdo/apps/templates/progress/HiddenStageToggle';
import { isHiddenForSection } from '@cdo/apps/code-studio/hiddenStageRedux';
import i18n from '@cdo/locale';

class CourseScriptTeacherInfo extends Component {
  static propTypes = {
    courseId: PropTypes.number.isRequired,
    // redux provided
    hasNoSections: PropTypes.bool.isRequired,
    selectedSectionId: PropTypes.string.isRequired,
    hiddenStageState: PropTypes.object.isRequired,
  };

  render() {
    const { courseId, hasNoSections, selectedSectionId, hiddenStageState } = this.props;
    // Note: Students should always have no (owned) sections
    const showHiddenScriptToggle = !hasNoSections;
    const tooltipId = _.uniqueId();

    const isHidden = selectedSectionId &&
      isHiddenForSection(hiddenStageState, selectedSectionId, courseId);

    return (
      <TeacherInfoBox>
        {showHiddenScriptToggle &&
          <div
            data-tip
            data-for={tooltipId}
            aria-describedby={tooltipId}
          >
            <HiddenStageToggle
              hidden={isHidden}
              disabled={!selectedSectionId}
              onChange={() => console.log('change')}
            />
          </div>
        }
        <ReactTooltip
          id={tooltipId}
          role="tooltip"
          wrapper="span"
          effect="solid"
          disable={!!selectedSectionId}
        >
          {i18n.hiddenScriptTooltip()}
        </ReactTooltip>
      </TeacherInfoBox>
    );
  }
}

export default connect(state => ({
  hasNoSections: state.teacherSections.sectionsAreLoaded &&
    state.teacherSections.sectionIds.length === 0,
  selectedSectionId: state.teacherSections.selectedSectionId,
  hiddenStageState: state.hiddenStage,
}))(CourseScriptTeacherInfo);
