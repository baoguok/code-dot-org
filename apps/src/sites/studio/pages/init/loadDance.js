import appMain from '@cdo/apps/appMain';
import {singleton as studioApp} from '@cdo/apps/StudioApp';
import Dance from '@cdo/apps/dance/Dance';
import * as dancelabConstants from '@cdo/apps/dance/constants';
import blocks from '@cdo/apps/dance/blocks';

export default function loadDancelab(options) {
  options.blocksModule = blocks;
  options.maxVisualizationWidth = dancelabConstants.MAX_GAME_WIDTH;
  options.minVisualizationWidth = dancelabConstants.MIN_GAME_WIDTH;
  const dance = new Dance();

  dance.injectStudioApp(studioApp());
  appMain(dance, {custom: {}}, options);

  return dance;
}
