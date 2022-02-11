@no_mobile
Feature: Managing code review groups in the "Manage Students" tab of the teacher dashboard

Background:
  Given I create a levelbuilder named "Dumbledore"
  And I sign in as "Dumbledore" and go home
  And I create a new section named "CSA Section" assigned to "CSA Pilot"
  And I save the section url
  And I save the section id from row 0 of the section table
  Given I create a student named "Hermione"
  And I join the section
  Given I sign in as "Dumbledore" and go home

  Scenario: Create a code review group, add a student to it, and save it
    Given I create a new code review group for the section I saved
    When I add the first student to the first code review group
    Then element ".uitest-code-review-group:first-of-type" has text "Hermione"
    When I click selector ".uitest-base-dialog-confirm"
    Then element ".uitest-base-dialog-footer" eventually contains text "Changes have been saved"
    And element ".uitest-base-dialog-confirm" is disabled
    When I click selector "#uitest-unassign-all-button"
    Then element "#uitest-code-review-group-unassigned" has text "Hermione"
    And element ".uitest-base-dialog-confirm" is enabled

  Scenario: Enable code review for a section
    Given I open the code review groups management dialog
    When I click selector ".toggle-input"
    # We display a message with the number of days until code review groups expire when code review is enabled
    Then element "#uitest-code-review-groups-status-message" eventually contains text "Code review will be automatically disabled"

  @eyes
  Scenario: Code review groups eyes
    Given I open my eyes to test "Code Review Groups"
    When I create a new code review group for the section I saved
    And I add the first student to the first code review group
    And I click selector ".uitest-base-dialog-confirm"
    And element ".uitest-base-dialog-footer" eventually contains text "Changes have been saved"
    Then I see no difference for "saved code review group" using stitch mode "none"
    When I click selector ".toggle-input"
    And element "#uitest-code-review-groups-status-message" eventually contains text "Code review will be automatically disabled"
    Then I see no difference for "enabled code review for section" using stitch mode "none"
    And I close my eyes
