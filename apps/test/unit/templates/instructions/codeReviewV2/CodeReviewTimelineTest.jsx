import React from 'react';
import {shallow} from 'enzyme';
import {expect} from '../../../../util/reconfiguredChai';
import CodeReviewTimeline from '@cdo/apps/templates/instructions/codeReviewV2/CodeReviewTimeline';
import CodeReviewTimelineElement, {
  codeReviewTimelineElementType
} from '@cdo/apps/templates/instructions/codeReviewV2/CodeReviewTimelineElement';
import CodeReviewTimelineCommit from '@cdo/apps/templates/instructions/codeReviewV2/CodeReviewTimelineCommit';
import CodeReviewTimelineReview from '@cdo/apps/templates/instructions/codeReviewV2/CodeReviewTimelineReview';

const DEFAULT_PROPS = {
  reviewData: [
    {
      id: 1,
      createdAt: '2022-03-15T04:58:42.000Z',
      isClosed: true,
      projectVersion: 'asdfjkl',
      isVersionExpired: false,
      comments: [
        {
          id: 123,
          commentText: 'Great work on this!',
          name: 'Steve',
          timestampString: '2022-03-31T04:58:42.000Z',
          isResolved: false
        },
        {
          id: 124,
          commentText: 'Could you add more comments?',
          name: 'Karen',
          timestampString: '2022-03-31T04:58:42.000Z',
          isResolved: false
        }
      ]
    }
  ],
  commitsData: [
    {
      id: 1,
      createdAt: '2022-03-04T04:58:42.000Z',
      comment: 'First commit',
      projectVersion: 'asdfjkl',
      isVersionExpired: false
    },
    {
      id: 2,
      createdAt: '2022-03-20T04:58:42.000Z',
      comment: 'Second commit (after review)',
      projectVersion: 'lkjfds',
      isVersionExpired: false
    }
  ]
};

const setUp = (overrideProps = {}) => {
  const props = {...DEFAULT_PROPS, ...overrideProps};
  return shallow(<CodeReviewTimeline {...props} />);
};

describe('CodeReviewTimeline', () => {
  it('renders a created node', () => {
    const wrapper = setUp();
    const createdElement = wrapper.find(CodeReviewTimelineElement);
    expect(createdElement).to.have.length(1);
    expect(createdElement.props().type).to.equal(
      codeReviewTimelineElementType.CREATED
    );
    expect(createdElement.props().isLast).to.be.false;
  });

  it('if there is no commit or review data created node will have is last set to true', () => {
    const wrapper = setUp({reviewData: [], commitsData: []});
    const createdElement = wrapper.find(CodeReviewTimelineElement);
    expect(createdElement.props().isLast).to.be.true;
  });

  it('renders every commit as a CodeReviewTimelineCommit', () => {
    const wrapper = setUp();
    // For 2 commits in the commitsData array
    expect(wrapper.find(CodeReviewTimelineCommit)).to.have.length(2);
  });

  it('renders every review as a CodeReviewTimelineReview', () => {
    const wrapper = setUp();
    // For 1 review in the reviewData array
    expect(wrapper.find(CodeReviewTimelineReview)).to.have.length(1);
  });

  it('sorts the timeline elements by date and has expected isLast property', () => {
    const wrapper = setUp();

    const createdElement = wrapper.childAt(0);
    expect(createdElement.find(CodeReviewTimelineElement)).to.have.length(1);

    const firstCommit = wrapper.childAt(1);
    expect(firstCommit.find(CodeReviewTimelineCommit)).to.have.length(1);
    expect(firstCommit.props().isLastElementInTimeline).to.be.false;

    const review = wrapper.childAt(2);
    expect(review.find(CodeReviewTimelineReview)).to.have.length(1);
    expect(review.props().isLastElementInTimeline).to.be.false;

    const secondCommit = wrapper.childAt(3);
    expect(secondCommit.find(CodeReviewTimelineCommit)).to.have.length(1);
    expect(secondCommit.props().isLastElementInTimeline).to.be.true;
  });
});
