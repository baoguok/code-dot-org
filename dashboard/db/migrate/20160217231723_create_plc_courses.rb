class CreatePlcCourses < ActiveRecord::Migration
  def change
    create_table :plc_courses do |t|
      t.string :name

      t.timestamps null: false
    end
  end
end
