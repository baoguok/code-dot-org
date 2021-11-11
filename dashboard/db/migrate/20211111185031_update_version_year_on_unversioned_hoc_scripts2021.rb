class UpdateVersionYearOnUnversionedHocScripts2021 < ActiveRecord::Migration[5.2]
  def up
    ['spelling-bee', 'counting-csc', 'explore-data-1'].each do |script_name|
      script = Script.find_by(name: script_name)
      script.properties[:version_year] = "unversioned"
      script.save!

      script.course_version
      script.course_version.display_name = "unversioned"
      script.course_version.key = "unversioned"
      script.course_version.save!

      script.reload
      script.write_script_json
    end
  end

  def down
    ['spelling-bee', 'counting-csc', 'explore-data-1'].each do |script_name|
      script = Script.find_by(name: script_name)
      script.properties[:version_year] = "2021"
      script.save!

      script.course_version
      script.course_version.display_name = "2021"
      script.course_version.key = "2021"
      script.course_version.save!

      script.reload
      script.write_script_json
    end
  end
end
