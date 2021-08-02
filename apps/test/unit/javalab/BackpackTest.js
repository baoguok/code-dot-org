import React from 'react';
import {expect, assert} from '../../util/reconfiguredChai';
import {shallow} from 'enzyme';
import {registerReducers, stubRedux, restoreRedux} from '@cdo/apps/redux';
import javalab from '@cdo/apps/javalab/javalabRedux';
import BackpackClientApi from '@cdo/apps/code-studio/components/backpack/BackpackClientApi';
import sinon from 'sinon';
import {UnconnectedBackpack as Backpack} from '@cdo/apps/javalab/Backpack';

describe('Java Lab Backpack Test', () => {
  let defaultProps, backpackApiStub;

  beforeEach(() => {
    stubRedux();
    registerReducers({javalab});
    backpackApiStub = sinon.createStubInstance(BackpackClientApi);
    backpackApiStub.hasBackpack.returns(true);
    defaultProps = {
      isDarkMode: true,
      isDisabled: false,
      onImport: () => {},
      backpackApi: backpackApiStub
    };
  });

  afterEach(() => {
    restoreRedux();
  });

  it('updates selected files correctly', () => {
    const wrapper = shallow(<Backpack {...defaultProps} />);
    wrapper
      .instance()
      .handleFileCheckboxChange({target: {name: 'Class1.java', checked: true}});
    wrapper
      .instance()
      .handleFileCheckboxChange({target: {name: 'Class2.java', checked: true}});
    wrapper
      .instance()
      .handleFileCheckboxChange({target: {name: 'Class3.java', checked: true}});
    wrapper.instance().handleFileCheckboxChange({
      target: {name: 'Class1.java', checked: false}
    });
    const selectedFiles = wrapper.instance().state.selectedFiles;
    expect(selectedFiles.length).to.equal(2);
    expect(selectedFiles[0]).to.equal('Class2.java');
    expect(selectedFiles[1]).to.equal('Class3.java');
  });

  it('expand dropdown triggers getFileList', () => {
    const wrapper = shallow(<Backpack {...defaultProps} />);
    wrapper.instance().expandDropdown();
    expect(backpackApiStub.getFileList.calledOnce);
  });

  it('expand dropdown resets state correctly', () => {
    const wrapper = shallow(<Backpack {...defaultProps} />);
    // set state to something that should be cleared by expandDropdown
    wrapper.instance().setState({
      dropdownOpen: false,
      backpackLoadError: true,
      selectedFiles: ['file1', 'file2'],
      backpackFilenames: ['file1', 'file2', 'file3']
    });

    wrapper.instance().expandDropdown();
    const state = wrapper.instance().state;
    assert(state.dropdownOpen);
    assert.isFalse(state.backpackLoadError);
    expect(state.selectedFiles.length).to.equal(0);
    expect(state.backpackFilenames.length).to.equal(0);
  });
});
