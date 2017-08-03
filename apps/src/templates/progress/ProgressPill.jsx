import React, { PropTypes } from 'react';
import Radium from 'radium';
import FontAwesome from '../FontAwesome';
import color from '@cdo/apps/util/color';
import { levelType } from './progressTypes';
import { levelProgressStyle, hoverStyle } from './progressStyles';

const styles = {
  levelPill: {
    textAlign: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: color.lighter_gray,
    color: color.charcoal,
    display: 'flex',
    fontSize: 16,
    fontFamily: '"Gotham 5r", sans-serif',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 6,
    paddingBottom: 6,
    minWidth: 70,
  },
  text: {
    display: 'inline-block',
    fontFamily: '"Gotham 5r", sans-serif',
    fontSize: 14,
    letterSpacing: -0.12,
  },
  iconMargin: {
    marginLeft: 10
  }
};

/**
 * This component is similar to our ProgressBubble, except that instead of being
 * a circle with a number inside, it is an ellipse with text (and possibly an
 * icon)
 */
const ProgressPill = React.createClass({
  propTypes: {
    levels: PropTypes.arrayOf(levelType),
    icon: PropTypes.string,
    text: PropTypes.string,
    fontSize: PropTypes.number,
    tooltip: PropTypes.element
  },

  render() {
    const { levels, icon, text, fontSize, tooltip } = this.props;

    const multiLevelStep = levels.length > 1;
    const url = multiLevelStep ? undefined : levels[0].url;

    let style = {
      ...styles.levelPill,
      ...(url && hoverStyle),
      ...(!multiLevelStep && levelProgressStyle(levels[0], false)),
    };

    // If we're passed a tooltip, we also need to reference it from our div
    let tooltipProps = {};
    if (tooltip) {
      const id = tooltip.props.tooltipId;
      tooltipProps['data-tip'] = true;
      tooltipProps['data-for'] = id;
      tooltipProps['aria-describedby'] = id;
    }

    return (
      <a href={url} style={{textDecoration: 'none'}}>
        <div
          {...tooltipProps}
          style={style}
        >
          {icon && <FontAwesome icon={icon}/>}
          {text && (
            <div
              style={{
                ...styles.text,
                fontSize,
                ...(icon && styles.iconMargin)
              }}
            >
              {text}
            </div>
          )}
          {tooltip}
        </div>
      </a>
    );
  }
});

export default Radium(ProgressPill);
