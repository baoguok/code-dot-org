var React = require('react');
var ReactDOM = require('react-dom');
var utils = require('./utils');
var ShareWarningsDialog = require('./templates/ShareWarningsDialog');

function hasSeenDataAlert(channelId) {
  var dataAlerts = localStorage.getItem('dataAlerts');
  if (!dataAlerts) {
    return false;
  }
  var channelIds = JSON.parse(dataAlerts);
  return channelIds.indexOf(channelId) !== -1;
}

function markSeenDataAlert(channelId) {
  var dataAlerts = localStorage.getItem('dataAlerts');
  if (!dataAlerts) {
    dataAlerts = '[]';
  }
  var channelIds = JSON.parse(dataAlerts);
  channelIds.push(channelId);
  localStorage.setItem('dataAlerts', JSON.stringify(channelIds));
}

/**
 * Handle completion of the warning dialog
 *
 * @param {!boolean} showedStoreDataAlert - was the data store alert shown.
 * @param {!Object} options
 * @param {!string} options.channelId - service side channel.
 * @param {!boolean} options.isSignedIn - login state of current user.
 * @param {function} options.onWarningsComplete - Callback will be called after
 *        the modal warnings is dismissed. Will also be called if the modal
 *        warning is deemed to not be necessary.
 */
function onCloseShareWarnings(showedStoreDataAlert, options) {
  // we closed the dialog without hitting too_young
  // Only want to ask about age once across apps
  if (!options.isSignedIn) {
    utils.trySetLocalStorage('is13Plus', 'true');
  }
  // Only want to ask about storing data once per app.
  if (showedStoreDataAlert) {
    markSeenDataAlert(options.channelId);
  }
  if (options.onWarningsComplete) {
    options.onWarningsComplete();
  }
}

/**
 * When necessary, show a modal warning about data sharing (if appropriate) and
 * determining if the user is old enough.
 *
 * @param {!Object} options
 * @param {!string} options.channelId - service side channel.
 * @param {!boolean} options.isSignedIn - login state of current user.
 * @param {function} options.hasDataAPIs - Function to call to determine if
 *        the current program uses any data APIs.
 * @param {function} options.onWarningsComplete - Callback will be called after
 *        the modal warnings is dismissed. Will also be called if the modal
 *        warning is deemed to not be necessary.
 * @param {function} options.onTooYoung - Callback will be called if the user
 *        is deemed to be too young. If not specified, the page will be
 *        redirected to /too_young
 */
exports.checkSharedAppWarnings = function (options) {
  const hasDataAPIs = options.hasDataAPIs && options.hasDataAPIs();
  const promptForAge = hasDataAPIs && !options.isSignedIn && localStorage.getItem('is13Plus') !== "true";
  const showStoreDataAlert = hasDataAPIs && !hasSeenDataAlert(options.channelId);

  const handleShareWarningsTooYoung = () => {
    utils.trySetLocalStorage('is13Plus', 'false');
    if (options.onTooYoung) {
      options.onTooYoung();
    } else if (!IN_UNIT_TEST) {
      window.location.href = '/too_young';
    }
  };

  const handleClose = () => onCloseShareWarnings(showStoreDataAlert, options);

  return ReactDOM.render(
    <ShareWarningsDialog
      showStoreDataAlert={!!showStoreDataAlert}
      promptForAge={!!promptForAge}
      handleClose={handleClose}
      handleTooYoung={handleShareWarningsTooYoung}
    />,
    document.body.appendChild(document.createElement('div'))
  );
};
