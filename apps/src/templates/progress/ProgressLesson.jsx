import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import ProgressLessonContent from './ProgressLessonContent';
import FontAwesome from '../FontAwesome';
import color from "@cdo/apps/util/color";
import { levelType, lessonType } from './progressTypes';
import { ViewType } from '@cdo/apps/code-studio/stageLockRedux';
import i18n from '@cdo/locale';
import { lessonIsVisible, lessonIsLockedForAllStudents } from './progressHelpers';
import { LevelStatus } from '@cdo/apps/util/sharedConstants';
import ProgressLessonTeacherInfo from './ProgressLessonTeacherInfo';
import FocusAreaIndicator from './FocusAreaIndicator';

const styles = {
  outer: {
    position: 'relative',
    display: 'table',
    width: '100%',
    marginBottom: 12,
    background: color.lightest_gray,
    borderWidth: 1,
    borderColor: color.border_gray,
    borderStyle: 'solid',
    borderRadius: 2,
  },
  rightCol: {
    display: 'table-cell',
    verticalAlign: 'top',
    width: 200,
    height: '100%',
    borderRadius: 2,
  },
  main: {
    padding: 20,
  },
  heading: {
    fontSize: 18,
    fontFamily: '"Gotham 5r", sans-serif',
  },
  hiddenOrLocked: {
    background: color.white,
    borderStyle: 'dashed',
  },
  translucent: {
    opacity: 0.6
  },
  caret: {
    marginRight: 10
  },
  icon: {
    marginRight: 5,
    fontSize: 18,
    color: color.cyan
  },
  unlockedIcon: {
    color: color.orange
  }
};

const ProgressLesson = React.createClass({
  propTypes: {
    description: PropTypes.string,
    lesson: lessonType.isRequired,
    levels: PropTypes.arrayOf(levelType).isRequired,

    // redux provided
    showTeacherInfo: PropTypes.bool.isRequired,
    viewAs: PropTypes.oneOf(Object.values(ViewType)).isRequired,
    lessonIsVisible: PropTypes.func.isRequired,
    lessonLockedForSection: PropTypes.func.isRequired
  },

  getInitialState() {
    return {
      collapsed: false
    };
  },

  toggleCollapsed() {
    this.setState({
      collapsed: !this.state.collapsed
    });
  },

  render() {
    const {
      description,
      lesson,
      levels,
      showTeacherInfo,
      viewAs,
      lessonIsVisible,
      lessonLockedForSection
    } = this.props;

    if (!lessonIsVisible(lesson, viewAs)) {
      return null;
    }

    // Is this a hidden stage that we still render because we're a teacher
    const hiddenForStudents = !lessonIsVisible(lesson, ViewType.Student);
    const title = lesson.stageNumber ?
      i18n.lessonNumbered({lessonNumber: lesson.stageNumber, lessonName: lesson.name}) :
      lesson.name;
    const caret = this.state.collapsed ? "caret-right" : "caret-down";

    const locked = lessonLockedForSection(lesson.id) ||
      levels.every(level => level.status === LevelStatus.locked);

    const hiddenOrLocked = hiddenForStudents || locked;
    return (
      <div
        style={{
          ...styles.outer,
          ...(hiddenOrLocked && styles.hiddenOrLocked)
        }}
      >
        <div
          style={{
            ...styles.main,
            ...(hiddenOrLocked && viewAs !== ViewType.Teacher && styles.translucent)
          }}
        >
          <div
            style={styles.heading}
            onClick={this.toggleCollapsed}
          >
            <FontAwesome icon={caret} style={styles.caret}/>
            {hiddenForStudents &&
              <FontAwesome
                icon="eye-slash"
                style={styles.icon}
              />
            }
            {lesson.lockable &&
              <FontAwesome
                icon={locked ? 'lock' : 'unlock'}
                style={{
                  ...styles.icon,
                  ...(!locked && styles.unlockedIcon)
                }}
              />
            }
            <span>{title}</span>
          </div>
          {!this.state.collapsed &&
            <ProgressLessonContent
              description={description}
              levels={levels}
              disabled={locked && viewAs !== ViewType.Teacher}
            />
          }
        </div>
        {showTeacherInfo && viewAs === ViewType.Teacher &&
          <div style={styles.rightCol}>
            <ProgressLessonTeacherInfo lesson={lesson}/>
          </div>
        }
        {lesson.isFocusArea && <FocusAreaIndicator/>}
      </div>
    );
  }
});

export const UnconnectedProgressLesson = ProgressLesson;

export default connect(state => ({
  showTeacherInfo: state.progress.showTeacherInfo,
  viewAs: state.stageLock.viewAs,
  lessonLockedForSection: lessonId => lessonIsLockedForAllStudents(lessonId, state),
  lessonIsVisible: (lesson, viewAs) => lessonIsVisible(lesson, state, viewAs)
}))(ProgressLesson);
