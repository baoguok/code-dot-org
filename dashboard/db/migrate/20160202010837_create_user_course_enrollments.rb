class CreateUserCourseEnrollments < ActiveRecord::Migration
  def change
    create_table :user_course_enrollments do |t|
      t.references :user, index: true, foreign_key: true
      t.references :professional_learning_course, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
