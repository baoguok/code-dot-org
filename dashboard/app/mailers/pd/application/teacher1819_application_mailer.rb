module Pd::Application
  class Teacher1819ApplicationMailer < ActionMailer::Base
    default from: 'Code.org <facilitators@code.org>'

    def confirmation(teacher_application)
      raise "Unexpected #{teacher_application.class}" unless teacher_application.is_a? Teacher1819Application

      @application = teacher_application

      mail(
        to: @application.user.email,
        subject: "We've received your application for Code.org's Professional Learning Program!"
      )
    end
  end
end
