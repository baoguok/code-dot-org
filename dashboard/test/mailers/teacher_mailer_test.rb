require 'test_helper'

class TeacherMailerTest < ActionMailer::TestCase
  test 'new teacher email' do
    teacher = create :teacher, email: 'minerva@hogwarts.co.uk'
    mail = TeacherMailer.new_teacher_email(teacher)

    assert_equal I18n.t('teacher_mailer.new_teacher_subject'), mail.subject
    assert_equal [teacher.email], mail.to
    assert_equal ['hadi_partovi@code.org'], mail.from
    assert links_are_complete_urls?(mail)
  end

  test 'delete teacher email' do
    teacher = create :teacher, email: 'mickey@mouse.com', name: 'Mickey Mouse'
    mail = TeacherMailer.delete_teacher_email(teacher)

    assert_equal I18n.t('teacher_mailer.delete_teacher_subject'), mail.subject
    assert_equal [teacher.email], mail.to
    assert_equal ['noreply@code.org'], mail.from
    assert_match 'Your account has been deleted', mail.body.encoded
  end
end
