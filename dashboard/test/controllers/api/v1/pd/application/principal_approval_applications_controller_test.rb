require 'test_helper'

module Api::V1::Pd::Application
  class PrincipalApprovalApplicationsControllerTest < ::ActionController::TestCase
    include Pd::Application::ActiveApplicationModels
    include Pd::Application::ApplicationConstants

    setup_all do
      @teacher_application = create TEACHER_APPLICATION_FACTORY, application_guid: SecureRandom.uuid
      @test_params = {
        form_data: build(PRINCIPAL_APPROVAL_HASH_FACTORY, :approved_yes),
        application_guid: @teacher_application.application_guid
      }
    end

    setup do
      TEACHER_APPLICATION_MAILER_CLASS.stubs(:principal_approval_received).returns(
        mock {|mail| mail.stubs(:deliver_now)}
      )
    end

    # no log in required
    test_user_gets_response_for :create, method: :put, user: nil, params: -> {@test_params}, response: :success

    test 'Updates user and application_guid upon submit' do
      principal = create :teacher
      sign_in principal

      assert_creates(PRINCIPAL_APPROVAL_APPLICATION_CLASS) do
        put :create, params: @test_params
        assert_response :success
      end

      PRINCIPAL_APPROVAL_APPLICATION_CLASS.find_by!(
        application_guid: @teacher_application.application_guid
      )

      @teacher_application.reload
      expected_principal_fields = {
        principal_approval: 'Yes',
        schedule_confirmed: 'Yes',
        diversity_recruitment: 'Yes',
        free_lunch_percent: '50%',
        underrepresented_minority_percent: '52.0',
        wont_replace_existing_course: PRINCIPAL_APPROVAL_APPLICATION_CLASS.options[:replace_course][1],
        can_pay_fee: 'Yes, my school or my teacher will be able to pay the full summer workshop program fee.'
      }
      actual_principal_fields = @teacher_application.sanitize_form_data_hash.slice(*expected_principal_fields.keys)

      assert_equal(
        {
          regional_partner_name: NO,
          committed: YES,
          able_to_attend_single: YES,
          principal_approval: YES,
          csp_which_grades: YES,
          csp_course_hours_per_year: YES,
          previous_yearlong_cdo_pd: YES,
          csp_how_offer: 2,
          taught_in_past: 2,
          schedule_confirmed: YES,
          diversity_recruitment: YES,
          free_lunch_percent: 5,
          underrepresented_minority_percent: 5,
          wont_replace_existing_course: 5
        }, @teacher_application.response_scores_hash
      )

      assert_equal expected_principal_fields, actual_principal_fields
    end

    test 'application update contains replaced courses' do
      teacher_application = create TEACHER_APPLICATION_FACTORY, application_guid: SecureRandom.uuid

      test_params = {
        application_guid: teacher_application.application_guid,
        form_data: build(PRINCIPAL_APPROVAL_HASH_FACTORY).merge(
          {
            replace_course: "Yes",
            replace_which_course_csp: ['CodeHS', 'CS50']
          }.stringify_keys
        )
      }

      assert_creates(PRINCIPAL_APPROVAL_APPLICATION_CLASS) do
        put :create, params: test_params
        assert_response :success
      end

      assert_equal 'Yes: CodeHS, CS50', teacher_application.reload.sanitize_form_data_hash[:wont_replace_existing_course]
    end

    test 'application update includes Other fields' do
      teacher_application = create TEACHER_APPLICATION_FACTORY, application_guid: SecureRandom.uuid

      test_params = {
        application_guid: teacher_application.application_guid,
        form_data: build(PRINCIPAL_APPROVAL_HASH_FACTORY,
          do_you_approve: "Other:",
          do_you_approve_other: "this is the other for do you approve",
          committed_to_master_schedule: "Other:",
          committed_to_master_schedule_other: "this is the other for master schedule",
          committed_to_diversity: "Other (Please Explain):",
          committed_to_diversity_other: "this is the other for diversity",
          replace_course: "I don't know (Please Explain):",
          replace_course_other: "this is the other for replace course"
        )
      }

      assert_creates(PRINCIPAL_APPROVAL_APPLICATION_CLASS) do
        put :create, params: test_params
        assert_response :success
      end

      expected_principal_fields = {
        principal_approval: "Other: this is the other for do you approve",
        schedule_confirmed: "Other: this is the other for master schedule",
        diversity_recruitment: "Other (Please Explain): this is the other for diversity",
        wont_replace_existing_course: "I don't know (Please Explain): this is the other for replace course",
      }
      actual_principal_fields = teacher_application.reload.sanitize_form_data_hash.select do |k, _|
        expected_principal_fields.keys.include? k
      end

      assert_equal expected_principal_fields, actual_principal_fields
    end

    test 'Sends principal approval received email on successful create' do
      TEACHER_APPLICATION_MAILER_CLASS.expects(:principal_approval_received).
        with(@teacher_application).
        returns(mock {|mail| mail.expects(:deliver_now)})

      put :create, params: @test_params
      assert_response :success
    end

    test 'Does not send email on unsuccessful create' do
      TEACHER_APPLICATION_MAILER_CLASS.expects(:principal_approval_received).never

      put :create, params: {form_data: {first_name: ''}, application_guid: 'invalid'}
      assert_response :bad_request
    end

    test 'submit is idempotent' do
      create PRINCIPAL_APPROVAL_FACTORY, teacher_application: @teacher_application

      assert_no_difference "#{PRINCIPAL_APPROVAL_APPLICATION_CLASS.name}.count" do
        put :create, params: @test_params
      end
      assert_response :success
    end
  end
end
