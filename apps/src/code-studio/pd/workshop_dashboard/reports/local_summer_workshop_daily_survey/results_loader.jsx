import React, {PropTypes} from 'react';
import $ from "jquery";
import Spinner from '../../../components/spinner';
import Results from './results';

export class ResultsLoader extends React.Component {
  static propTypes = {
    params: PropTypes.shape({
      workshopId: PropTypes.string.isRequired
    })
  };

  state = {loading: true};

  componentDidMount() {
    this.load();
  }

  load() {
    const url = `/api/v1/pd/workshops/${this.props.params['workshopId']}/local_workshop_daily_survey_report`;

    this.loadRequest = $.ajax({
      method: 'GET',
      url: url,
      dataType: 'json'
    }).done(data => {
      this.setState({
        loading: false,
        questions: data['questions'],
        thisWorkshop: data['this_workshop'],
        allMyWorkshops: data['all_my_workshops'],
        sessions: Object.keys(data['this_workshop'])
      });
    });
  }

  render() {
    const {loading, ...data} = this.state;

    if (loading) {
      return (
        <div>
          <Spinner/>
        </div>
      );
    } else {
      return (
        <Results
          {...data}
        />
      );
    }
  }
}
