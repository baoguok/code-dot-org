/** @file Vertical scrolling list of animation sequences */
'use strict';

import { show, Goal } from '../AnimationPicker/animationPickerModule';
import AnimationListItem from './AnimationListItem';
var color = require('../../color');
var connect = require('react-redux').connect;
var NewListItem = require('./NewListItem');
var ScrollableList = require('./ScrollableList');
import { METADATA_SHAPE } from '../animationMetadata';

var styles = {
  root: {
    flex: '1 0 0',
    borderTop: 'solid thin ' + color.light_purple,
    borderBottom: 'solid thin ' + color.light_purple,
    borderLeft: 'solid thin ' + color.light_purple,
    borderRight: 'none',
    backgroundColor: color.white
  }
};

/**
 * Vertical scrolling list of animations associated with the project.
 */
var AnimationList = function (props) {
  return (
    <ScrollableList style={styles.root} className="animationList">
      {props.animations.map(function (animation) {
        return <AnimationListItem
            key={animation.key}
            animation={animation}
            isSelected={animation.key === props.selectedAnimation} />;
      })}
      <NewListItem
          key="new_animation"
          label="new sequence"
          onClick={props.onNewItemClick} />
    </ScrollableList>
  );
};
AnimationList.propTypes = {
  animations: React.PropTypes.arrayOf(React.PropTypes.shape(METADATA_SHAPE)).isRequired,
  selectedAnimation: React.PropTypes.string,
  onNewItemClick: React.PropTypes.func.isRequired
};
module.exports = connect(function propsFromState(state) {
  return {
    animations: state.animations,
    selectedAnimation: state.animationTab.selectedAnimation
  };
}, function propsFromDispatch(dispatch) {
  return {
    onNewItemClick: function () {
      dispatch(show(Goal.NEW_ANIMATION));
    }
  };
})(AnimationList);
