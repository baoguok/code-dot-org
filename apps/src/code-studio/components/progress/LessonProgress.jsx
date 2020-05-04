import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import color from '../../../util/color';
import LessonExtrasProgressBubble from '@cdo/apps/templates/progress/LessonExtrasProgressBubble';
import LessonTrophyProgressBubble from '@cdo/apps/templates/progress/LessonTrophyProgressBubble';
import {
  levelsForLessonId,
  lessonExtrasUrl,
  getPercentPerfect
} from '@cdo/apps/code-studio/progressRedux';
import ProgressBubble from '@cdo/apps/templates/progress/ProgressBubble';
import {levelType} from '@cdo/apps/templates/progress/progressTypes';
import Measure from 'react-measure';

const styles = {
  outerContainer: {
    width: '100%',
    overflow: 'hidden'
  },
  headerContainer: {
    // With our new bubble we don't want any padding above/below
    paddingLeft: 5,
    paddingRight: 5,
    backgroundColor: color.lightest_gray,
    border: `1px solid ${color.lighter_gray}`,
    borderRadius: 5,
    height: 40,
    display: 'inline-block'
  },
  innerContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  },
  spacer: {
    marginRight: 'auto'
  },
  lessonTrophyContainer: {
    border: 0,
    borderRadius: 20,
    paddingLeft: 8,
    paddingRight: 0,
    minWidth: 350,
    marginLeft: 48
  },
  pillContainer: {
    // Vertical padding is so that this lines up with other bubbles
    paddingTop: 4,
    paddingBottom: 4
  }
};

/**
 * Lesson progress component used in level header and course overview.
 */
class LessonProgress extends Component {
  static propTypes = {
    // redux provided
    levels: PropTypes.arrayOf(levelType).isRequired,
    lessonExtrasUrl: PropTypes.string,
    onLessonExtras: PropTypes.bool,
    lessonTrophyEnabled: PropTypes.bool
  };

  state = {
    outerDimensions: {
      width: -1,
      height: -1
    },
    innerDimensions: {
      width: -1,
      height: -1
    }
  };

  render() {
    const {lessonExtrasUrl, onLessonExtras, lessonTrophyEnabled} = this.props;
    let levels = this.props.levels;

    // Only puzzle levels (non-concept levels) should count towards mastery.
    if (lessonTrophyEnabled) {
      levels = levels.filter(level => !level.isConceptLevel);
    }

    // Bonus levels should not count towards mastery.
    levels = levels.filter(level => !level.bonus);

    // which dot is current level?
    var currentLevelIndex = 0;
    for (const [i, l] of levels.entries()) {
      if (l.isCurrentLevel) {
        currentLevelIndex = i;
        break;
      }
    }

    var offsetX = 0;

    if (this.state.outerDimensions.width !== -1) {
      var currentLevelX = currentLevelIndex * 17;
      var currentOuterContainerWidth = this.state.outerDimensions.width; //this.innerContainerRef.offsetWidth;

      // do we need to pull our dots to the left to see the current level?
      //if (currentLevelX > currentOuterContainerWidth - 6 * 17) {
      offsetX = currentLevelX - currentOuterContainerWidth / 2 + 40 / 2;
      if (offsetX < 0) {
        offsetX = 0;
      }
      //}
    }

    return (
      <Measure
        bounds
        onResize={contentRect => {
          this.setState({outerDimensions: contentRect.bounds});
          console.log('outerDimensions', contentRect.bounds);
        }}
      >
        {/* The container for what we will see of the progress control. */}
        {({measureRef}) => (
          <div ref={measureRef} style={styles.outerContainer}>
            {/*this.state.outerDimensions.width} x {this.state.outerDimensions.height*/}
            {/* The grey rectangle with rounded corners that we will render
                at a panned offset. */}
            <div
              className="react_stage"
              style={{
                ...styles.headerContainer,
                ...(lessonTrophyEnabled && styles.lessonTrophyContainer),
                transform: 'translateX(' + -offsetX + 'px)'
              }}
            >
              {/* The full set of bubbles. */}
              <div style={styles.innerContainer}>
                {lessonTrophyEnabled && <div style={styles.spacer} />}
                {levels.map((level, index) => (
                  <div
                    key={index}
                    style={{
                      ...(level.isUnplugged &&
                        level.isCurrentLevel &&
                        styles.pillContainer)
                    }}
                  >
                    <ProgressBubble
                      level={level}
                      disabled={false}
                      smallBubble={!level.isCurrentLevel}
                      lessonTrophyEnabled={lessonTrophyEnabled}
                    />
                  </div>
                ))}
                {lessonExtrasUrl && !lessonTrophyEnabled && (
                  <LessonExtrasProgressBubble
                    lessonExtrasUrl={lessonExtrasUrl}
                    onLessonExtras={onLessonExtras}
                  />
                )}
                {lessonTrophyEnabled && (
                  <LessonTrophyProgressBubble
                    percentPerfect={getPercentPerfect(levels)}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </Measure>
    );
  }
}

export const UnconnectedLessonProgress = LessonProgress;

export default connect(state => ({
  levels: levelsForLessonId(state.progress, state.progress.currentStageId),
  lessonExtrasUrl: lessonExtrasUrl(
    state.progress,
    state.progress.currentStageId
  ),
  onLessonExtras: state.progress.currentLevelId === 'stage_extras'
}))(LessonProgress);
