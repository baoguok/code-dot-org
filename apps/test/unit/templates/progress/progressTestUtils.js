import _ from 'lodash';
import { LevelStatus } from '@cdo/apps/util/sharedConstants';

export const fakeLesson = (name, id) => ({name, id});

export const fakeLevels = numLevels => _.range(numLevels).map(index => ({
  status: LevelStatus.not_tried,
  url: `/level${index}`,
  name: `Level ${index}`
}));
