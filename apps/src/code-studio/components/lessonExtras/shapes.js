import PropTypes from 'prop-types';

export const bonusLevel = {
  id: PropTypes.number.isRequired,
  display_name: PropTypes.string.isRequired,
  description: PropTypes.string,
  thumbnail_url: PropTypes.string,
  url: PropTypes.string.isRequired,
  perfect: PropTypes.bool
};

export const stageOfBonusLevels = {
  stageNumber: PropTypes.number.isRequired,
  levels: PropTypes.arrayOf(PropTypes.shape(bonusLevel))
};
