/**
 * Entry point to build a bundle containing a set of globals used when displaying
 * tutorialExplorer.  Includes the TutorialExplorer React class.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import Immutable from 'immutable';
import FilterHeader from './filterHeader';
import FilterSet from './filterSet';
import TutorialSet from './tutorialSet';
import { mobileCheck } from './util';
import { getResponsiveContainerWidth, isResponsiveCategoryInactive } from './responsive';
import * as utils from '../utils';
import _ from 'lodash';

const SortBy = utils.makeEnum('default', 'popularityrank', 'displayweight');

const TutorialExplorer = React.createClass({
  propTypes: {
    tutorials: React.PropTypes.array.isRequired,
    filterGroups: React.PropTypes.array.isRequired,
    initialFilters: React.PropTypes.objectOf(React.PropTypes.arrayOf(React.PropTypes.string)).isRequired,
    hideFilters: React.PropTypes.objectOf(React.PropTypes.arrayOf(React.PropTypes.string)),
    locale: React.PropTypes.string.isRequired,
    backButton: React.PropTypes.bool,
    legacyLink: React.PropTypes.string,
    roboticsButton: React.PropTypes.bool,
    showSortBy: React.PropTypes.bool.isRequired
  },

  getInitialState() {
    let filters = {};
    for (const filterGroupName in this.props.filterGroups) {
      const filterGroup = this.props.filterGroups[filterGroupName];
      filters[filterGroup.name] = [];
      const initialFiltersForGroup = this.props.initialFilters[filterGroup.name];
      if (initialFiltersForGroup) {
        filters[filterGroup.name] = initialFiltersForGroup;
      }
    }

    let sortBy = SortBy.default;

    const { filteredTutorials, filteredTutorialsForLocale } = this.filterTutorialSet(filters, sortBy);

    return {
      filters: filters,
      filteredTutorials: filteredTutorials,
      filteredTutorialsCount: filteredTutorials.length,
      filteredTutorialsForLocale: filteredTutorialsForLocale,
      windowWidth: $(window).width(),
      windowHeight: $(window).height(),
      mobileLayout: isResponsiveCategoryInactive('md'),
      showingModalFilters: false,
      sortBy: sortBy
    };
  },

  /**
   * Called when a filter in a filter group has its checkbox
   * checked or unchecked.
   *
   * @param {string} filterGroup - The name of the filter group.
   * @param {string} filterEntry - The name of the filter entry.
   * @param {bool} value - Whether the entry was checked or not.
   */
  handleUserInputFilter(filterGroup, filterEntry, value) {
    const state = Immutable.fromJS(this.state);

    let newState = {};
    if (value) {
      // Add value to end of array.
      newState = state.updateIn(['filters', filterGroup], arr => arr.push(filterEntry));
    } else {
      // Find and remove specific value from array.
      const itemIndex = this.state.filters[filterGroup].indexOf(filterEntry);
      newState = state.updateIn(['filters', filterGroup], arr => arr.splice(itemIndex, 1));
    }

    newState = newState.toJS();

    const { filteredTutorials, filteredTutorialsForLocale } = this.filterTutorialSet(newState.filters, this.state.sortBy);
    this.setState({
      ...newState,
      filteredTutorials,
      filteredTutorialsCount: filteredTutorials.length,
      filteredTutorialsForLocale
    });
  },

  /**
   * Called when the sort order is changed via dropdown.
   *
   * @param {SortBy} value - The new sort order.
   */
  handleUserInputSortBy(value) {
    const { filteredTutorials, filteredTutorialsForLocale } = this.filterTutorialSet(this.state.filters, value);
    this.setState({
      filteredTutorials,
      filteredTutorialsCount: filteredTutorials.length,
      filteredTutorialsForLocale,
      sortBy: value
    });
  },

  filterTutorialSet(filters, sortBy) {
    const filterProps = {
      locale: this.props.locale,
      filters: filters,
      hideFilters: this.props.hideFilters,
      sortBy: sortBy
    };
    filterProps.specificLocale = false;
    const filteredTutorials = TutorialExplorer.filterTutorials(this.props.tutorials, filterProps);

    filterProps.specificLocale = true;
    const filteredTutorialsForLocale = TutorialExplorer.filterTutorials(this.props.tutorials, filterProps);

    return { filteredTutorials, filteredTutorialsForLocale };
  },

  componentDidMount() {
    window.addEventListener('resize', _.debounce(this.onResize, 100));
  },

  showModalFilters() {
    this.setState({showingModalFilters: true});
  },

  hideModalFilters() {
    this.setState({showingModalFilters: false});
  },

  shouldShowFilters() {
    return !this.state.mobileLayout || this.state.showingModalFilters;
  },

  shouldShowTutorials() {
    return !this.state.mobileLayout || !this.state.showingModalFilters;
  },

  shouldShowTutorialsForLocale() {
    return this.shouldShowTutorials() && !this.isLocaleEnglish();
  },

  isLocaleEnglish() {
    return this.props.locale.substring(0,2) === "en";
  },

  /**
   * Called when the window resizes. Look to see if width/height changed, then
   * call adjustTopPaneHeight as our maxHeight may need adjusting.
   */
  onResize() {
    const windowWidth = $(window).width();
    const windowHeight = $(window).height();

    // We fire window resize events when the grippy is dragged so that non-React
    // controlled components are able to rerender the editor. If width/height
    // didn't change, we don't need to do anything else here
    if (windowWidth === this.state.windowWidth &&
        windowHeight === this.state.windowHeight) {
      return;
    }

    this.setState({
      windowWidth: $(window).width(),
      windowHeight: $(window).height()
    });

    this.setState({mobileLayout: isResponsiveCategoryInactive('md')});
  },

  statics: {
    /**
     * Filters a given array of tutorials by the given filter props.
     *
     * It goes through all active filter categories.  If no filters are set for
     * a filter group, then that item will default to showing, so long as no other
     * filter group prevents it from showing.
     * hideFilters is an explicit list of filters that we actually hide if matched.
     * But if we do have a filter set for a filter group, and the tutorial is tagged
     * for that filter group, then at least one of the active filters must match a tag.
     * e.g. If the user chooses two platforms, then at least one of the platforms
     * must match a platform tag on the tutorial.
     * A similar check for language is done first.
     * In the case that filterProps.specificLocale is true, we do something slightly
     * different.  We don't show tutorials that don't have any language tags, and we
     * reject tutorials that don't have the current locale explicitly listed.  This
     * allows us to return a set of tutorials that have explicit support for the
     * current locale.
     *
     * @param {Array} tutorials - Array of tutorials.  Each contains a variety of
     *   strings, each of which is a list of tags separated by commas, no spaces.
     * @param {object} filterProps - Object containing filter properties.
     * @param {string} filterProps.locale - The current locale.
     * @param {bool} filterProps.specificLocale - Whether we filter to only allow
     *   through tutorials matching the current locale.
     * @param {object} filterProps.filters - Contains arrays of strings identifying
     *   the currently active filters.  Each array is named for its filter group.
     */
    filterTutorials(tutorials, filterProps) {
      const { locale, specificLocale, filters, hideFilters, sortBy } = filterProps;

      const filteredTutorials = tutorials.filter(tutorial => {
        // Check that the tutorial isn't marked as do-not-show.  If it does,
        // it's hidden.
        if (tutorial.tags.split(',').indexOf("do-not-show") !== -1) {
          return false;
        }

        // First check that the tutorial language doesn't exclude it immediately.
        // If the tags contain some languages, and we don't have a match, then
        // hide the tutorial.
        if (tutorial.languages_supported) {
          const languageTags = tutorial.languages_supported.split(',');
          const currentLocale = locale;
          if (languageTags.length > 0 &&
            languageTags.indexOf(currentLocale) === -1 &&
            languageTags.indexOf(currentLocale.substring(0,2)) === -1) {
            return false;
          }
        } else if (specificLocale) {
          // If the tutorial doesn't have language tags, but we're only looking
          // for specific matches to our current locale, then don't show this
          // tutorial.  i.e. don't let non-locale-specific tutorials through.
          return false;
        }

        // If we are explicitly hiding a matching filter, then don't show the
        // the tutorial.
        for (const filterGroupName in hideFilters) {
          const tutorialTags = tutorial["tags_" + filterGroupName];
          const filterGroup = hideFilters[filterGroupName];

          if (filterGroup.length !== 0 &&
              tutorialTags &&
              tutorialTags.length > 0 &&
              TutorialExplorer.findMatchingTag(filterGroup, tutorialTags)) {
            return false;
          }
        }

        // If we miss any active filter group, then we don't show the tutorial.
        let filterGroupsSatisfied = true;

        for (const filterGroupName in filters) {
          const tutorialTags = tutorial["tags_" + filterGroupName];
          const filterGroup = filters[filterGroupName];

          if (filterGroup.length !== 0 &&
              tutorialTags &&
              tutorialTags.length > 0 &&
              !TutorialExplorer.findMatchingTag(filterGroup, tutorialTags)) {
            filterGroupsSatisfied = false;
          }
        }

        return filterGroupsSatisfied;
      }).sort((tutorial1, tutorial2) => {
        if (sortBy === SortBy.popularityrank) {
          return tutorial1.popularityrank - tutorial2.popularityrank;
        } else {
          return tutorial2.displayweight - tutorial1.displayweight;
        }
      });

      return filteredTutorials;
    },

    /* Given a filter group, and the tutorial's relevant tags for that filter group,
     * see if there's at least a single match.
     * @param {Array} filterGroup - Array of strings, each of which is a selected filter
     *   for the group.  e.g. ["beginner", "experienced"].
     * @param {string} tutorialTags - Comma-separated tags for a tutorial.
     *   e.g. "beginner,experienced".
     * @return {bool} - true if the tutorial had at least one tag matching at least
     *   one of the filterGroup's values.
     */
    findMatchingTag(filterGroup, tutorialTags) {
      return filterGroup.some(filterName => tutorialTags.split(',').indexOf(filterName) !== -1);
    }

  },

  render() {
    return (
      <div style={{width: getResponsiveContainerWidth(), margin: "0 auto"}}>
        <FilterHeader
          onUserInput={this.handleUserInputSortBy}
          sortBy={this.state.sortBy}
          backButton={this.props.backButton}
          legacyLink={this.props.legacyLink}
          filteredTutorialsCount={this.state.filteredTutorialsCount}
          mobileLayout={this.state.mobileLayout}
          showingModalFilters={this.state.showingModalFilters}
          showModalFilters={this.showModalFilters}
          hideModalFilters={this.hideModalFilters}
          showSortBy={this.props.showSortBy}
        />
        <div style={{clear: "both"}}/>

        {this.shouldShowFilters() && (
          <FilterSet
            filterGroups={this.props.filterGroups}
            onUserInput={this.handleUserInputFilter}
            selection={this.state.filters}
            roboticsButton={this.props.roboticsButton}
          />
        )}

        {this.shouldShowTutorialsForLocale() && (
          <div>
            <h1>Tutorials in your language</h1>
            <TutorialSet
              tutorials={this.state.filteredTutorialsForLocale}
              filters={this.state.filters}
              locale={this.props.locale}
              specificLocale={true}
            />
            <h1>Tutorials in many languages</h1>
          </div>
        )}

        {this.shouldShowTutorials() && (
          <TutorialSet
            tutorials={this.state.filteredTutorials}
            filters={this.state.filters}
            locale={this.props.locale}
          />
        )}
      </div>
    );
  }
});

function getFilters({robotics, mobile}) {
  const filters = [
    { name: "grade",
      text: "Grades",
      entries: [
        {name: "pre", text: "Pre-reader"},
        {name: "2-5", text: "Grades 2-5"},
        {name: "6-8", text: "Grades 6-8"},
        {name: "9+", text: "Grades 9+"}]},
    { name: "teacher_experience",
      text: "Educator's experience",
      entries: [
        {name: "beginner", text:"Beginner"},
        {name: "comfortable", text:"Comfortable"}]},
    { name: "student_experience",
      text: "Student's experience",
      entries: [
        {name: "beginner", text: "Beginner"},
        {name: "comfortable", text: "Comfortable"}]},
    { name: "platform",
      text: "Classroom technology",
      entries: [
        {name: "computers", text: "Computers"},
        {name: "android", text: "Android"},
        {name: "ios", text: "iPad/iPhone"},
        {name: "no-internet", text: "Poor or no internet"},
        {name: "no-computers", text: "No computers or devices"}]},
    { name: "subject",
      text: "Topics",
      entries: [
        {name: "science", text: "Science"},
        {name: "math", text: "Math"},
        {name: "history", text: "Social Studies"},
        {name: "la", text: "Language Arts"},
        {name: "art", text: "Art, Media, Music"},
        {name: "cs-only", text: "Computer Science only"}]},
    { name: "activity_type",
      text: "Activity type",
      entries: [
        {name: "online-tutorial", text: "Self-led tutorials"},
        {name: "lesson-plan", text: "Lesson plan"}]},
    { name: "length", text: "Length",
      entries: [
        {name: "1hour", text: "One hour"},
        {name: "1hour-follow", text: "One hour with follow-on"},
        {name: "few-hours", text: "A few hours"}]},
    { name: "programming_language",
      text: "Language",
      entries: [
        {name: "blocks", text: "Blocks"},
        {name: "typing", text: "Typing"},
        {name: "other", text: "Other"}]}];

  const initialFilters = {
    teacher_experience: ["beginner"],
    student_experience: ["beginner"]
  };

  const hideFilters = {
    activity_type: ["robotics"]
  };

  if (robotics) {
    filters.forEach(filterGroup => {
      if (filterGroup.name === "activity_type") {
        filterGroup.entries = [{name: "robotics", text: "Robotics"}];
        filterGroup.display = false;
      }
    });

    initialFilters.activity_type = ["robotics"];

    hideFilters.activity_type = [];
  }

  if (mobile) {
    initialFilters.platform = ["android", "ios"];
  }

  return {filters, initialFilters, hideFilters};
}

window.TutorialExplorerManager = function (options) {
  options.mobile = mobileCheck();
  const {filters, initialFilters, hideFilters} = getFilters(options);

  this.renderToElement = function (element) {
    ReactDOM.render(
      <TutorialExplorer
        tutorials={options.tutorials}
        filterGroups={filters}
        initialFilters={initialFilters}
        hideFilters={hideFilters}
        locale={options.locale}
        backButton={options.backButton}
        legacyLink={options.legacyLink}
        roboticsButton={options.roboticsButton}
        showSortBy={options.showSortBy}
      />,
      element
    );
  };
};

export default TutorialExplorer;
