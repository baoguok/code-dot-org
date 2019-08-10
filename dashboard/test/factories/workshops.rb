#
# Factories for different types of PD workshops
#
FactoryGirl.define do
  factory :workshop, class: 'Pd::Workshop', aliases: [:pd_workshop] do
    transient do
      num_sessions 1
      num_facilitators 0
      sessions_from {Date.current + 9.hours} # Start time of the first session, then one per day after that.
      each_session_hours 6
      num_enrollments 0
      enrolled_and_attending_users 0
      enrolled_unattending_users 0
      num_completed_surveys 0
      randomized_survey_answers false
      assign_session_code false
    end

    association :organizer, factory: :workshop_organizer
    location_name 'Hogwarts School of Witchcraft and Wizardry'
    course Pd::Workshop::COURSES.first
    subject {Pd::Workshop::SUBJECTS[course].try(&:first)}
    capacity 10
    on_map true
    funded false

    #
    # Traits
    #

    # TODO: Change into a sub-factory
    trait :teachercon do
      course Pd::Workshop::COURSE_CSP
      subject Pd::Workshop::SUBJECT_CSP_TEACHER_CON
    end

    # TODO: Change into a sub-factory
    trait :local_summer_workshop do
      course Pd::Workshop::COURSE_CSP
      subject Pd::Workshop::SUBJECT_CSP_SUMMER_WORKSHOP
    end

    # TODO: Change into a sub-factory + trait
    trait :local_summer_workshop_upcoming do
      local_summer_workshop
      num_sessions 5
      sessions_from {Date.current + 3.months}
    end

    # TODO: Change into a sub-factory
    trait :fit do
      course Pd::Workshop::COURSE_CSP
      subject Pd::Workshop::SUBJECT_CSP_FIT
    end

    trait :in_progress do
      started_at {Time.zone.now}
    end

    trait :ended do
      started_at {Time.zone.now}
      ended_at {Time.zone.now}
    end

    trait :with_codes_assigned do
      assign_session_code true
    end

    trait :funded do
      funded true
      funding_type {course == Pd::Workshop::COURSE_CSF ? Pd::Workshop::FUNDING_TYPE_FACILITATOR : nil}
    end

    #
    # Factory hooks
    #

    after(:build) do |workshop, evaluator|
      # Sessions, one per day starting today (unless they were manually provided)
      if evaluator.sessions.empty?
        evaluator.num_sessions.times do |i|
          params = [{
            workshop: workshop,
            start: evaluator.sessions_from + i.days,
            duration_hours: evaluator.each_session_hours
          }]
          params.prepend :with_assigned_code if evaluator.assign_session_code
          workshop.sessions << build(:pd_session, *params)
        end
      end
      evaluator.num_enrollments.times do
        workshop.enrollments << build(:pd_enrollment, workshop: workshop)
      end
      evaluator.enrolled_and_attending_users.times do
        teacher = create :teacher
        workshop.enrollments << build(:pd_enrollment, workshop: workshop, user: teacher)
        workshop.sessions.each do |session|
          session.attendances << build(:pd_attendance, session: session, teacher: teacher)
        end
      end
      evaluator.enrolled_unattending_users.times do
        teacher = create :teacher
        workshop.enrollments << build(:pd_enrollment, workshop: workshop, user: teacher)
      end
    end

    after(:create) do |workshop, evaluator|
      workshop.sessions.map(&:save)

      evaluator.num_facilitators.times do
        workshop.facilitators << (create :facilitator, course: workshop.course)
      end

      evaluator.num_completed_surveys.times do
        enrollment = create :pd_enrollment, workshop: workshop
        if workshop.teachercon?
          create :pd_teachercon_survey, pd_enrollment: enrollment, randomized_survey_answers: evaluator.randomized_survey_answers
        elsif workshop.local_summer?
          create :pd_local_summer_workshop_survey, pd_enrollment: enrollment, randomized_survey_answers: evaluator.randomized_survey_answers
        else
          raise 'Num_completed_surveys trait unsupported for this workshop type'
        end
      end
    end

    #
    # Sub-factories
    #
  end
end
