/* global ClipboardItem */
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import moment from 'moment';
import msg from '@cdo/locale';
import {svgToDataURI} from '@cdo/apps/imageUtils';
import {html2canvas} from '@cdo/apps/util/htmlToCanvasWrapper';
import BaseDialog from '@cdo/apps/templates/BaseDialog';
import PendingButton from '@cdo/apps/templates/PendingButton';
import {ChartType} from '../dataUtils';
import * as dataStyles from '../dataStyles';

const INITIAL_STATE = {
  isSnapshotOpen: false,
  isCopyPending: false,
  isSavePending: false,
  imageSrc: require('./placeholder.png')
};

class Snapshot extends React.Component {
  static propTypes = {
    chartType: PropTypes.number.isRequired,
    chartTitle: PropTypes.string.isRequired,
    selectedOptions: PropTypes.string.isRequired,
    // Provided via Redux
    tableName: PropTypes.string.isRequired,
    projectName: PropTypes.string.isRequired
  };

  state = {...INITIAL_STATE};

  componentDidMount() {
    this.isMounted_ = true;
  }

  componentWillUnmount() {
    this.isMounted_ = false;
  }

  handleOpen = () => {
    this.setState({isSnapshotOpen: true});
    this.getImageFromChart();
  };

  handleClose = () => this.setState(INITIAL_STATE);

  getImageFromChart = () => {
    switch (this.props.chartType) {
      case ChartType.BAR_CHART:
      case ChartType.HISTOGRAM:
      case ChartType.SCATTER_PLOT:
        this.getImageFromGoogleChart();
        break;
      case ChartType.CROSS_TAB:
        this.getImageFromCrossTab();
        break;
      default:
    }
  };

  getImageFromCrossTab = () => {
    const element = document.getElementById('crossTabContainer');
    if (!element) {
      return;
    }
    const options = {
      background: '#fff'
    };
    html2canvas(element, options).then(canvas => {
      const dataSrc = canvas.toDataURL('image/png');
      if (this.isMounted_) {
        this.setState({imageSrc: dataSrc});
      }
    });
  };

  getImageFromGoogleChart = () => {
    const container = document.getElementById('googleChartContainer');
    const svgList = container && container.querySelectorAll('svg');
    const svg = svgList && svgList[0];
    if (!svg) {
      return;
    }
    svgToDataURI(svg, 'image/png', {renderer: 'native'}).then(imageURI => {
      if (this.isMounted_) {
        this.setState({imageSrc: imageURI});
      }
    });
  };

  getPngBlob = () => {
    const element = document.getElementById('snapshot');
    const options = {
      background: '#fff'
    };
    return html2canvas(element, options).then(canvas => {
      return new Promise(function(resolve, reject) {
        canvas.toBlob(function(blob) {
          resolve(blob);
        });
      });
    });
  };

  copy = () => {
    this.setState({isCopyPending: true});
    this.getPngBlob().then(pngBlob => {
      try {
        navigator.clipboard.write([
          new ClipboardItem({
            'image/png': pngBlob
          })
        ]);
        this.setState({isCopyPending: false});
      } catch (error) {
        console.error(error);
      }
    });
  };

  save = () => {
    this.setState({isSavePending: true});
    this.getPngBlob().then(pngBlob => {
      const download = document.createElement('a');
      download.href = URL.createObjectURL(pngBlob);
      download.download = 'image.png';
      download.click();
      this.setState({isSavePending: false});
    });
  };

  render() {
    return (
      <div>
        <button
          type="button"
          style={dataStyles.grayButton}
          onClick={this.handleOpen}
        >
          {msg.dataVisualizerViewSnapshot()}
        </button>
        <BaseDialog
          isOpen={this.state.isSnapshotOpen}
          handleClose={this.handleClose}
          fullWidth
          fullHeight
        >
          <div id="snapshot">
            <h1>{this.props.chartTitle}</h1>
            <img src={this.state.imageSrc} />
            <p>
              {msg.dataVisualizerSnapshotDescription({
                date: moment().format('YYYY/MM/DD'),
                table: this.props.tableName,
                project: this.props.projectName
              })}
            </p>
            <p>{this.props.selectedOptions}</p>
          </div>
          <PendingButton
            isPending={this.state.isCopyPending}
            onClick={this.copy}
            pendingText="Please Wait"
            style={dataStyles.blueButton}
            text="Copy"
          />
          <PendingButton
            isPending={this.state.isSavePending}
            onClick={this.save}
            pendingText="Please Wait"
            style={dataStyles.blueButton}
            text="Save"
          />
        </BaseDialog>
      </div>
    );
  }
}

export default connect(state => ({
  tableName: state.data.tableName || '',
  projectName: state.header.projectName || ''
}))(Snapshot);
