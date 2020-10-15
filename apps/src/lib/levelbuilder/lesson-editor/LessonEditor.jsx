import PropTypes from 'prop-types';
import React, {Component} from 'react';
import ActivitiesEditor from '@cdo/apps/lib/levelbuilder/lesson-editor/ActivitiesEditor';
import ResourcesEditor from '@cdo/apps/lib/levelbuilder/lesson-editor/ResourcesEditor';
import TextareaWithMarkdownPreview from '@cdo/apps/lib/levelbuilder/TextareaWithMarkdownPreview';
import HelpTip from '@cdo/apps/lib/ui/HelpTip';
import {announcementShape} from '@cdo/apps/code-studio/announcementsRedux';
import AnnouncementsEditor from '@cdo/apps/lib/levelbuilder/announcementsEditor/AnnouncementsEditor';
import CollapsibleEditorSection from '@cdo/apps/lib/levelbuilder/CollapsibleEditorSection';
import {resourceShape} from '@cdo/apps/lib/levelbuilder/shapes';
import color from '../../../util/color';

const styles = {
  editor: {
    width: '100%'
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '4px 6px',
    color: '#555',
    border: '1px solid #ccc',
    borderRadius: 4,
    margin: 0
  },
  checkbox: {
    margin: '0 0 0 7px'
  },
  dropdown: {
    margin: '0 6px'
  },
  relatedLessonHeader: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 10
  },
  relatedLessonContainer: {
    marginBottom: -15
  },
  relatedLessonLink: {
    marginRight: 30,
    marginBottom: 15,
    display: 'inline-block',
    color: color.purple,
    textDecoration: 'underline'
  }
};

export default class LessonEditor extends Component {
  static propTypes = {
    displayName: PropTypes.string.isRequired,
    overview: PropTypes.string,
    studentOverview: PropTypes.string,
    unplugged: PropTypes.bool,
    lockable: PropTypes.bool,
    assessment: PropTypes.bool,
    creativeCommonsLicense: PropTypes.string,
    purpose: PropTypes.string,
    preparation: PropTypes.string,
    announcements: PropTypes.arrayOf(announcementShape),
    resources: PropTypes.arrayOf(resourceShape),
    relatedLessons: PropTypes.arrayOf(PropTypes.object).isRequired
  };

  getRelatedLessonText(lesson) {
    const includeYear = !lesson.scriptTitle.includes(lesson.versionYear);
    const year = includeYear ? ` - ${lesson.versionYear}` : '';
    const type = lesson.lockable ? 'Lockable' : 'Lesson';
    return `${lesson.scriptTitle}${year} - ${type} ${lesson.relativePosition}`;
  }

  render() {
    const {
      displayName,
      overview,
      studentOverview,
      unplugged,
      lockable,
      creativeCommonsLicense,
      assessment,
      purpose,
      preparation,
      announcements,
      relatedLessons
    } = this.props;
    return (
      <div style={styles.editor}>
        <h1>Editing Lesson "{displayName}"</h1>
        <label>
          Title
          <input name="name" defaultValue={displayName} style={styles.input} />
        </label>

        {relatedLessons.length > 0 && (
          <div style={styles.relatedLessonContainer}>
            <h2 style={styles.relatedLessonHeader}>Update Similar Lessons</h2>
            <p>
              The following lessons are similar to this one. You may want to
              make updates to them as well. Saving this lesson will not update
              other lessons.
            </p>
            {relatedLessons.map(lesson => (
              <a
                key={lesson.id}
                href={lesson.editUrl}
                style={styles.relatedLessonLink}
                target="_blank"
              >
                {this.getRelatedLessonText(lesson)}
              </a>
            ))}
          </div>
        )}

        <CollapsibleEditorSection title="Lesson Settings">
          <label>
            Lockable
            <input
              name="lockable"
              type="checkbox"
              defaultChecked={lockable}
              style={styles.checkbox}
            />
            <HelpTip>
              <p>
                Check this box if this lesson should be locked from teachers.
                Only validated teachers will be able to see it and unlock the
                materials.
              </p>
            </HelpTip>
          </label>
          <label>
            Assessment
            <input
              name="assessment"
              type="checkbox"
              defaultChecked={assessment}
              style={styles.checkbox}
            />
            <HelpTip>
              <p>Check this box if this lesson is an assessment or project. </p>
            </HelpTip>
          </label>
          <label>
            Unplugged Lesson
            <input
              name="unplugged"
              type="checkbox"
              defaultChecked={unplugged}
              style={styles.checkbox}
            />
            <HelpTip>
              <p>
                Check this box if the lesson does not require use of a device.
              </p>
            </HelpTip>
          </label>
          <label>
            Creative Commons Image
            <select
              name="creativeCommonsLicense"
              style={styles.dropdown}
              defaultValue={creativeCommonsLicense}
            >
              <option value="Creative Commons BY-NC-SA">
                Creative Commons BY-NC-SA
              </option>
              <option value="Creative Commons BY-NC-ND">
                Creative Commons BY-NC-ND
              </option>
            </select>
            <HelpTip>
              <p>
                Controls what creative commons license applies to this material.
                Default is Creative Commons BY-NC-SA.
              </p>
            </HelpTip>
          </label>
          <AnnouncementsEditor
            defaultAnnouncements={announcements}
            inputStyle={styles.input}
          />
        </CollapsibleEditorSection>

        <CollapsibleEditorSection title="Lesson Plan">
          <TextareaWithMarkdownPreview
            markdown={overview}
            label={'Overview'}
            name={'overview'}
            inputRows={5}
          />
          <TextareaWithMarkdownPreview
            markdown={studentOverview}
            label={'Student Overview'}
            name={'studentOverview'}
            inputRows={5}
          />
          <TextareaWithMarkdownPreview
            markdown={purpose}
            label={'Purpose'}
            name={'purpose'}
            inputRows={5}
          />
          <TextareaWithMarkdownPreview
            markdown={preparation}
            label={'Preparation'}
            name={'preparation'}
            inputRows={5}
          />
          <ResourcesEditor resources={this.props.resources} />
        </CollapsibleEditorSection>

        <CollapsibleEditorSection title="Activities & Levels">
          <ActivitiesEditor />
        </CollapsibleEditorSection>

        <button className="btn btn-primary" type="submit" style={{margin: 0}}>
          Save Changes
        </button>
      </div>
    );
  }
}
