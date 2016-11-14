require_relative '../../deployment'
require 'cdo/hip_chat'
require 'cdo/rake_utils'
require 'cdo/git_utils'
require 'cdo/aws/cloudfront'

namespace :ci do
  desc 'Update Firebase configuration for this environment.'
  task firebase: ['firebase:ci']

  # Synchronize the Chef cookbooks to the Chef repo for this environment using Berkshelf.
  task :chef do
    if CDO.daemon && CDO.chef_managed && !CDO.chef_local_mode
      HipChat.log('Updating Chef cookbooks...')
      RakeUtils.with_bundle_dir(cookbooks_dir) do
        # Automatically update Chef cookbook versions in staging environment.
        RakeUtils.bundle_exec './update_cookbook_versions' if rack_env?(:staging)
        RakeUtils.bundle_exec 'berks', 'install'
        if rack_env?(:staging) && GitUtils.file_changed_from_git?(cookbooks_dir)
          RakeUtils.system 'git', 'add', '.'
          RakeUtils.system 'git', 'commit', '-m', '"Updated cookbook versions"'
          RakeUtils.git_push
        end
        RakeUtils.bundle_exec 'berks', 'upload', (rack_env?(:production) ? '' : '--no-freeze')
        RakeUtils.bundle_exec 'berks', 'apply', rack_env
      end
    end
  end

  # Deploy updates to CloudFront in parallel with the local build to optimize total CI build time.
  multitask build_with_cloudfront: [:build, :cloudfront]

  # Update CloudFront distribution with any changes to the http cache configuration.
  # If there are changes to be applied, the update can take 15 minutes to complete.
  task :cloudfront do
    if CDO.daemon && CDO.chef_managed
      HipChat.wrap('Update CloudFront') do
        AWS::CloudFront.create_or_update
      end
    end
  end

  # Perform a normal local build by calling the top-level Rakefile.
  # Additionally run the lint task if specified for the environment.
  task build: [:chef_update] do
    Dir.chdir(deploy_dir) do
      HipChat.wrap('rake lint') do
        RakeUtils.rake 'lint' if CDO.lint
      end
      HipChat.wrap('rake build') do
        RakeUtils.rake 'build'
      end
    end
  end

  # Update the front-end instances, in parallel, updating up to 20% of the
  # instances at any one time.
  MAX_FRONTEND_UPGRADE_FAILURES = 5
  task :deploy do
    HipChat.wrap('deploy frontends') do
      app_servers = CDO.app_servers
      if CDO.daemon && app_servers.any?
        Dir.chdir(deploy_dir) do
          num_failures = 0
          thread_count = (app_servers.keys.length * 0.20).ceil
          threaded_each app_servers.keys, thread_count do |name|
            succeeded = upgrade_frontend name, app_servers[name]
            unless succeeded
              num_failures += 1
              raise 'too many frontend upgrade failures, aborting deploy' if num_failures > MAX_FRONTEND_UPGRADE_FAILURES
            end
          end
        end
      end
    end
  end


  task test: ['test:ci']

  tasks = []
  tasks << :chef
  tasks << :lint if CDO.lint
  tasks << 'build:chef'
  tasks << :build
  tasks << 'stack:start'
  task all: tasks
end

desc 'Update the server as part of continuous integration.'
task :ci do
  HipChat.wrap('CI build') { Rake::Task['ci:all'].invoke }
end

# Use the AWS-provided scripts to cleanly deregister a frontend instance from its load balancer(s),
# with zero downtime and support for auto-scaling groups.
# Raises a RuntimeError if the script returns a non-zero exit code.
def deregister_frontend(host, log_path)
  command = [
    "cd #{rack_env}",
    'bin/deploy_frontend/deregister_from_elb.sh',
  ].join(' ; ')

  RakeUtils.system 'ssh', '-i', '~/.ssh/deploy-id_rsa', host, "'#{command} 2>&1'", '>', log_path
end

# Use the AWS-provided script to cleanly re-register a frontend instance with its load balancer(s).
# Raises a RuntimeError if the script returns a non-zero exit code.
def reregister_frontend(host, log_path)
  command = [
    "cd #{rack_env}",
    'bin/deploy_frontend/register_with_elb.sh',
  ].join(' ; ')
  RakeUtils.system 'ssh', '-i', '~/.ssh/deploy-id_rsa', host, "'#{command} 2>&1'", '>>', log_path
end

#
# upgrade_frontend - this is called by daemon to update the user-facing front-end instances. for
#   this to work, daemon has an SSH key (deploy-id_rsa) that gives it access to connect to the front-ends.
#
def upgrade_frontend(name, host)
  commands = [
    "cd #{rack_env}",
    'git pull --ff-only',
    'sudo bundle install',
    'rake build'
  ]
  command = commands.join(' && ')

  HipChat.log "Upgrading <b>#{name}</b> (#{host})..."

  log_path = aws_dir "deploy-#{name}.log"

  success = false
  begin
    # Remove the frontend from load balancer rotation before running the commands,
    # so that the git pull doesn't modify files out from under a running instance.
    deregister_frontend host, log_path
    RakeUtils.system 'ssh', '-i', '~/.ssh/deploy-id_rsa', host, "'#{command} 2>&1'", '>>', log_path
    success = true
    reregister_frontend host, log_path
    HipChat.log "Upgraded <b>#{name}</b> (#{host})."
  rescue
    # The frontend is in an indeterminate state, and is not registered with the load balancer.
    HipChat.log "<b>#{name}</b> (#{host}) failed to upgrade, and may currently be out of the load balancer rotation.\n" \
      "Either re-deploy, or run the following command (from Gateway) to manually upgrade this instance:\n" \
      "`ssh #{name} '~/#{rack_env}/bin/deploy_frontend/deregister_from_elb.sh && #{command} && ~/#{rack_env}/bin/deploy_frontend/register_with_elb.sh'`",
      color: 'red'
    HipChat.log "log command: `ssh gateway.code.org ssh production-daemon cat #{log_path}`"
    HipChat.log "/quote #{File.read(log_path)}"
    success = false
  end

  puts IO.read log_path
  success
end
