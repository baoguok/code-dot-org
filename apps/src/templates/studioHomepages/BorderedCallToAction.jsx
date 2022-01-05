import React from 'react';
import PropTypes from 'prop-types';
import Radium from 'radium';
import color from '@cdo/apps/util/color';
import styleConstants from '@cdo/apps/styleConstants';
import Button from '@cdo/apps/templates/Button';
import {navigateToHref} from '@cdo/apps/utils';

const BorderedCallToAction = props => {
  const {
    headingText,
    descriptionText,
    className,
    buttonText,
    buttonUrl,
    buttonClass,
    onClick,
    solidBorder
  } = props;

  const borderStyle = solidBorder ? styles.solidBorder : styles.dashedBorder;

  return (
    <div style={[styles.outerBox, borderStyle]} className={className}>
      <div style={styles.wordBox}>
        <div style={styles.heading}>{headingText}</div>
        <div style={styles.description}>{descriptionText}</div>
      </div>
      <Button
        onClick={onClick || (() => navigateToHref(buttonUrl))}
        className={buttonClass}
        color={Button.ButtonColor.gray}
        text={buttonText}
        style={styles.button}
      />
    </div>
  );
};

BorderedCallToAction.defaultProps = {
  buttonColor: Button.ButtonColor.gray
};

BorderedCallToAction.propTypes = {
  isRtl: PropTypes.bool,
  headingText: PropTypes.string.isRequired,
  descriptionText: PropTypes.string.isRequired,
  className: PropTypes.string,
  buttonText: PropTypes.string.isRequired,
  buttonUrl: PropTypes.string,
  buttonClass: PropTypes.string,
  buttonColor: PropTypes.oneOf(Object.keys(Button.ButtonColor)),
  onClick: PropTypes.func,
  solidBorder: PropTypes.bool
};

const extraSpace = 25;

const styles = {
  outerBox: {
    width: styleConstants['content-width'],
    backgroundColor: color.white,
    borderColor: color.border_gray,
    boxSizing: 'border-box',
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'space-between'
  },
  solidBorder: {
    borderStyle: 'solid',
    borderWidth: 1
  },
  dashedBorder: {
    borderStyle: 'dashed',
    borderWidth: 5
  },
  wordBox: {
    paddingLeft: extraSpace,
    paddingRight: extraSpace
  },
  heading: {
    fontSize: 20,
    fontFamily: 'Gotham 5r',
    fontWeight: 'bold',
    color: color.teal,
    paddingTop: extraSpace
  },
  description: {
    fontSize: 14,
    color: color.charcoal,
    paddingTop: 5,
    paddingBottom: extraSpace
  },
  button: {
    marginTop: 28,
    marginLeft: extraSpace,
    marginRight: extraSpace,
    paddingLeft: extraSpace,
    paddingRight: extraSpace
  }
};

export const UnconnectedBorderedCallToAction = BorderedCallToAction;

export default Radium(BorderedCallToAction);
