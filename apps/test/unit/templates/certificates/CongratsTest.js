import React from 'react';
import {shallow} from 'enzyme';
import {expect} from '../../../util/reconfiguredChai';
import Congrats from '@cdo/apps/templates/certificates/Congrats';
import Certificate from '@cdo/apps/templates/certificates/Certificate';
import StudentsBeyondHoc from '@cdo/apps/templates/certificates/StudentsBeyondHoc';
import TeachersBeyondHoc from '@cdo/apps/templates/certificates/TeachersBeyondHoc';

const initialCertificateImageUrl = '/images/placeholder-hoc-image.jpg';

describe('Congrats', () => {
  it('renders a Certificate component', () => {
    const wrapper = shallow(
      <Congrats
        completedTutorialType="other"
        userType="signedOut"
        language="en"
        initialCertificateImageUrl={initialCertificateImageUrl}
      />
    );
    expect(wrapper.find(Certificate).exists()).to.be.true;
  });

  it('renders a StudentsBeyondHoc component, regardless of user type', () => {
    const wrapper = shallow(
      <Congrats
        completedTutorialType="other"
        userType="signedOut"
        language="en"
        initialCertificateImageUrl={initialCertificateImageUrl}
      />
    );
    expect(wrapper.find(StudentsBeyondHoc).exists()).to.be.true;
  });

  it('renders a TeachersBeyondHoc component, for teachers', () => {
    const wrapper = shallow(
      <Congrats
        completedTutorialType="other"
        userType="teacher"
        language="en"
        initialCertificateImageUrl={initialCertificateImageUrl}
      />
    );
    expect(wrapper.find(TeachersBeyondHoc).exists()).to.be.true;
  });

  it('renders a TeachersBeyondHoc component, for signed out', () => {
    const wrapper = shallow(
      <Congrats
        completedTutorialType="other"
        userType="signedOut"
        language="en"
        initialCertificateImageUrl={initialCertificateImageUrl}
      />
    );
    expect(wrapper.find(TeachersBeyondHoc).exists()).to.be.true;
  });

  it('does not render a TeachersBeyondHoc component, for students', () => {
    const wrapper = shallow(
      <Congrats
        completedTutorialType="other"
        userType="student"
        language="en"
        initialCertificateImageUrl={initialCertificateImageUrl}
      />
    );
    expect(wrapper.find(TeachersBeyondHoc).exists()).to.be.false;
  });
});
