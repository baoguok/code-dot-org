/* global appOptions */

import $ from 'jquery';
import { getResult, registerGetResult } from '@cdo/apps/code-studio/levels/codeStudioLevels';
import { sendReport, getLastServerResponse } from '@cdo/apps/code-studio/reporting';
import { TestResults } from '@cdo/apps/constants';

$(document).ready(() => {
  registerGetResult();

  // make milestone post
  postMilestone();

  // handle click on continue, in particular think about what happens if we didnt
  // hear back
  $(".submitButton").click(onContinue);
});

function postMilestone() {
  // Because we registered the default getResult function, this will alwayas
  // just be { response: 'ok', result: true }
  const result = getResult();

  sendReport({
    program: result.response,
    fallbackResponse: appOptions.dialog.fallbackResponse,
    // TODO : what is this one used for?
    callback: appOptions.dialog.callback,
    // expect this to always be standalone_video here
    app: appOptions.dialog.app,
    level: appOptions.dialog.level,
    result: result.result,
    pass: true,
    testResult: TestResults.ALL_PASS
  });
}

function onContinue() {
  const lastServerResponse = getLastServerResponse();
  let url = lastServerResponse && lastServerResponse.nextRedirect;
  if (!url) {
    const fallback = JSON.parse(appOptions.dialog.fallbackResponse);
    url = fallback.success.redirect;
  }

  window.location.href = url;
}
