import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import SchoolInfoInputs from '@cdo/apps/templates/SchoolInfoInputs';

const TEACHER_ONLY_FIELDS = ["#teacher-name-field", "#school-info-inputs", "#email-preference-dropdown", "#printable-terms-of-service"];
const STUDENT_ONLY_FIELDS = ["#student-name-field", "#age-dropdown", "#student-consent"];
const SHARED_FIELDS = ["#gender-dropdown", "#terms-of-service"];
const ALL_FIELDS = [...TEACHER_ONLY_FIELDS, ...STUDENT_ONLY_FIELDS, ...SHARED_FIELDS];
let schoolData = {};

$(document).ready(() => {
  const schoolInfoMountPoint = document.getElementById("school-info-inputs");
  renderSchoolInfo();

  $("#print-terms").click(function () {
    $("#print-frame")[0].contentWindow.print();
  });

  $("#user_user_type").change(function () {
    var value = $(this).val();
    switch (value) {
      case "teacher":
        switchToTeacher();
        break;
      case "student":
        switchToStudent();
        break;
      default:
        hideFields(ALL_FIELDS);
    }
  });

  function switchToTeacher() {
    fadeInFields(TEACHER_ONLY_FIELDS);
    fadeInFields(SHARED_FIELDS);
    hideFields(STUDENT_ONLY_FIELDS);
  }

  function switchToStudent() {
    fadeInFields(STUDENT_ONLY_FIELDS);
    fadeInFields(SHARED_FIELDS);
    hideFields(TEACHER_ONLY_FIELDS);
  }

  function fadeInFields(fields) {
    $(fields.join(', ')).fadeIn();
  }

  function hideFields(fields) {
    $(fields.join(', ')).hide();
  }

  function renderSchoolInfo() {
    if (schoolInfoMountPoint) {
      ReactDOM.render(
        <SchoolInfoInputs
          schoolType={schoolData.schoolType}
          country={schoolData.country}
          ncesSchoolId={schoolData.ncesSchoolId}
          schoolName={schoolData.schoolName}
          schoolCity={schoolData.schoolCity}
          schoolState={schoolData.schoolState}
          schoolZip={schoolData.schoolZip}
          schoolLocation={schoolData.schoolLocation}
          useGoogleLocationSearch={schoolData.useGoogleLocationSearch}
          onCountryChange={onCountryChange}
          onSchoolTypeChange={onSchoolTypeChange}
          onSchoolChange={onSchoolChange}
          onSchoolNotFoundChange={onSchoolNotFoundChange}
        />,
        schoolInfoMountPoint
      );
    }
  }

  function onCountryChange(_, event) {
    schoolData.country = event ? event.value : '';
    renderSchoolInfo();
  }

  function onSchoolTypeChange(event) {
    schoolData.schoolType = event ? event.target.value : '';
    renderSchoolInfo();
  }

  function onSchoolChange(_, event) {
    schoolData.ncesSchoolId = event ? event.value : '';
    renderSchoolInfo();
  }

  function onSchoolNotFoundChange(field, event) {
    if (event) {
      schoolData = {
        ...schoolData,
        [field]: event.target.value
      };
    }
    renderSchoolInfo();
  }
});
