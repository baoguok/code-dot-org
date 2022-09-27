import React, {useState} from 'react';
import PropTypes from 'prop-types';
import RailsAuthenticityToken from '@cdo/apps/lib/util/RailsAuthenticityToken';
import HelpTip from '@cdo/apps/lib/ui/HelpTip';
import TextareaWithMarkdownPreview from '@cdo/apps/lib/levelbuilder/TextareaWithMarkdownPreview';
import {navigateToHref} from '@cdo/apps/utils';

const DataDocFormEditor = props => {
  const {dataDocKey, originalDataDocName, originalDataDocContent} = props;
  const [dataDocContent, setDataDocContent] = useState(originalDataDocContent);
  const [dataDocName, setDataDocName] = useState(originalDataDocName);

  const save = saveAndClose => {
    $.ajax({
      url: `/data_docs/${dataDocKey}`,
      method: 'PUT',
      data: {
        name: dataDocName,
        content: dataDocContent
      }
    }).done(() => {
      if (saveAndClose) {
        navigateToHref(`/data_docs/${dataDocKey}`);
      }
    });
  };

  return (
    <div>
      <RailsAuthenticityToken />
      <h1>Edit Data Doc</h1>
      <h2>
        This feature is in progress. It is not ready for use on Levelbuilder
        yet.
      </h2>
      <label style={styles.label}>
        Slug
        <input
          className="input"
          name="key"
          style={styles.input}
          value={dataDocKey}
          disabled
        />
        <HelpTip style={styles.helptip}>
          <p>
            The data doc slug is used in URLs and cannot be updated once set. A
            slug can only contain lowercase letters, numbers, and dashes, and
            'new' and 'edit' are reserved.
          </p>
        </HelpTip>
      </label>
      <label style={styles.label}>
        Name
        <input
          className="input"
          name="name"
          style={styles.input}
          value={dataDocName}
          onChange={e => setDataDocName(e.target.value)}
        />
      </label>
      <TextareaWithMarkdownPreview
        name="content"
        label="Content"
        handleMarkdownChange={e => setDataDocContent(e.target.value)}
        markdown={dataDocContent || ''}
      />
      <br />
      <button
        className="btn btn-gray"
        type="button"
        onClick={() => save(false)}
      >
        Save and Keep Editing
      </button>
      <button
        className="btn btn-primary"
        type="button"
        onClick={() => save(true)}
      >
        Save and Close
      </button>
    </div>
  );
};

const styles = {
  label: {
    marginBottom: 20
  },
  input: {
    marginLeft: 10
  },
  helptip: {
    marginLeft: 10
  }
};

DataDocFormEditor.propTypes = {
  dataDocKey: PropTypes.string,
  originalDataDocName: PropTypes.string,
  originalDataDocContent: PropTypes.string
};

export default DataDocFormEditor;
