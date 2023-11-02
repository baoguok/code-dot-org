import AITutorPanel from '@cdo/apps/code-studio/components/aiTutor/aiTutorPanel';
import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import {getStore} from '@cdo/apps/redux';

$(document).ready(initPage);

function initPage() {
  const script = document.querySelector('script[data-aitutorpanel]');
  const aiTutorPanelData = JSON.parse(script.dataset.aitutorpanel);
  const shouldRenderAITutorPanel =
    aiTutorPanelData.has_ai_tutor_access && aiTutorPanelData.is_csa;
  if (shouldRenderAITutorPanel) {
    renderAITutorPanel(aiTutorPanelData.level_type);
  }
}

function renderAITutorPanel(levelType) {
  const div = document.createElement('div');
  div.setAttribute('id', 'ai-tutor-panel-container');
  const store = getStore();

  ReactDOM.render(
    <Provider store={store}>
      <AITutorPanel levelType={levelType} />
    </Provider>,
    div
  );
  document.body.appendChild(div);
}
