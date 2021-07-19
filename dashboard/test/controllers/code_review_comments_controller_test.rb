require 'test_helper'

class CodeReviewCommentsControllerTest < ActionController::TestCase
  self.use_transactional_test_case = true

  setup_all do
    @project_owner = create :student
    @project_owner_channel_id = 'encrypted_channel_id'
    @project_owner_storage_id = 123
    @project_storage_app_id = 456
    @project_version_string = 'special_project_version_string'

    @teacher = create :teacher
    @section = create :section, user: @teacher
    @another_student = create :student
  end

  test 'signed out cannot create CodeReviewComment' do
    post :create
    assert_redirected_to_sign_in
  end

  test 'student can create CodeReviewComment on their own project' do
    stub_storage_apps_calls

    sign_in @project_owner
    post :create, params: {
      channel_id: @project_owner_channel_id,
      project_version: 'a_project_version_string',
      comment: 'a comment'
    }

    assert_response :success
  end

  test 'student not in same section with project owner cannot comment on project' do
    stub_storage_apps_calls

    sign_in @another_student
    post :create, params: {
      channel_id: @project_owner_channel_id,
      project_version: 'a_project_version_string',
      comment: 'a comment'
    }

    assert_response :forbidden
  end

  test 'student in same section with project owner can comment on project' do
    stub_storage_apps_calls

    [@project_owner, @another_student].each do |student|
      create :follower, student_user: student, section: @section
    end

    sign_in @another_student
    post :create, params: {
      channel_id: @project_owner_channel_id,
      project_version: 'a_project_version_string',
      comment: 'a comment'
    }

    assert_response :success
  end

  test 'teacher can create CodeReviewComment for student in their section' do
    stub_storage_apps_calls

    create :follower, student_user: @project_owner, section: @section

    sign_in @teacher
    post :create, params: {
      channel_id: @project_owner_channel_id,
      project_version: 'a_project_version_string',
      comment: 'a comment'
    }

    assert_response :success
  end

  test 'teacher cannot create CodeReviewComment for student not in their section' do
    stub_storage_apps_calls

    sign_in @teacher
    post :create, params: {
      channel_id: @project_owner_channel_id,
      project_version: 'a_project_version_string',
      comment: 'a comment'
    }

    assert_response :forbidden
  end

  test 'project owner can resolve comments on their project' do
    code_review_comment = create :code_review_comment,
      commenter_id: @another_student.id,
      project_owner_id: @project_owner.id

    assert_nil code_review_comment.is_resolved

    sign_in @project_owner
    patch :resolve, params: {id: code_review_comment.id}

    assert_response :success
    assert code_review_comment.reload.is_resolved
  end

  test 'someone who is not project owner cannot resolve comments' do
    code_review_comment = create :code_review_comment,
      commenter_id: @another_student.id,
      project_owner_id: @project_owner.id

    assert_nil code_review_comment.is_resolved

    sign_in @another_student
    patch :resolve, params: {id: code_review_comment.id}

    assert_response :forbidden
  end

  test 'teacher can delete CodeReviewComment for projects of students in their section' do
    create :follower, student_user: @project_owner, section: @section
    code_review_comment = create :code_review_comment,
      project_owner_id: @project_owner.id

    sign_in @teacher
    delete :destroy, params: {id: code_review_comment.id}

    assert_response :success
  end

  test 'teacher cannot delete CodeReviewComment for projects of students not in their section' do
    code_review_comment = create :code_review_comment,
      project_owner_id: @project_owner.id

    sign_in @teacher
    delete :destroy, params: {id: code_review_comment.id}

    assert_response :forbidden
  end

  test 'student cannot delete their own comments' do
    code_review_comment = create :code_review_comment,
      project_owner_id: @project_owner.id

    sign_in @project_owner
    delete :destroy, params: {id: code_review_comment.id}

    assert_response :forbidden
  end

  test 'project owner can fetch project comments for their projects' do
    stub_storage_apps_calls
    setup_project_comments_tests

    sign_in @project_owner
    get :project_comments, params: {
      channel_id: @project_owner_channel_id,
      project_version: @project_version_string
    }

    assert_response :success
    assert_equal 2, JSON.parse(response.body).length
  end

  test 'student in same section as project owner can fetch non-teacher project comments' do
    stub_storage_apps_calls
    setup_project_comments_tests

    [@project_owner, @another_student].each do |student|
      create :follower, student_user: student, section: @section
    end

    sign_in @another_student
    get :project_comments, params: {
      channel_id: @project_owner_channel_id,
      project_version: @project_version_string
    }

    assert_response :success
    assert_equal 2, JSON.parse(response.body).length
  end

  test 'teacher of section project owner is enrolled in can fetch project comments' do
    stub_storage_apps_calls
    setup_project_comments_tests

    create :follower, student_user: @project_owner, section: @section

    sign_in @teacher
    get :project_comments, params: {
      channel_id: @project_owner_channel_id,
      project_version: @project_version_string
    }

    assert_response :success
    assert_equal 2, JSON.parse(response.body).length
  end

  test 'student not in same section as project owner cannot fetch project comments' do
    stub_storage_apps_calls
    setup_project_comments_tests

    sign_in @another_student
    get :project_comments, params: {
      channel_id: @project_owner_channel_id,
      project_version: @project_version_string
    }

    assert_response :forbidden
  end

  test 'teacher cannot fetch project comments if not leading section of project owner' do
    stub_storage_apps_calls
    setup_project_comments_tests

    sign_in @teacher
    get :project_comments, params: {
      channel_id: @project_owner_channel_id,
      project_version: @project_version_string
    }

    assert_response :forbidden
  end

  test 'peer of project owner sees comments without teacher comments' do
    stub_storage_apps_calls
    setup_project_comments_tests

    [@project_owner, @another_student].each do |student|
      create :follower, student_user: student, section: @section
    end

    teacher_comment = create :code_review_comment,
      commenter: @teacher,
      storage_app_id: @project_storage_app_id,
      project_version: @project_version_string,
      project_owner_id: @project_owner.id

    sign_in @another_student
    get :project_comments, params: {channel_id: @project_owner_channel_id}

    comment_ids = JSON.parse(response.body).map {|comment| comment['id']}
    assert_equal 2, JSON.parse(response.body).length
    refute_includes comment_ids, teacher_comment.id
  end

  private

  def stub_storage_apps_calls
    CodeReviewCommentsController.
      any_instance.
      expects(:storage_decrypt_channel_id).
      with(@project_owner_channel_id).
      returns([@project_owner_storage_id, @project_storage_app_id])
    CodeReviewCommentsController.
      any_instance.
      expects(:user_id_for_storage_id).
      with(@project_owner_storage_id).
      returns(@project_owner.id)
  end

  def setup_project_comments_tests
    2.times do
      create :code_review_comment,
        storage_app_id: @project_storage_app_id,
        project_version: @project_version_string,
        project_owner_id: @project_owner.id
    end

    # Create third code review comment from another project
    # to make sure we only fetch the correct set of comments.
    create :code_review_comment
  end
end
