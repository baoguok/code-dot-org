namespace :curriculum_pdfs do
  desc 'Identify all content for which we expect to have a generated PDF, but don\'t.'
  task identify_missing_pdfs: :environment do
    any_missing_pdfs_found = false
    Services::CurriculumPdfs.get_pdf_enabled_scripts.each do |script|
      pdfless_lessons = Services::CurriculumPdfs.get_pdfless_lessons(script)
      script_overview_exists = Services::CurriculumPdfs.script_overview_pdf_exists_for?(script)
      script_resources_exists = Services::CurriculumPdfs.script_resources_pdf_exists_for?(script)
      no_missing_pdfs = pdfless_lessons.empty? && script_overview_exists && script_resources_exists
      next if no_missing_pdfs

      any_missing_pdfs_found = true
      puts "Script #{script.name.inspect} is missing PDFs for:"
      pdfless_lessons.each do |lesson|
        puts "  #{lesson.name.inspect} (#{lesson.key})"
      end
      puts "  Script Overview" unless script_overview_exists
      puts "  Script Resources" unless script_resources_exists
    end

    puts "No missing PDFs found" unless any_missing_pdfs_found
  end

  # In order to run this in development, you may first need to install puppeteer via:
  #   cd bin/generate-pdf
  #   yarn install
  # on the staging machine, this is taken care of in cookbooks/cdo-apps/recipes/generate_pdf.rb
  desc 'Generate any PDFs that we would expect to have been generated automatically but for whatever reason haven\'t been.'
  task generate_missing_pdfs: :environment do
    Services::CurriculumPdfs.get_pdf_enabled_scripts.each do |script|
      Dir.mktmpdir("pdf_generation") do |dir|
        any_pdf_generated = false

        Services::CurriculumPdfs.get_pdfless_lessons(script).each do |lesson|
          puts "Generating missing PDFs for #{lesson.key} (from #{script.name})"
          Services::CurriculumPdfs.generate_lesson_pdf(lesson, dir)
          Services::CurriculumPdfs.generate_lesson_pdf(lesson, dir, true)
          any_pdf_generated = true
        end

        if !Services::CurriculumPdfs.script_overview_pdf_exists_for?(script) && Services::CurriculumPdfs.should_generate_overview_pdf?(script)
          puts "Generating missing Script Overview PDF for #{script.name}"
          Services::CurriculumPdfs.generate_script_overview_pdf(script, dir)
          any_pdf_generated = true
        end

        if !Services::CurriculumPdfs.script_resources_pdf_exists_for?(script) && Services::CurriculumPdfs.should_generate_resource_pdf?(script)
          puts "Generating missing Script Resources PDF for #{script.name}"
          Services::CurriculumPdfs.generate_script_resources_pdf(script, dir)
          any_pdf_generated = true
        end

        if any_pdf_generated
          puts "Generated all missing PDFs for #{script.name}; uploading results to S3"
          Services::CurriculumPdfs.upload_generated_pdfs_to_s3(dir)
        end
      end
    end

    puts "Finished generating missing PDFs"
  end
end
