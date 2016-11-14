require_relative '../../deployment'

# Rake tasks for asset packages (currently only 'apps').
namespace :package do
  BUILD_PACKAGE=%i[staging test].include?(rack_env)

  namespace :apps do
    def apps_packager
      S3Packaging.new('apps', apps_dir, dashboard_dir('public/apps-package'))
    end

    desc 'Update apps static asset package.'
    task 'update' do
      require 'cdo/aws/s3_packaging'

      # never download if we build our own
      next if CDO.use_my_apps || !BUILD_PACKAGE

      unless apps_packager.update_from_s3
        if BUILD_PACKAGE
          Rake::Task['build'].invoke
        else
          raise 'No valid apps package found'
        end
      end
    end

    desc 'Build and test apps package and upload to S3.'
    task 'build' do
      raise "Won't build apps with staged changes" if RakeUtils.git_staged_changes?(apps_dir)
      HipChat.wrap('Building apps') { Rake::Task['build:apps'].invoke }
      HipChat.wrap('Testing apps') { Rake::Task['test:apps'].invoke }

      # upload to s3
      packager = apps_packager
      package = packager.upload_package_to_s3('/build/package')
      HipChat.log "Uploaded apps package to S3: #{packager.commit_hash}"
      packager.decompress_package(package)
    end

    desc 'Update Dashboard symlink for apps package.'
    task 'symlink' do
      Dir.chdir(apps_dir) do
        target = CDO.use_my_apps ? apps_dir('build/package') : 'apps-package'
        RakeUtils.ln_s target, dashboard_dir('public', 'blockly')
      end
    end
  end
  desc 'Update apps package and create Dashboard symlink.'
  task apps: ['apps:update', 'apps:symlink']
end
desc 'Update all packages (apps).'
task package: ['package:apps']
