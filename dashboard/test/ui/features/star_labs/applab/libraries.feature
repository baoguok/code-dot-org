# Maddie (6/12/2020) disabled in IE because "And I press keys" step does not work in IE.
# https://github.com/code-dot-org/code-dot-org/pull/24646
@no_ie
@no_mobile
Feature: Libraries

  @as_student
  Scenario: Publishing and unpublishing a library
    Given I start a new Applab project
    And I wait for the page to fully load
    And I wait for initial project save to complete
    And I switch to text mode

    # Publish library
    When I add code for a library function
    Then I open the library publish dialog
    And I wait until element "#ui-test-library-description" is visible
    And I press keys "My library" for element "#ui-test-library-description"
    And I click selector "label:contains('Select all functions')"
    Then I click selector "#ui-test-publish-library"
    And I wait until element "b:contains('Successfully published your library:')" is visible
    Then I save the URL

    # Check for library on /projects/libraries
    Then I am on "http://studio.code.org/projects/libraries"
    And I wait until element ".ui-test-library-table" is visible
    And element ".ui-test-library-table td:contains('UntitledProject')" is visible

    # Unpublish library
    Then I navigate to the saved URL
    And I wait for the page to fully load
    Then I open the library publish dialog
    And I click selector "#ui-test-unpublish-library" once I see it
    And I wait until element "b:contains('Successfully unpublished your library')" is visible

  Scenario: Adding and removing a library from a project
    # Student1 publishes a library
    Given I create a student named "Student1"
    And I start a new Applab project
    And I wait for the page to fully load
    And I wait for initial project save to complete
    And I switch to text mode
    When I add code for a library function
    Then I open the library publish dialog
    And I wait until element "#ui-test-library-description" is visible
    And I press keys "My library" for element "#ui-test-library-description"
    And I click selector "label:contains('Select all functions')"
    Then I click selector "#ui-test-publish-library"
    And I wait until element "b:contains('Successfully published your library:')" is visible
    Then I save the channel id

    # Student2 imports Student1's library
    Given I create a student named "Student2"
    And I start a new Applab project
    And I wait for the page to fully load
    Then I open the Manage Libraries dialog
    And I wait until element "h1:contains('Import library from ID')" is visible
    And I type the saved channel id into element "#ui-test-import-library > input"
    And I click selector "#ui-test-import-library > button" to load a new page

    # Confirm Student1's library is in Student2's project
    And I wait for the page to fully load
    Then I open the Manage Libraries dialog
    And I wait until element "a:contains('UntitledProject')" is visible

    # Remove Student1's library from Student2's project
    And I click selector ".ui-test-remove-library:eq(0)" to load a new page
    And I wait for the page to fully load
    Then I open the Manage Libraries dialog
    And I wait until element "div:contains('You have no libraries in your project')" is visible
