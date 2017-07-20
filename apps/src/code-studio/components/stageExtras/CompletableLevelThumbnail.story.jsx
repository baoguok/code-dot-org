import React from 'react';
import CompletableLevelThumbnail from './CompletableLevelThumbnail';
import MazeThumbnail from './MazeThumbnail';

const sampleMapA = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 0, 1, 0, 0],
  [0, 0, 2, 1, 1, 1, 0, 0],
  [0, 0, 0, 4, 0, 1, 0, 0],
  [0, 0, 0, 1, 0, 1, 4, 0],
  [0, 0, 0, 1, 0, 1, 0, 0],
  [0, 3, 1, 1, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const sampleMapB = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 4, 2, 4, 0],
  [0, 0, 0, 4, 1, 1, 0, 0],
  [0, 4, 4, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 0, 1, 4, 0],
  [0, 0, 1, 1, 0, 4, 0, 0],
  [0, 0, 1, 3, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

export default storybook => {
  storybook
    .storiesOf('CompletableLevelThumbnail', module)
    .addWithInfo(
      'Overview',
      'This is the CompletableLevelThumbnail component.',
      () => (
        <div>
          <CompletableLevelThumbnail size={200} completed={true} style={{float: 'left'}}>
            <MazeThumbnail
              map={sampleMapA}
              startDirection={1}
              skin="birds"
            />
          </CompletableLevelThumbnail>
          &nbsp;
          <CompletableLevelThumbnail size={200} completed={true}>
            <MazeThumbnail
              map={sampleMapB}
              startDirection={2}
              skin="scrat"
            />
          </CompletableLevelThumbnail>
          &nbsp;
          <CompletableLevelThumbnail size={200} completed={false}>
            <MazeThumbnail
              map={sampleMapA}
              startDirection={2}
              skin="farmer_night"
            />
          </CompletableLevelThumbnail>
        </div>
      ),
    );
};
