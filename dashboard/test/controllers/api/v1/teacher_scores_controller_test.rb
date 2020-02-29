require 'test_helper'

class Api::V1::TeacherScoresControllerTest < ActionDispatch::IntegrationTest
  self.use_transactional_test_case = true
  setup_all do
    @teacher = create :teacher
    @student = create :student
    @section = create :section, user: @teacher
    @stage = create :stage
    @stage_2 = create :stage
    @script = create :script
  end

  test 'score_stage_for_section is forbidden if signed out' do
    post '/dashboardapi/v1/teacher_scores', params: {
      section_id: @section.id, stage_scores: [{stage_id: @stage.id, score: 100}]
    }
    assert_response 302
  end

  test 'score_stage_for_section is forbidden if student' do
    sign_in @student
    post '/dashboardapi/v1/teacher_scores', params: {
      section_id: @section.id, stage_scores: [{stage_id: @stage.id, score: 100}]
    }
    assert_response :forbidden
  end

  test 'score_stage_for_section is forbidden for teacher who does not own section' do
    sign_in @teacher
    section_2 = create :section
    post '/dashboardapi/v1/teacher_scores', params: {section_id: section_2.id, stage_scores: [{stage_id: @stage.id, score: 100}]}
    assert_response :forbidden
  end

  test 'score_stages_for_section succeeds with only one stage' do
    teacher = create :teacher
    section = create :section, teacher: teacher
    section.students << create(:student)
    sign_in teacher

    script = create :script
    script_level = create(
      :script_level,
      script: script,
      levels: [
        create(:maze, name: 'test level 1')
      ]
    )
    stage = script_level.stage

    sign_in teacher
    post '/dashboardapi/v1/teacher_scores', params: {section_id: section.id, stage_scores: [{stage_id: stage.id, score: 100}]}
    assert TeacherScore.where(teacher_id: teacher.id).exists?
    assert_response :no_content
  end

  test 'score_stages_for_section fails if stage is not found' do
    teacher = create :teacher
    section = create :section, teacher: teacher
    section.students << create(:student)
    sign_in teacher

    script = create :script
    script_level = create(
      :script_level,
      script: script,
      levels: [
        create(:maze, name: 'test level 1')
      ]
    )
    stage = script_level.stage
    destroyed_stage = create :stage
    destroyed_stage.destroy
    post '/dashboardapi/v1/teacher_scores', params: {section_id: section.id, stage_scores: [{stage_id: stage.id, score: 100}, {stage_id: destroyed_stage.id, score: 0}]}
    refute TeacherScore.where(teacher_id: teacher.id).exists?
    assert_response :forbidden
  end

  test 'get_teacher_scores_for_script is restricted if signed out' do
    post '/dashboardapi/v1/teacher_scores/get', params: {
      section_id: @section.id, script_id: @script.id
    }
    assert_response 302
  end

  test 'get_teacher_scores_for_script is restricted if student' do
    sign_in @student
    post '/dashboardapi/v1/teacher_scores/get', params: {
      section_id: @section.id, script_id: @script.id
    }
    assert_response :forbidden
  end

  test 'get_teacher_scores_for_script succeeds for teacher' do
    sign_in @teacher
    post '/dashboardapi/v1/teacher_scores/get', params: {
      section_id: @section.id, script_id: @script.id
    }
    assert_response :success
  end
end
