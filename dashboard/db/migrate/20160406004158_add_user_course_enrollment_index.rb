class AddUserCourseEnrollmentIndex < ActiveRecord::Migration[4.2]
  def change
    add_index :plc_user_course_enrollments, [:user_id, :plc_course_id], unique: true
    remove_index :plc_user_course_enrollments, column: :user_id
  end
end
