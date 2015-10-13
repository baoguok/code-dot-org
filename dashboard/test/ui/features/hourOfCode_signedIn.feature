@dashboard_db_access

Feature: Hour of Code tests for users that are signed in

Background:
  Given I am on "http://studio.code.org/"
  And I am a student
  Then I reload the page

Scenario:
  Given I am on "http://studio.code.org/hoc/1?noautoplay=true"
  Then I wait to see a dialog titled "Puzzle 1 of 20"
  And I debug cookies
  And I close the dialog
  Then I wait until element "#runButton" is visible
  And I drag block "1" to block "5"
  And I press "runButton"
  Then I wait to see ".modal"
  And element ".modal .congrats" contains text "You completed Puzzle 1."
  Then I close the dialog
  Then I wait to see a dialog titled "Puzzle 2 of 20"
  And I close the dialog
  When element "#runButton" is visible
  Then element ".header_middle a:first" has class "level_link perfect"

Scenario: Failing at puzzle 6, refreshing puzzle 6, bubble should show up as attempted
  Given I am on "http://studio.code.org/hoc/6?noautoplay=true"
  And I rotate to landscape
  Then I wait to see a dialog titled "Puzzle 6 of 20"
  And I debug cookies
  And I close the dialog
  Then I wait until element "#runButton" is visible
  And I press "runButton"
  Then I wait to see ".modal"
  Then I close the dialog
  Then I reload the page
  Then I wait to see ".modal"
  And I close the dialog
  And I debug cookies
  When element "#runButton" is visible
  And I debug cookies
  Then element ".progress_container div:nth-child(6) a" has class "level_link attempted"

  Scenario: Go to puzzle 1, see video, go somewhere else, return to puzzle 1, should not see video
    Given I am on "http://studio.code.org/hoc/1"
    And I rotate to landscape
    Then I wait until element "#video" is visible
    Then I close the dialog
    Then I wait to see a dialog titled "Puzzle 1 of 20"
    Then I close the dialog
    Then I am on "http://studio.code.org/hoc/2"
    Then I am on "http://studio.code.org/hoc/1"
    Then element "#runButton" is visible