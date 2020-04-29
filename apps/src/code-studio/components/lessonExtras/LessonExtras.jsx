import PropTypes from 'prop-types';
import React from 'react';
import i18n from '@cdo/locale';
import ProjectWidgetWithData from '@cdo/apps/templates/projects/ProjectWidgetWithData';
import {stageOfBonusLevels} from './shapes';
import LessonExtrasNotification from './LessonExtrasNotification';
import Button from '@cdo/apps/templates/Button';
import SublevelCard from '../SublevelCard';

const styles = {
  header: {
    fontSize: 24
  },
  headerAndButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  button: {
    margin: '10px 0px'
  },
  subHeader: {
    fontSize: 24,
    color: 'rgb(91, 103, 112)',
    fontFamily: 'Gotham 4r',
    fontWeight: 'normal',
    fontStyle: 'normal',
    paddingTop: 10,
    paddingBottom: 20
  },
  cards: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  }
};

export default class LessonExtras extends React.Component {
  static propTypes = {
    lessonNumber: PropTypes.number.isRequired,
    nextLessonNumber: PropTypes.number,
    nextLevelPath: PropTypes.string.isRequired,
    showProjectWidget: PropTypes.bool,
    projectTypes: PropTypes.arrayOf(PropTypes.string),
    bonusLevels: PropTypes.arrayOf(PropTypes.shape(stageOfBonusLevels)),
    sectionId: PropTypes.number,
    showLessonExtrasWarning: PropTypes.bool
  };

  render() {
    const {
      lessonNumber,
      nextLessonNumber,
      nextLevelPath,
      bonusLevels,
      sectionId,
      showProjectWidget,
      projectTypes,
      showLessonExtrasWarning
    } = this.props;
    const nextMessage = /stage/.test(nextLevelPath)
      ? i18n.extrasNextLesson({number: nextLessonNumber})
      : i18n.extrasNextFinish();

    return (
      <div>
        {showLessonExtrasWarning && sectionId && <LessonExtrasNotification />}
        <div style={styles.headerAndButton}>
          <h1 style={styles.header}>
            {i18n.extrasStageNumberCompleted({number: lessonNumber})}
          </h1>
          <Button
            __useDeprecatedTag
            href={nextLevelPath}
            text={nextMessage}
            size={Button.ButtonSize.large}
            color={Button.ButtonColor.orange}
            style={styles.button}
          />
        </div>

        <div style={styles.subHeader}>{i18n.extrasTryAChallenge()}</div>
        {bonusLevels && Object.keys(bonusLevels).length > 0 ? (
          <div style={styles.cards}>
            {bonusLevels[0].levels.map(sublevel => (
              <SublevelCard
                isLessonExtra={true}
                sublevel={sublevel}
                key={sublevel.id}
              />
            ))}
          </div>
        ) : (
          <p>{i18n.extrasNoBonusLevels()}</p>
        )}

        {showProjectWidget && (
          <ProjectWidgetWithData projectTypes={projectTypes} />
        )}
        <div className="clear" />
      </div>
    );
  }
}
