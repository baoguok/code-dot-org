import PropTypes from 'prop-types';
import React from 'react';
import color from '../util/color';

const styles = {
  count: {
    fontWeight: 'bold',
    fontSize: '400px',
    fill: color.white,
    stroke: color.black,
    strokeWidth: '30px',
    fontFamily: 'Verdana, Geneva, sans-serif'
  }
};

export default class Lightbulb extends React.Component {
  static propTypes = {
    shouldAnimate: PropTypes.bool,
    count: PropTypes.number,
    lit: PropTypes.bool,
    size: PropTypes.number,
    style: PropTypes.object,
    isMinecraft: PropTypes.bool
  };

  static defaultProps = {
    shouldAnimate: false,
    count: 0,
    lit: true,
    size: 40,
    style: {}
  };

  render() {
    let bulbDisplay;

    if (this.props.isMinecraft) {
      const href = this.props.lit
        ? 'iVBORw0KGgoAAAANSUhEUgAAAAsAAAAOCAYAAAD5YeaVAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA' +
          'IGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAACzSURBVHjalJExDsIw' +
          'DEW/GzbYG4m5A505BzuH6cQpEGdg6TlYWLp0rpSOiHZrZIaGCsfNwJcsR8mT/fVDkGJokToAYNdV' +
          'yO1ZkqZcuEyA+RHgFsgOc3EL9s2ykQT4K3Oau68BKkCmxAYp+VpdZfhDCh7GSfS1WITvYZyw2waH' +
          'wS8A+k4mu7+g7x/RqEJEF4tdV/H7dWf2DcefpNK43gjAM5SUgq21yTQU7JxLwmvGOfX+GQDlKDxF' +
          'gn7+bgAAAABJRU5ErkJggg=='
        : 'iVBORw0KGgoAAAANSUhEUgAAAAsAAAAOCAYAAAD5YeaVAAAABmJLR0QA/wD/AP+gvaeTAAAACXBI' +
          'WXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AsRFQUQP8g1cwAAAKpJREFUKM+VkbENxCAMRR+nK1JH' +
          'AmWCZIVMkWHZAyktmSCioKbzVRfBGYr7jRF+sj8fQytBy6gDIN579n1vSOfcw71qcF1Xcs5Ya7HW' +
          'knMmpfRsNDVYa9s2AGKMzPOMc443A8UY1d2LP6TgUkpTe7E0vkspTNME8PgFzHeyOY6D67qaSTXY' +
          'syXeeznPU1JK8vtJKo0QAiGE7gMVvCzLMA0F3/c9hHvGZdT/APfyQc3umPvfAAAAAElFTkSuQmCC';

      bulbDisplay = (
        <g className={this.props.shouldAnimate ? 'animate-hint' : ''}>
          <image
            width="450"
            height="450"
            x="80"
            y="140"
            className="pixelated"
            xlinkHref={'data:image/png;base64,' + href}
          />
        </g>
      );
    } else {
      const lines = this.props.lit
        ? [
            <g key="line-0">
              <line
                fill="#EFB834"
                x1="473.582"
                y1="208.1"
                x2="560.578"
                y2="159.16"
              />
              <path
                fill="#EFB834"
                d="M473.141,207.315c0,0,1.225-1.003,3.396-2.711c1.08-0.864,2.402-1.894,3.925-3.063
            c1.525-1.167,3.227-2.514,5.117-3.927c1.887-1.418,3.931-2.954,6.092-4.578c2.158-1.632,4.462-3.3,6.831-5.055
            c2.386-1.723,4.843-3.519,7.372-5.285c2.515-1.791,5.104-3.552,7.677-5.341c2.578-1.778,5.065-3.721,7.503-5.648
            c1.228-0.948,2.436-1.907,3.665-2.792c1.231-0.881,2.478-1.695,3.736-2.442c2.527-1.472,5.12-2.629,7.656-3.587
            c2.529-0.971,4.998-1.751,7.331-2.377c4.655-1.268,8.797-1.858,11.81-2.069c1.504-0.109,2.718-0.138,3.572-0.111
            c0.843,0.007,1.313,0.047,1.313,0.047l0.883,1.569c0,0-0.21,0.422-0.641,1.146c-0.42,0.744-1.075,1.766-1.95,2.995
            c-1.745,2.465-4.4,5.698-7.9,9.019c-1.746,1.669-3.694,3.374-5.838,5.031c-2.136,1.671-4.471,3.285-7.041,4.681
            c-1.291,0.687-2.635,1.331-4.027,1.925c-1.394,0.591-2.841,1.126-4.289,1.683c-2.914,1.083-5.865,2.2-8.723,3.48
            c-2.865,1.27-5.713,2.568-8.55,3.788c-2.823,1.245-5.633,2.412-8.345,3.556c-2.729,1.113-5.352,2.217-7.867,3.213
            c-2.511,1.004-4.885,1.953-7.076,2.83c-2.189,0.881-4.224,1.637-6.013,2.334c-1.79,0.695-3.357,1.29-4.656,1.764
            c-2.587,0.968-4.08,1.494-4.08,1.494L473.141,207.315z"
              />
            </g>,
            <g key="line-1">
              <line
                fill="#EFB834"
                x1="492.348"
                y1="410.008"
                x2="589.509"
                y2="432.883"
              />
              <path
                fill="#EFB834"
                d="M492.555,409.132c0,0,1.581,0.091,4.335,0.303c1.38,0.095,3.05,0.232,4.962,0.403
            c1.912,0.173,4.077,0.334,6.424,0.574c2.348,0.234,4.892,0.487,7.583,0.755c2.693,0.259,5.519,0.592,8.45,0.904
            c2.923,0.347,5.947,0.688,9.004,1.101c3.064,0.384,6.161,0.841,9.266,1.266c3.102,0.437,6.247,0.691,9.346,0.922
            c1.546,0.133,3.084,0.246,4.588,0.426c1.502,0.185,2.972,0.43,4.403,0.732c2.857,0.628,5.548,1.531,8.064,2.543
            c2.519,0.998,4.864,2.095,7.004,3.213c4.285,2.219,7.732,4.588,10.093,6.472c1.181,0.938,2.094,1.738,2.704,2.337
            c0.615,0.576,0.934,0.923,0.934,0.923l-0.412,1.752c0,0-0.44,0.169-1.248,0.41c-0.813,0.263-1.987,0.572-3.463,0.885
            c-2.953,0.633-7.096,1.216-11.92,1.29c-2.414,0.046-5.003-0.018-7.702-0.249c-2.703-0.216-5.515-0.609-8.351-1.322
            c-1.415-0.368-2.84-0.804-4.267-1.309c-1.426-0.509-2.853-1.095-4.296-1.665c-2.878-1.176-5.805-2.351-8.776-3.344
            c-2.968-1.004-5.944-1.977-8.857-3c-2.92-0.995-5.779-2.038-8.549-3.032c-2.762-1.029-5.44-1.992-7.965-2.961
            c-2.528-0.961-4.918-1.869-7.124-2.708c-2.207-0.833-4.217-1.655-6.005-2.353c-1.788-0.7-3.344-1.323-4.621-1.854
            c-2.559-1.039-4.015-1.663-4.015-1.663L492.555,409.132z"
              />
            </g>,
            <g key="line-2">
              <line
                fill="#EFB834"
                x1="502.559"
                y1="301.7"
                x2="602.37"
                y2="300.685"
              />
              <path
                fill="#EFB834"
                d="M502.55,300.8c0,0,1.557-0.289,4.282-0.742c1.362-0.237,3.017-0.504,4.915-0.795
            c1.898-0.289,4.039-0.65,6.375-0.979c2.336-0.334,4.867-0.697,7.544-1.08c2.677-0.392,5.5-0.744,8.421-1.142
            c2.921-0.362,5.939-0.753,9.006-1.084c3.067-0.359,6.183-0.656,9.3-0.985c3.116-0.317,6.23-0.823,9.296-1.339
            c1.533-0.24,3.053-0.499,4.556-0.683c1.503-0.18,2.989-0.293,4.45-0.342c2.924-0.073,5.753,0.16,8.438,0.542
            c2.685,0.366,5.224,0.871,7.57,1.446c4.691,1.13,8.605,2.607,11.347,3.872c1.371,0.629,2.449,1.187,3.185,1.622
            c0.735,0.412,1.128,0.673,1.128,0.673l0.018,1.8c0,0-0.387,0.269-1.114,0.696c-0.727,0.45-1.793,1.031-3.151,1.687
            c-2.716,1.321-6.6,2.877-11.266,4.102c-2.333,0.622-4.862,1.179-7.539,1.599c-2.676,0.436-5.5,0.727-8.425,0.713
            c-1.462-0.019-2.95-0.102-4.456-0.251c-1.506-0.153-3.032-0.381-4.569-0.59c-3.075-0.454-6.199-0.895-9.321-1.149
            c-3.122-0.266-6.244-0.499-9.318-0.796c-3.073-0.268-6.099-0.598-9.026-0.9c-2.928-0.338-5.758-0.634-8.442-0.971
            c-2.684-0.329-5.222-0.639-7.564-0.926c-2.342-0.281-4.49-0.599-6.394-0.849c-1.903-0.253-3.563-0.486-4.93-0.695
            c-2.734-0.397-4.296-0.655-4.296-0.655L502.55,300.8z"
              />
            </g>,
            <g key="line-3">
              <line
                fill="#EFB834"
                x1="135.661"
                y1="212.764"
                x2="48.665"
                y2="163.824"
              />
              <path
                fill="#EFB834"
                d="M135.22,213.548c0,0-1.493-0.526-4.08-1.494c-1.299-0.474-2.866-1.069-4.656-1.764
            c-1.789-0.697-3.824-1.453-6.013-2.334c-2.191-0.876-4.565-1.826-7.076-2.83c-2.515-0.996-5.138-2.1-7.867-3.213
            c-2.712-1.144-5.522-2.312-8.345-3.556c-2.837-1.22-5.686-2.518-8.55-3.788c-2.859-1.28-5.81-2.397-8.723-3.48
            c-1.448-0.557-2.895-1.092-4.289-1.683c-1.392-0.594-2.736-1.238-4.027-1.925c-2.57-1.396-4.905-3.01-7.041-4.681
            c-2.143-1.657-4.092-3.363-5.838-5.031c-3.5-3.32-6.155-6.554-7.9-9.019c-0.874-1.229-1.53-2.251-1.95-2.995
            c-0.431-0.724-0.641-1.146-0.641-1.146l0.883-1.569c0,0,0.47-0.04,1.313-0.047c0.854-0.027,2.068,0.002,3.572,0.111
            c3.013,0.211,7.155,0.801,11.81,2.069c2.332,0.625,4.801,1.406,7.331,2.377c2.537,0.958,5.129,2.115,7.656,3.587
            c1.258,0.746,2.505,1.561,3.736,2.442c1.229,0.885,2.437,1.844,3.665,2.792c2.438,1.928,4.925,3.87,7.503,5.648
            c2.573,1.789,5.161,3.549,7.677,5.341c2.529,1.766,4.986,3.562,7.372,5.285c2.368,1.755,4.673,3.423,6.831,5.055
            c2.162,1.625,4.206,3.16,6.092,4.578c1.889,1.413,3.592,2.76,5.117,3.927c1.523,1.169,2.845,2.199,3.925,3.063
            c2.17,1.708,3.396,2.711,3.396,2.711L135.22,213.548z"
              />
            </g>,
            <g key="line-4">
              <line
                fill="#EFB834"
                x1="120.895"
                y1="411.672"
                x2="23.734"
                y2="434.547"
              />
              <path
                fill="#EFB834"
                d="M121.101,412.548c0,0-1.456,0.623-4.015,1.663c-1.277,0.53-2.833,1.153-4.621,1.854
            c-1.788,0.698-3.798,1.52-6.005,2.353c-2.206,0.838-4.596,1.747-7.124,2.708c-2.526,0.969-5.203,1.932-7.965,2.961
            c-2.77,0.993-5.629,2.037-8.549,3.032c-2.914,1.023-5.889,1.996-8.857,3c-2.971,0.993-5.899,2.169-8.776,3.344
            c-1.443,0.57-2.87,1.156-4.296,1.665c-1.427,0.505-2.852,0.941-4.267,1.309c-2.836,0.713-5.648,1.105-8.351,1.321
            c-2.699,0.231-5.288,0.295-7.702,0.249c-4.824-0.074-8.967-0.657-11.92-1.29c-1.476-0.313-2.65-0.621-3.463-0.885
            c-0.808-0.241-1.248-0.41-1.248-0.41l-0.413-1.752c0,0,0.319-0.347,0.934-0.923c0.61-0.598,1.523-1.399,2.704-2.337
            c2.36-1.884,5.808-4.254,10.093-6.472c2.14-1.119,4.485-2.216,7.004-3.213c2.516-1.012,5.207-1.915,8.064-2.543
            c1.431-0.302,2.9-0.547,4.403-0.732c1.503-0.181,3.042-0.293,4.588-0.426c3.1-0.232,6.245-0.486,9.346-0.922
            c3.104-0.425,6.201-0.882,9.265-1.266c3.057-0.412,6.081-0.754,9.004-1.101c2.931-0.312,5.757-0.644,8.45-0.904
            c2.691-0.268,5.235-0.521,7.583-0.755c2.347-0.239,4.512-0.4,6.424-0.574c1.913-0.171,3.583-0.308,4.962-0.403
            c2.754-0.212,4.335-0.303,4.335-0.303L121.101,412.548z"
              />
            </g>,
            <g key="line-5">
              <line
                fill="#EFB834"
                x1="112.684"
                y1="306.364"
                x2="12.873"
                y2="305.349"
              />
              <path
                fill="#EFB834"
                d="M112.675,307.264c0,0-1.562,0.257-4.296,0.655c-1.367,0.21-3.026,0.443-4.93,0.695
            c-1.904,0.25-4.051,0.568-6.394,0.849c-2.343,0.287-4.88,0.598-7.564,0.926c-2.684,0.337-5.514,0.633-8.442,0.971
            c-2.928,0.302-5.953,0.632-9.026,0.9c-3.074,0.297-6.195,0.53-9.318,0.796c-3.122,0.254-6.246,0.696-9.321,1.149
            c-1.537,0.209-3.063,0.437-4.569,0.59c-1.506,0.149-2.994,0.232-4.456,0.251c-2.925,0.014-5.749-0.277-8.425-0.713
            c-2.676-0.421-5.205-0.977-7.539-1.599c-4.667-1.225-8.55-2.781-11.266-4.102c-1.358-0.656-2.424-1.237-3.151-1.687
            c-0.727-0.427-1.114-0.696-1.114-0.696l0.018-1.8c0,0,0.393-0.261,1.128-0.673c0.736-0.435,1.814-0.994,3.185-1.622
            c2.742-1.265,6.657-2.742,11.347-3.872c2.345-0.575,4.885-1.079,7.57-1.446c2.685-0.382,5.514-0.615,8.438-0.542
            c1.462,0.049,2.947,0.162,4.45,0.342c1.503,0.184,3.024,0.443,4.556,0.683c3.065,0.516,6.18,1.021,9.296,1.339
            c3.116,0.329,6.232,0.626,9.299,0.985c3.067,0.33,6.085,0.722,9.006,1.084c2.92,0.398,5.744,0.75,8.421,1.142
            c2.677,0.383,5.208,0.745,7.544,1.08c2.336,0.329,4.477,0.69,6.375,0.979c1.898,0.291,3.552,0.558,4.915,0.795
            c2.725,0.453,4.282,0.742,4.282,0.742L112.675,307.264z"
              />
            </g>
          ]
        : [];

      bulbDisplay = (
        <g className={this.props.shouldAnimate ? 'animate-hint' : ''}>
          <path
            fill={this.props.lit ? '#EFB834' : '#C9C9C9'}
            d="M453.775,353.156c0,24.012-57.189,128.942-61.414,132.265c-12.384,9.741-48.514,15.318-82.869,16.518
          c-8.362,0.292-16.619,0.325-24.403,0.096c-20.716-0.611-38.081-3.079-45.155-7.464c-6.896-4.274-74.477-119.24-74.477-141.415
          c0-89.195,64.542-161.502,144.159-161.502S453.775,263.961,453.775,353.156z"
          />
          <g transform="matrix(1,0,0,-1,379.66102,1293.0169)">
            <path
              fill="#5D5D5D"
              d="M7.357,980.857c0-2.96-1.081-5.521-3.244-7.684
            s-4.724-3.244-7.684-3.244s-5.521,1.081-7.684,3.244s-3.244,4.724-3.244,7.684c0,10.473-6.147,18.556-18.442,24.248
            c-12.295,5.692-24.362,8.538-36.201,8.538c-2.96,0-5.521,1.081-7.684,3.244s-3.244,4.724-3.244,7.684
            c0,2.96,1.081,5.521,3.244,7.684s4.724,3.244,7.684,3.244c11.384,0,22.711-1.821,33.981-5.464s21.174-9.79,29.712-18.442
            S7.357,992.696,7.357,980.857z M62,980.857c0,16.393-3.927,31.647-11.782,45.763s-18.1,25.671-30.737,34.664
            s-26.638,16.051-42.007,21.174s-30.907,7.684-46.617,7.684s-31.249-2.561-46.617-7.684s-29.371-12.181-42.007-21.174
            c-12.636-8.993-22.882-20.548-30.737-34.664c-7.855-14.116-11.782-29.371-11.782-45.763c0-22.996,7.741-43.487,23.223-61.473
            c2.277-2.504,5.749-6.261,10.416-11.27c4.667-5.009,8.14-8.766,10.416-11.27c29.143-34.835,45.194-68.759,48.154-101.772h77.866
            c2.96,33.013,19.011,66.938,48.154,101.772c2.277,2.504,5.749,6.261,10.416,11.27s8.14,8.766,10.416,11.27
            C54.259,937.37,62,957.862,62,980.857z M105.714,980.857c0-35.29-11.725-65.799-35.176-91.527
            c-10.246-11.156-18.727-21.06-25.443-29.712s-13.49-19.523-20.32-32.615c-6.83-13.092-10.701-25.329-11.612-36.713
            c10.701-6.375,16.051-15.71,16.051-28.004c0-8.424-2.846-15.71-8.538-21.857c5.692-6.147,8.538-13.433,8.538-21.857
            c0-11.839-5.123-21.06-15.368-27.663c2.96-5.237,4.44-10.587,4.44-16.051c0-10.473-3.586-18.556-10.758-24.248
            s-15.994-8.538-26.468-8.538c-4.554-10.018-11.384-17.987-20.491-23.906c-9.107-5.92-19.011-8.879-29.712-8.879
            c-10.701,0-20.605,2.96-29.712,8.879c-9.107,5.92-15.938,13.888-20.491,23.906c-10.473,0-19.296,2.846-26.468,8.538
            s-10.758,13.775-10.758,24.248c0,5.464,1.48,10.815,4.44,16.051c-10.246,6.603-15.368,15.824-15.368,27.663
            c0,8.424,2.846,15.71,8.538,21.857c-5.692,6.147-8.538,13.433-8.538,21.857c0,12.295,5.35,21.629,16.051,28.004
            c-0.911,11.384-4.781,23.622-11.612,36.713c-6.83,13.091-13.604,23.963-20.32,32.615s-15.198,18.556-25.443,29.712
            C-232.275,915.058-244,945.567-244,980.857c0,22.54,5.066,43.544,15.198,63.01c10.132,19.467,23.451,35.632,39.958,48.496
            c16.507,12.864,35.176,22.995,56.009,30.395s42.064,11.099,63.693,11.099s42.86-3.7,63.693-11.099s39.502-17.531,56.009-30.395
            c16.507-12.864,29.826-29.029,39.958-48.496C100.648,1024.401,105.714,1003.397,105.714,980.857z"
            />
          </g>
          {lines}
        </g>
      );
    }

    let countDisplay;
    if (this.props.lit && this.props.count) {
      // If there are more than nine hints, simply display "9+"
      const countText = this.props.count > 9 ? '9+' : this.props.count;
      countDisplay = (
        <g>
          <text id="hintCount" x="400" y="700" style={styles.count}>
            {countText}
          </text>
        </g>
      );
    }

    return (
      <svg
        width={this.props.size}
        height={this.props.size}
        style={this.props.style}
        viewBox="0 0 612 792"
      >
        {bulbDisplay}
        {countDisplay}
      </svg>
    );
  }
}
