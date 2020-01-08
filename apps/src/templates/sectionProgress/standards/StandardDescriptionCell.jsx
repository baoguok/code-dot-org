import PropTypes from 'prop-types';
import React, {Component} from 'react';
import ReactTooltip from 'react-tooltip';
import i18n from '@cdo/locale';
import ProgressBoxForLessonNumber from './ProgressBoxForLessonNumber';

const styles = {
  main: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  description: {
    marginBottom: 10
  },
  lessonsArea: {
    display: 'flex',
    flexDirection: 'row'
  },
  lessonsAreaTitle: {
    marginRight: 10
  }
};

class StandardDescriptionCell extends Component {
  static propTypes = {
    description: PropTypes.string,
    lessonsForStandardStatus: PropTypes.array
  };

  getLessonBoxes = () => {
    if (this.props.lessonsForStandardStatus) {
      return this.props.lessonsForStandardStatus.map((lesson, index) => {
        return (
          <span>
            <ReactTooltip
              id={lesson.name}
              role="tooltip"
              wrapper="span"
              effect="solid"
              place="top"
            >
              {lesson.name}
              {lesson.completed ? 'Completed' : 'Not Completed'}
            </ReactTooltip>
            <ProgressBoxForLessonNumber
              key={lesson.lessonNumber}
              completed={lesson.completed}
              lessonNumber={lesson.lessonNumber}
              tooltipId={lesson.name}
            />
          </span>
        );
      });
    } else {
      return;
    }
  };

  getNumberLessons = () => {
    if (this.props.lessonsForStandardStatus) {
      return this.props.lessonsForStandardStatus.length;
    } else {
      return 0;
    }
  };

  render() {
    return (
      <div style={styles.main}>
        <div style={styles.description}>{this.props.description}</div>
        <div style={styles.lessonsArea}>
          <span style={styles.lessonsAreaTitle}>
            {i18n.availableLessons({numLessons: this.getNumberLessons()})}
          </span>
          {this.getLessonBoxes()}
        </div>
      </div>
    );
  }
}

export default StandardDescriptionCell;
