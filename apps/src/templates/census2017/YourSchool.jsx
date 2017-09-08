import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import {UnconnectedCensusForm as CensusForm} from './CensusForm';
import YourSchoolResources from './YourSchoolResources';
import Notification from '../Notification';
import i18n from "@cdo/locale";
import ProtectedStatefulDiv from '../ProtectedStatefulDiv';

const styles = {
  heading: {
    marginTop: 20,
    marginBottom: 0
  },
  description: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 14,
    fontFamily: '"Gotham 4r", sans-serif',
    lineHeight: '1.5em'
  },
};

export default class YourSchool extends React.Component {
  static propTypes = {
    alertHeading: React.PropTypes.string,
    alertText: React.PropTypes.string,
    alertUrl: React.PropTypes.string
  };

  componentDidMount() {
    $('#gmap').appendTo(ReactDOM.findDOMNode(this.refs.gmap)).show();
  }

  render() {
    return (
      <div>
        {this.props.alertHeading && this.props.alertText && this.props.alertUrl && (
          <Notification
            type="bullhorn"
            notice={this.props.alertHeading}
            details={this.props.alertText}
            dismissible={false}
            buttonText={i18n.learnMore()}
            buttonLink={this.props.alertUrl}
            newWindow={true}
            isRtl={false}
          />
        )}
        <h1 style={styles.heading}>
          {i18n.yourSchoolHeading()}
        </h1>
        <h3 style={styles.description}>
          {i18n.yourSchoolDescription()}
        </h3>
        <YourSchoolResources/>
        <h1 style={styles.heading}>
          Pledge to expand computer science in your area
        </h1>
        <h3 style={styles.description}>
           If you are located in the US, please fill out the form below. If you are outside the US, add your school <a href="/learn/local">here</a>.
        </h3>
        <ProtectedStatefulDiv ref="gmap"/>
        <CensusForm/>
      </div>
    );
  }
}
