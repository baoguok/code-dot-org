/** @file Top-level view for Fish */
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import _ from 'lodash';
//import GoogleBlockly from 'blockly/core';
import FontAwesome from '../templates/FontAwesome';
import {InitSound, GetCurrentAudioTime, PlaySound, StopSound} from './sound';
import CustomMarshalingInterpreter from '../lib/tools/jsinterpreter/CustomMarshalingInterpreter';
import {parseElement as parseXmlElement} from '../xml';

const songData = {
  events: [
    /*
    {
      type: 'play',
      id: 'baddie-seen',
      when: 0
    },
    {
      type: 'play',
      id: 'baddie-seen',
      when: 1
    },
    {
      type: 'play',
      id: 'baddie-seen',
      when: 3
    }*/
  ]
};

const barWidth = 60;

const secondsPerMeasure = 4;

var hooks = {};

class MusicView extends React.Component {
  static propTypes = {
    isProjectLevel: PropTypes.bool.isRequired,
    isReadOnlyWorkspace: PropTypes.bool.isRequired,
    onMount: PropTypes.func.isRequired
  };

  api = {
    play_sound: (id, measure) => {
      console.log('play sound', id, measure);

      // The user should see measures as 1-based, but
      // internally, we'll treat them as 0-based.
      songData.events.push({
        type: 'play',
        id: id,
        when: measure - 1
      });
    },
    play_sound_next_measure: id => {
      console.log('play sound next measure', id);

      // work out the next measure by rounding time up.
      const currentMeasure = this.convertSecondsToMeasure(
        GetCurrentAudioTime() - this.state.startPlayingAudioTime
      );
      const nextMeasure = currentMeasure + 1;
      const nextMeasureStartTime =
        this.state.startPlayingAudioTime +
        this.convertMeasureToSeconds(nextMeasure);

      // The user should see measures as 1-based, but
      // internally, we'll treat them as 0-based.
      songData.events.push({
        type: 'play',
        id: id,
        when: nextMeasure
      });

      // ideally our music player will use the above data structure as the source
      // of truth, but since the current implementation has already told WebAudio
      // about all known sounds to play, let's tee up this one here.
      const fullSoundId = 'stem-' + this.state.samplePanel + '-' + id;
      PlaySound(fullSoundId, '', nextMeasureStartTime);
    }
  };

  callUserGeneratedCode = fn => {
    try {
      fn.call(MusicView, this.api);
    } catch (e) {
      // swallow error. should we also log this somewhere?
      if (console) {
        console.log(e);
      }
    }
  };

  constructor(props) {
    super(props);

    this.codeAppRef = document.getElementById('codeApp');

    // We have seen on Android devices that window.innerHeight will always be the
    // same whether in landscape or portrait orientation.  Given that we tell
    // users to rotate to landscape, adjust to match what we see on iOS devices.
    const windowWidth = Math.max(window.innerWidth, window.innerHeight);
    const windowHeight = Math.min(window.innerWidth, window.innerHeight);

    // Set these values so that the first render can work with them.
    // Note that appWidth/Height are the dimensions of the "codeApp" div
    // which is the space allocated for an app.
    this.state = {
      windowWidth,
      windowHeight,
      appWidth: this.codeAppRef.offsetWidth,
      appHeight: this.codeAppRef.offsetHeight
    };
  }

  componentDidMount() {
    this.props.onMount();

    const windowWidth = Math.max(window.innerWidth, window.innerHeight);
    const windowHeight = Math.min(window.innerWidth, window.innerHeight);

    this.setState({
      windowWidth,
      windowHeight,
      appWidth: this.codeAppRef.offsetWidth,
      appHeight: this.codeAppRef.offsetHeight,
      currentPanel: 'samplepacks',
      samplePanel: 'main',
      isPlaying: false,
      startPlayingAudioTime: null,
      currentAudioTime: null,
      updateNumber: 0
    });

    const resizeThrottleWaitTime = 100;
    this.resizeListener = _.throttle(this.onResize, resizeThrottleWaitTime);
    window.addEventListener('resize', this.resizeListener);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.resizeListener);
      window.visualViewport.addEventListener('scroll', this.resizeListener);
    }

    this.initBlockly();

    InitSound();

    setInterval(this.updateTimer, 1000 / 30);
  }

  componentDidUpdate() {
    this.resizeBlockly();
  }

  updateTimer = () => {
    if (this.state.isPlaying) {
      this.setState({currentAudioTime: GetCurrentAudioTime()});
    }
  };

  initBlockly = () => {
    var toolbox = {
      kind: 'flyoutToolbox',
      contents: [
        {
          kind: 'block',
          type: 'play_sound'
        },
        {
          kind: 'block',
          type: 'play_sound_next_measure'
        }
      ]
    };

    Blockly.Blocks['play_sound'] = {
      init: function() {
        this.jsonInit({
          type: 'play_sound',
          message0: '%1 play %2 at measure %3',
          args0: [
            {
              type: 'field_image',
              src: 'https://code.org/shared/images/play-button.png',
              width: 15,
              height: 20,
              alt: '*',
              flipRtl: false
            },
            {
              type: 'field_dropdown',
              name: 'sound',
              options: [['lead', 'lead'], ['bass', 'bass'], ['drum', 'drum']]
            },
            {
              type: 'field_number',
              name: 'measure',
              value: 1,
              min: 1
            }
          ],
          inputsInline: true,
          previousStatement: null,
          nextStatement: null,
          colour: 230,
          tooltip: 'play sound',
          helpUrl: ''
        });
      }
    };

    Blockly.Blocks['play_sound_next_measure'] = {
      init: function() {
        this.jsonInit({
          type: 'play_sound_next_measure',
          message0: '%1 play %2 at next measure',
          args0: [
            {
              type: 'field_image',
              src: 'https://code.org/shared/images/play-button.png',
              width: 15,
              height: 20,
              alt: '*',
              flipRtl: false
            },
            {
              type: 'field_dropdown',
              name: 'sound',
              options: [['lead', 'lead'], ['bass', 'bass'], ['drum', 'drum']]
            }
          ],
          inputsInline: true,
          previousStatement: null,
          nextStatement: null,
          colour: 230,
          tooltip: 'play sound at next measure',
          helpUrl: ''
        });
      }
    };

    Blockly.Blocks['when_run'] = {
      init: function() {
        this.jsonInit({
          type: 'when_run',
          message0: 'when run',
          inputsInline: true,
          nextStatement: null,
          colour: 230,
          tooltip: 'when run',
          helpUrl: ''
        });
      }
    };

    Blockly.Blocks['when_trigger'] = {
      init: function() {
        this.jsonInit({
          type: 'when_trigger',
          message0: 'when trigger',
          inputsInline: true,
          nextStatement: null,
          colour: 230,
          tooltip: 'when triger',
          helpUrl: ''
        });
      }
    };

    Blockly.JavaScript.when_run = function() {
      // Generate JavaScript for handling click event.
      return '\n';
    };

    Blockly.JavaScript.when_trigger = function() {
      // Generate JavaScript for handling click event.
      return '\n';
    };

    Blockly.JavaScript.play_sound = function(ctx) {
      return (
        'Music.play_sound("' +
        ctx.getFieldValue('sound') +
        '", ' +
        ctx.getFieldValue('measure') +
        ');\n'
      );
    };

    /*var theme = Blockly.Theme.defineTheme('dark', {
      'base': Blockly.Themes.Classic,
      'componentStyles': {
        'workspaceBackgroundColour': '#222'
      },*/

    Blockly.JavaScript.play_sound_next_measure = function(ctx) {
      return (
        'Music.play_sound_next_measure("' + ctx.getFieldValue('sound') + '");\n'
      );
    };

    const container = document.getElementById('blocklyDiv');

    this.workspace = Blockly.inject(container, {
      toolbox: toolbox,
      horizontalLayout: true,
      grid: {spacing: 20, length: 0, colour: '#444', snap: true}
      //theme: {componentStyles: {workspaceBackgroundColour: '#222'}}
    });

    this.resizeBlockly();

    const xml = parseXmlElement(
      '<xml><block type="when_run" deletable="false" x="30" y="30"></block><block type="when_trigger" deletable="false" x="30" y="170"></block></xml>'
    );
    Blockly.Xml.domToBlockSpace(Blockly.mainBlockSpace, xml);

    Blockly.addChangeListener(Blockly.mainBlockSpace, this.onBlockSpaceChange);
  };

  onBlockSpaceChange = () => {
    console.log('onBlockSpaceChange');

    this.executeSong();

    this.setState({updateNumber: this.state.updateNumber + 1});
  };

  onResize = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    //const windowWidth = Math.max(window.innerWidth, window.innerHeight);
    //const windowHeight = Math.min(window.innerWidth, window.innerHeight);

    // Check that the window dimensions have actually changed to avoid
    // unnecessary event-processing on iOS Safari.
    if (
      this.state.windowWidth !== windowWidth ||
      this.state.windowHeight !== windowHeight
    ) {
      const appWidth = this.codeAppRef.offsetWidth;
      const appHeight = this.codeAppRef.offsetHeight;

      this.setState({windowWidth, windowHeight, appWidth, appHeight});
    }

    //this.resizeBlockly();
  };

  resizeBlockly = () => {
    var blocklyArea = document.getElementById('blocklyArea');
    var blocklyDiv = document.getElementById('blocklyDiv');

    // Compute the absolute coordinates and dimensions of blocklyArea.
    /*
    var element = blocklyArea;
    var x = 0;
    var y = 0;
    do {
      x += element.offsetLeft;
      y += element.offsetTop;
      element = element.offsetParent;
    } while (element);
    // Position blocklyDiv over blocklyArea.
    blocklyDiv.style.left = x + 'px';
    blocklyDiv.style.top = y + 'px';
    */
    blocklyDiv.style.width = blocklyArea.offsetWidth + 'px';
    blocklyDiv.style.height = blocklyArea.offsetHeight + 'px';
    Blockly.svgResize(this.workspace);
  };

  convertMeasureToSeconds = measure => {
    return measure * secondsPerMeasure;
  };

  convertSecondsToMeasure = seconds => {
    return Math.floor(seconds / secondsPerMeasure);
  };

  choosePanel = panel => {
    this.setState({currentPanel: panel});

    if (panel === 'timeline') {
      this.playSong();
    }

    this.resizeBlockly();
  };

  setSamplePanel = panel => {
    this.setState({samplePanel: panel});
  };

  playTrigger = () => {
    this.callUserGeneratedCode(hooks.whenTriggerButton);
  };

  executeSong = () => {
    var generator = Blockly.Generator.blockSpaceToCode.bind(
      Blockly.Generator,
      'JavaScript'
    );

    const events = {
      whenRunButton: {code: generator('when_run')},
      whenTriggerButton: {code: generator('when_trigger')}
    };

    CustomMarshalingInterpreter.evalWithEvents(
      {Music: this.api},
      events
    ).hooks.forEach(hook => {
      console.log('hook', hook);
      hooks[hook.name] = hook.func;
    });

    songData.events = [];

    this.callUserGeneratedCode(hooks.whenRunButton);
  };

  playSong = () => {
    StopSound('mainaudio');

    this.executeSong();

    const currentAudioTime = GetCurrentAudioTime();

    for (const songEvent of songData.events) {
      if (songEvent.type === 'play') {
        PlaySound(
          'stem-' + this.state.samplePanel + '-' + songEvent.id,
          'mainaudio',
          currentAudioTime + this.convertMeasureToSeconds(songEvent.when)
        );
      }
    }

    this.setState({isPlaying: true, startPlayingAudioTime: currentAudioTime});
  };

  previewSound = id => {
    StopSound('mainaudio');

    PlaySound('stem-' + this.state.samplePanel + '-' + id, 'mainaudio', 0);
  };

  render() {
    // The tutorial has a width:height ratio of 16:9.
    const aspectRatio = 16 / 9;

    // Let's minimize the tutorial width at 320px.
    const minAppWidth = 320;

    // Let's maximize the tutorial width at 1280px.
    const maxAppWidth = 1280;

    // Leave space above the small footer.
    const reduceAppHeight = 36;

    let containerWidth;

    // Constrain tutorial to maximum width.
    const maxContainerWidth = Math.min(this.state.appWidth, maxAppWidth);

    // Use the smaller of the space allocated for the app and the window height,
    // and leave space above the small footer.
    const maxContainerHeight =
      Math.min(this.state.appHeight, this.state.windowHeight) - reduceAppHeight;

    if (maxContainerWidth / maxContainerHeight > aspectRatio) {
      // Constrain by height.
      containerWidth = maxContainerHeight * aspectRatio;
    } else {
      // Constrain by width.
      containerWidth = maxContainerWidth;
    }

    // Constrain tutorial to minimum width;
    if (containerWidth < minAppWidth) {
      containerWidth = minAppWidth;
    }

    const filenameToImgUrl = {
      samplepack1: require('@cdo/static/music/samplepack1.png'),
      samplepack2: require('@cdo/static/music/samplepack2.png'),
      samplepack3: require('@cdo/static/music/samplepack3.png'),
      samplepack4: require('@cdo/static/music/samplepack4.png'),
      samplepack5: require('@cdo/static/music/samplepack5.png'),
      samplepack6: require('@cdo/static/music/samplepack6.png'),
      samplepack7: require('@cdo/static/music/samplepack7.png'),
      waveform_lead: require('@cdo/static/music/waveform-lead.png'),
      waveform_bass: require('@cdo/static/music/waveform-bass.png'),
      waveform_drum: require('@cdo/static/music/waveform-drum.png')
    };

    const mobileWidth = 601;
    const isDesktop = this.state.windowWidth >= mobileWidth;

    const showSamplePacks =
      isDesktop || this.state.currentPanel === 'samplepacks';
    const showCode = isDesktop || this.state.currentPanel === 'code';
    const showTimeline = isDesktop || this.state.currentPanel === 'timeline';

    const currentPanel = this.state.currentPanel;

    const playHeadOffset = this.state.isPlaying
      ? ((this.state.currentAudioTime - this.state.startPlayingAudioTime) *
          barWidth) /
        this.convertMeasureToSeconds(1)
      : null;

    return (
      <div
        style={{
          position: 'relative',
          backgroundColor: 'black',
          color: 'white',
          width: '100%',
          height: 'calc(100% - 50px)',
          borderRadius: 4,
          padding: 0,
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}
      >
        {showTimeline && (
          <div
            style={{
              backgroundColor: '#222',
              height: 100,
              width: '100%',
              borderRadius: 4,
              padding: 10,
              boxSizing: 'border-box'
            }}
          >
            <div style={{float: 'left'}}>
              Timeline
              <br />
              <br />
            </div>
            {this.state.isPlaying && (
              <div style={{float: 'right'}}>
                <button
                  type="button"
                  onClick={() => this.playTrigger()}
                  style={{padding: 2, fontSize: 10, margin: 0}}
                >
                  trigger
                </button>
              </div>
            )}
            <div
              style={{
                width: '100%',
                overflow: 'scroll',
                height: 50,
                position: 'relative'
              }}
            >
              <div style={{width: 900}}>
                {songData.events.map((eventData, index) => {
                  return (
                    <div
                      key={index}
                      style={{
                        width: barWidth,
                        borderLeft: '1px white solid',
                        position: 'absolute',
                        left: barWidth * eventData.when
                      }}
                    >
                      <img
                        src={filenameToImgUrl['waveform_' + eventData.id]}
                        style={{width: 90, paddingRight: 20}}
                      />
                    </div>
                  );
                })}
              </div>

              <div style={{width: 900, position: 'absolute', top: 0, left: 0}}>
                {playHeadOffset !== null && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: playHeadOffset,
                      width: 1,
                      height: 40,
                      borderLeft: '3px yellow solid'
                    }}
                  >
                    &nbsp;
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {showSamplePacks && (
          <div
            style={{
              backgroundColor: '#222',
              float: 'left',
              width: isDesktop ? 'calc(40% - 10px)' : '100%',
              height: 'calc(100% - 110px)',
              borderRadius: 4,
              marginTop: 10,
              padding: 10,
              boxSizing: 'border-box',
              marginRight: isDesktop ? 10 : 0
            }}
          >
            {this.state.samplePanel === 'main' && (
              <div>
                <div>Sample packs</div>
                <br />
                <div
                  style={{cursor: 'pointer', paddingBottom: 10}}
                  onClick={() => this.setSamplePanel('hip')}
                >
                  <img
                    src={filenameToImgUrl['samplepack1']}
                    style={{width: 60, paddingRight: 20}}
                  />
                  hip hop
                </div>
                <div
                  style={{cursor: 'pointer', paddingBottom: 10}}
                  onClick={() => this.setSamplePanel('dance')}
                >
                  <img
                    src={filenameToImgUrl['samplepack2']}
                    style={{width: 60, paddingRight: 20}}
                  />
                  dance
                </div>
                <div style={{paddingBottom: 10}}>
                  <img
                    src={filenameToImgUrl['samplepack3']}
                    style={{width: 60, paddingRight: 20}}
                  />
                  electronic
                </div>
                <div
                  style={{cursor: 'pointer', paddingBottom: 10}}
                  onClick={() => this.setSamplePanel('country')}
                >
                  <img
                    src={filenameToImgUrl['samplepack4']}
                    style={{width: 60, paddingRight: 20}}
                  />
                  country
                </div>
                <div style={{paddingBottom: 10}}>
                  <img
                    src={filenameToImgUrl['samplepack5']}
                    style={{width: 60, paddingRight: 20}}
                  />
                  hip hop
                </div>
                <div style={{paddingBottom: 10}}>
                  <img
                    src={filenameToImgUrl['samplepack6']}
                    style={{width: 60, paddingRight: 20}}
                  />
                  r &amp; b
                </div>
                <div style={{paddingBottom: 10}}>
                  <img
                    src={filenameToImgUrl['samplepack7']}
                    style={{width: 60, paddingRight: 20}}
                  />
                  rock
                </div>
              </div>
            )}
            {this.state.samplePanel !== 'main' && (
              <div>
                <div
                  style={{cursor: 'pointer'}}
                  onClick={() => this.setSamplePanel('main')}
                >
                  &lt; Back
                </div>
                <br />
                <div>{this.state.samplePanel} sample pack</div>
                <br />
                <div>
                  <img
                    src={
                      this.state.samplePanel === 'hip'
                        ? filenameToImgUrl['samplepack1']
                        : filenameToImgUrl['samplepack2']
                    }
                    style={{width: '70%'}}
                  />
                </div>
                <div>
                  <img
                    src={filenameToImgUrl['waveform_lead']}
                    style={{width: 90, paddingRight: 20, cursor: 'pointer'}}
                    onClick={() => this.previewSound('lead')}
                  />
                  Lead
                </div>
                <div>
                  <img
                    src={filenameToImgUrl['waveform_bass']}
                    style={{width: 90, paddingRight: 20, cursor: 'pointer'}}
                    onClick={() => this.previewSound('bass')}
                  />
                  Bass
                </div>
                <div>
                  <img
                    src={filenameToImgUrl['waveform_drum']}
                    style={{width: 90, paddingRight: 20, cursor: 'pointer'}}
                    onClick={() => this.previewSound('drum')}
                  />
                  Drum
                </div>
              </div>
            )}
          </div>
        )}
        <div
          id="blocklyArea"
          style={{
            float: 'left',
            width: isDesktop ? '60%' : '100%',
            marginTop: 10,
            height: showCode ? 'calc(100% - 110px)' : 0
          }}
        >
          <div id="blocklyDiv" style={{position: 'absolute'}} />
        </div>
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            backgroundColor: '#222',
            height: 50,
            left: 10,
            right: 10,
            borderRadius: 4,
            marginTop: 10,
            justifyContent: 'space-evenly',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              textAlign: 'center',
              cursor: 'pointer',
              color:
                isDesktop || currentPanel === 'samplepacks' ? 'white' : '#777'
            }}
            onClick={() => this.choosePanel('samplepacks')}
          >
            <FontAwesome icon="book" style={{fontSize: 25}} />
            <div style={{fontSize: 8}}>Sample packs</div>
          </div>
          <div
            style={{
              textAlign: 'center',
              cursor: 'pointer',
              color: isDesktop || currentPanel === 'code' ? 'white' : '#777'
            }}
            onClick={() => this.choosePanel('code')}
          >
            <FontAwesome icon="music" style={{fontSize: 25}} />
            <div style={{fontSize: 8}}>Code song</div>
          </div>
          <div
            style={{
              textAlign: 'center',
              cursor: 'pointer',
              color: isDesktop || currentPanel === 'timeline' ? 'white' : '#777'
            }}
            onClick={() => this.choosePanel('timeline')}
          >
            <FontAwesome icon="play" style={{fontSize: 25}} />
            <div style={{fontSize: 8}}>Play song</div>
          </div>
          <div
            style={{
              textAlign: 'center',
              cursor: 'pointer',
              color: isDesktop || currentPanel === 'liveplay' ? 'white' : '#777'
            }}
            onClick={() => this.choosePanel('liveplay')}
          >
            <FontAwesome icon="th" style={{fontSize: 25}} />
            <div style={{fontSize: 8}}>Live play</div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(state => ({
  isProjectLevel: state.pageConstants.isProjectLevel,
  isReadOnlyWorkspace: state.pageConstants.isReadOnlyWorkspace
}))(MusicView);
