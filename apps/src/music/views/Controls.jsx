import PropTypes from 'prop-types';
import React, {useState, useEffect, useContext} from 'react';
import classNames from 'classnames';
import FontAwesome from '../../templates/FontAwesome';
import {Triggers} from '@cdo/apps/music/constants';
import moduleStyles from './controls.module.scss';
import BeatPad from './BeatPad';
import {AnalyticsContext} from '../context';
import {useSelector} from 'react-redux';

const documentationUrl = '/docs/ide/projectbeats';

/**
 * Renders the playback controls bar, including the play/pause button, show/hide beat pad button,
 * and show/hide instructions button.
 */
const Controls = ({
  setPlaying,
  playTrigger,
  top,
  instructionsAvailable,
  toggleInstructions,
  instructionsOnRight
}) => {
  const isPlaying = useSelector(state => state.music.isPlaying);
  const [isShowingBeatPad, setBeatPadShowing] = useState(false);
  useEffect(() => {
    if (isPlaying) {
      setBeatPadShowing(true);
    }
  }, [isPlaying]);

  const analyticsReporter = useContext(AnalyticsContext);

  const renderBeatPad = () => {
    return (
      <div
        style={{
          position: 'absolute',
          [top ? 'bottom' : 'top']: -175,
          [instructionsOnRight ? 'left' : 'right']: 10
        }}
      >
        <BeatPad
          triggers={Triggers}
          playTrigger={playTrigger}
          onClose={() => {
            setBeatPadShowing(false);
            analyticsReporter.onButtonClicked('show-hide-beatpad', {
              showing: false
            });
          }}
          isPlaying={isPlaying}
        />
      </div>
    );
  };

  const renderIconButton = (icon, onClick) => (
    <div className={classNames(moduleStyles.controlButtons, moduleStyles.side)}>
      <FontAwesome
        icon={icon}
        className={moduleStyles.iconButton}
        onClick={onClick}
      />
    </div>
  );

  const beatPadIconSection = renderIconButton('th', () => {
    analyticsReporter.onButtonClicked('show-hide-beatpad', {
      showing: !isShowingBeatPad
    });
    setBeatPadShowing(!isShowingBeatPad);
  });
  const infoIconSection = instructionsAvailable
    ? renderIconButton('info-circle', toggleInstructions)
    : null;

  const [leftIcon, rightIcon] = instructionsOnRight
    ? [beatPadIconSection, infoIconSection]
    : [infoIconSection, beatPadIconSection];

  return (
    <div id="controls" className={moduleStyles.controlsContainer}>
      {isShowingBeatPad && renderBeatPad()}
      {leftIcon}
      <div
        className={classNames(moduleStyles.controlButtons, moduleStyles.center)}
      >
        <FontAwesome
          icon={isPlaying ? 'stop-circle' : 'play-circle'}
          onClick={() => setPlaying(!isPlaying)}
          className={moduleStyles.iconButton}
        />
      </div>
      <div
        className={classNames(moduleStyles.controlButtons, moduleStyles.side)}
      >
        <a href={documentationUrl} target="_blank" rel="noopener noreferrer">
          <FontAwesome
            icon={'question-circle-o'}
            onClick={() => {
              analyticsReporter.onButtonClicked('documentation-link');
            }}
            className={classNames(
              moduleStyles.iconButton,
              moduleStyles.iconButtonLink
            )}
          />
        </a>
      </div>
      {rightIcon}
    </div>
  );
};

Controls.propTypes = {
  setPlaying: PropTypes.func.isRequired,
  playTrigger: PropTypes.func.isRequired,
  top: PropTypes.bool.isRequired,
  instructionsAvailable: PropTypes.bool.isRequired,
  toggleInstructions: PropTypes.func.isRequired,
  instructionsOnRight: PropTypes.bool.isRequired
};

export default Controls;
