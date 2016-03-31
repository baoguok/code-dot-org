# Run 'rake' or 'rake -D' to get a list of valid Rake commands with descriptions.

require_relative './deployment'
require 'os'
require 'cdo/hip_chat'
require 'cdo/rake_utils'
require 'cdo/aws/s3_packaging'
Dir.glob('lib/rake/*.rake').delete_if{|rake| rake.include? 'generate_pdfs'}.each{|rake| import rake}

# Whether this is a local or adhoc environment where we should install npm and create
# a local database.
def local_environment?
  (rack_env?(:development, :test) && !CDO.chef_managed) || rack_env?(:adhoc)
end

def install_npm
  # Temporary workaround to play nice with nvm-managed npm installation.
  # See discussion of a better approach at https://github.com/code-dot-org/code-dot-org/pull/4946
  return if RakeUtils.system_('which npm') == 0

  if OS.linux?
    RakeUtils.system 'sudo apt-get install -y nodejs npm'
    RakeUtils.system 'sudo ln -s -f /usr/bin/nodejs /usr/bin/node'
    RakeUtils.system 'sudo npm install -g npm@2.9.1'
    RakeUtils.npm_install_g 'grunt-cli'
  elsif OS.mac?
    RakeUtils.system 'brew install node'
    RakeUtils.system 'npm', 'update', '-g', 'npm'
    RakeUtils.system 'npm', 'install', '-g', 'grunt-cli'
  end
end

task :default do
  puts 'List of valid commands:'
  system 'rake -T'
end
