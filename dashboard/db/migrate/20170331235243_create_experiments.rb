class CreateExperiments < ActiveRecord::Migration[5.0]
  def change
    create_table :experiments do |t|
      t.timestamps

      t.string :name, null: false
      t.string :type, null: false
      t.datetime :start_time
      t.datetime :end_time
      t.integer :section_id, index: true
      t.integer :min_user_id, index: true
      t.integer :max_user_id, index: true
      t.integer :overflow_max_user_id, index: true
      t.datetime :earliest_section_start
      t.datetime :latest_section_start
      t.integer :script_id
    end
  end
end
