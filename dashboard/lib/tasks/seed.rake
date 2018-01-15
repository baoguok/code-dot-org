require 'csv'
require '../lib/cdo/git_utils'
require '../lib/cdo/rake_utils'

namespace :seed do
  verbose false

  task videos: :environment do
    Video.setup
  end

  task concepts: :environment do
    Concept.setup
  end

  task games: :environment do
    Game.setup
  end

  SCRIPTS_GLOB = Dir.glob('config/scripts/**/*.script').sort.flatten
  UI_TEST_SCRIPTS = [
    '20-hour',
    'algebra',
    'allthehiddenthings',
    'alltheplcthings',
    'allthethings',
    'allthettsthings',
    'artist',
    'course1',
    'course2',
    'course3',
    'course4',
    'csp1',
    'csp2',
    'csp3',
    'csp3-a',
    'csp3-research-mxghyt',
    'csp4',
    'csp5',
    'csp-ap',
    'csp-explore',
    'csp-create',
    'csppostap',
    'events',
    'flappy',
    'frozen',
    'hero',
    'hourofcode',
    'infinity',
    'mc',
    'minecraft',
    'playlab',
    'starwars',
    'starwarsblocks',
    'step',
  ].map {|script| "config/scripts/#{script}.script"}
  SEEDED = 'config/scripts/.seeded'

  file SEEDED => [SCRIPTS_GLOB, :environment].flatten do
    update_scripts
  end

  def update_scripts(opts = {})
    # optionally, only process modified scripts to speed up seed time
    scripts_seeded_mtime = (opts[:incremental] && File.exist?(SEEDED)) ?
      File.mtime(SEEDED) : Time.at(0)
    touch SEEDED # touch seeded "early" to reduce race conditions
    script_files = opts[:ui_test] ? UI_TEST_SCRIPTS : SCRIPTS_GLOB
    begin
      custom_scripts = script_files.select {|script| File.mtime(script) > scripts_seeded_mtime}
      LevelLoader.update_unplugged if File.mtime('config/locales/unplugged.en.yml') > scripts_seeded_mtime
      _, custom_i18n = Script.setup(custom_scripts)
      Script.merge_and_write_i18n(custom_i18n)
    rescue
      rm SEEDED # if we failed to do any of that stuff we didn't seed anything, did we
      raise
    end
  end

  SCRIPTS_DEPENDENCIES = [:environment, :games, :custom_levels, :dsls]
  task scripts: SCRIPTS_DEPENDENCIES do
    update_scripts(incremental: false)
  end

  task scripts_incremental: SCRIPTS_DEPENDENCIES do
    update_scripts(incremental: true)
  end

  task scripts_ui_tests: SCRIPTS_DEPENDENCIES do
    update_scripts(ui_test: true)
  end

  task courses: :environment do
    Dir.glob(Course.file_path('**')).sort.map do |path|
      Course.load_from_path(path)
    end
  end

  task courses_ui_tests: :environment do
    # seed those courses that are needed for UI tests
    UI_TEST_COURSES = [
      'allthethingscourse',
      'csp',
    ].each do |course_name|
      Course.load_from_path("config/courses/#{course_name}.course")
    end
  end

  # detect changes to dsldefined level files
  # LevelGroup must be last here so that LevelGroups are seeded after all levels that they can contain
  DSL_TYPES = %w(TextMatch ContractMatch External Match Multi EvaluationMulti LevelGroup)
  DSLS_GLOB = DSL_TYPES.map {|x| Dir.glob("config/scripts/**/*.#{x.underscore}*").sort}.flatten
  file 'config/scripts/.dsls_seeded' => DSLS_GLOB do |t|
    Rake::Task['seed:dsls'].invoke
    touch t.name
  end

  # explicit execution of "seed:dsls"
  task dsls: :environment do
    DSLDefined.transaction do
      i18n_strings = {}
      # Parse each .[dsl] file and setup its model.
      DSLS_GLOB.each do |filename|
        dsl_class = DSL_TYPES.detect {|type| filename.include?(".#{type.underscore}")}.try(:constantize)
        begin
          data, i18n = dsl_class.parse_file(filename)
          dsl_class.setup data
          i18n_strings.deep_merge! i18n
        rescue Exception
          puts "Error parsing #{filename}"
          raise
        end
      end
      # Rewrite autogenerated 'dsls.en.yml' i18n file with new master-copy English strings
      i18n_warning = "# Autogenerated English-language level-definition locale file. Do not edit by hand or commit to version control.\n"
      File.write('config/locales/dsls.en.yml', i18n_warning + i18n_strings.deep_sort.to_yaml(line_width: -1))
    end
  end

  task import_custom_levels: :environment do
    LevelLoader.load_custom_levels
  end

  # Generate the database entry from the custom levels json file
  task custom_levels: :environment do
    LevelLoader.load_custom_levels
  end

  # Seeds the data in callouts
  task callouts: :environment do
    Callout.transaction do
      Callout.reset_db
      # TODO: If the id of the callout is important, specify it in the tsv
      # preferably the id of the callout is not important ;)
      Callout.find_or_create_all_from_tsv!('config/callouts.tsv')
    end
  end

  # Seeds the data in school_districts
  task school_districts: :environment do
    SchoolDistrict.seed_all
  end

  # Seeds the data in schools
  task schools: :environment do
    School.seed_all
  end

  task ap_school_codes: :environment do
    Census::ApSchoolCode.seed
  end

  task ap_cs_offerings: :environment do
    Census::ApCsOffering.seed
  end

  task ib_school_codes: :environment do
    Census::IbSchoolCode.seed
  end

  task ib_cs_offerings: :environment do
    Census::IbCsOffering.seed
  end

  # Seeds the data in regional_partners
  task regional_partners: :environment do
    RegionalPartner.transaction do
      RegionalPartner.find_or_create_all_from_tsv('config/regional_partners.tsv')
    end
  end

  task regional_partners_school_districts: :environment do
    seed_regional_partners_school_districts(false)
  end

  task force_regional_partners_school_districts: :environment do
    seed_regional_partners_school_districts(true)
  end

  def seed_regional_partners_school_districts(force)
    # use a much smaller dataset in environments that reseed data frequently.
    mapping_tsv = CDO.stub_school_data ?
        'test/fixtures/regional_partners_school_districts.tsv' :
        'config/regional_partners_school_districts.tsv'

    expected_count = `grep -v 'NO PARTNER' #{mapping_tsv} | wc -l`.to_i - 1
    raise "#{mapping_tsv} contains no data" unless expected_count > 0
    RegionalPartnersSchoolDistrict.transaction do
      if (RegionalPartnersSchoolDistrict.count < expected_count) || force
        # This step can take up to 1 minute to complete when not using stubbed data.
        RegionalPartnersSchoolDistrict.find_or_create_all_from_tsv(mapping_tsv)
      end
    end
  end

  MAX_LEVEL_SOURCES = 10_000
  desc "calculate solutions (ideal_level_source) for levels based on most popular correct solutions (very slow)"
  task ideal_solutions: :environment do
    require 'benchmark'
    Level.where_we_want_to_calculate_ideal_level_source.each do |level|
      next if level.try(:free_play?)
      puts "Level #{level.id}"
      level_sources_count = level.level_sources.count
      if level_sources_count > MAX_LEVEL_SOURCES
        puts "...skipped, too many possible solutions"
      else
        times = Benchmark.measure {level.calculate_ideal_level_source_id}
        puts "... analyzed #{level_sources_count} in #{times.real.round(2)}s"
      end
    end
  end

  task :import_users, [:file] => :environment do |_t, args|
    CSV.read(args[:file], {col_sep: "\t", headers: true}).each do |row|
      User.create!(
        provider: User::PROVIDER_MANUAL,
        name: row['Name'],
        username: row['Username'],
        password: row['Password'],
        password_confirmation: row['Password'],
        birthday: row['Birthday'].blank? ? nil : Date.parse(row['Birthday'])
      )
    end
  end

  task secret_words: :environment do
    SecretWord.setup
  end

  task secret_pictures: :environment do
    SecretPicture.setup
  end

  task :cached_ui_test do
    if File.exist?('db/ui_test_data.commit')
      dump_commit = File.read('db/ui_test_data.commit')
      if GitUtils.valid_commit?(dump_commit)
        files_changed = GitUtils.files_changed_in_branch_or_local(
          dump_commit,
          [
            'dashboard/app/dsl/**/*',
            'dashboard/config/**/*',
            'dashboard/db/**/*',
            'dashboard/lib/tasks/**/*',
          ],
          ignore_patterns: [
            'dashboard/db/ui_test_data.*',
          ],
        )
        if files_changed.empty?
          puts 'Cache hit! Loading from db dump'
          sh('mysql -u root < db/ui_test_data.sql')
          next
        end
        puts files_changed
      else
        puts 'SQL dump created on unreachable commit'
      end
    end

    puts 'Cache mismatch, running full ui test seed'
    Rake::Task['seed:ui_test'].invoke
    File.write('db/ui_test_data.commit', GitUtils.git_revision_branch('origin/' + GitUtils.current_branch))
    sh('mysqldump -u root -B dashboard_test > db/ui_test_data.sql')
  end

  task :cache_ui_test_data do
  end

  desc "seed all dashboard data"
  task all: [:videos, :concepts, :scripts, :callouts, :school_districts, :schools, :regional_partners, :regional_partners_school_districts, :secret_words, :secret_pictures, :courses, :ib_school_codes, :ib_cs_offerings]
  task ui_test: [:videos, :concepts, :scripts_ui_tests, :courses_ui_tests, :callouts, :school_districts, :schools, :regional_partners, :regional_partners_school_districts, :secret_words, :secret_pictures]
  desc "seed all dashboard data that has changed since last seed"
  task incremental: [:videos, :concepts, :scripts_incremental, :callouts, :school_districts, :schools, :regional_partners, :regional_partners_school_districts, :secret_words, :secret_pictures, :courses, :ib_school_codes, :ib_cs_offerings]

  desc "seed only dashboard data required for tests"
  task test: [:videos, :games, :concepts, :secret_words, :secret_pictures, :school_districts, :schools, :regional_partners, :regional_partners_school_districts]
end
