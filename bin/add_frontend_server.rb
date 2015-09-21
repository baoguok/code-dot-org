require 'aws-sdk'
require_relative '../deployment'
require 'net/ssh'
require 'net/scp'
require 'io/console'
require 'json'
require 'etc'

MAX_WAIT_TIME = 600 #Wait no longer than 10 minutes for instance creation. Typically this takes a couple minutes

# Executes an arbitrary command on an ssh channel, prints the output to console, bails out if the command fails
# channel: ssh channel that you get from open_channel
# command: Command to execute on the remote host
# exit_error_string: Error message to throw if the command exits with something other than 1
def execute_ssh_on_channel(channel, command, exit_error_string)
  channel.exec(command) do |ch|
    ch.on_data do |_, data|
      $stdout.print data
    end

    ch.on_extended_data do |_, _, data|
      $stderr.print data
    end

    ch.on_request 'exit-status' do |_, data|
      if data.read_long != 0
        throw exit_error_string
      end
    end
  end

end

options = {}

OptionParser.new do |opts|
  opts.on('-e', '--environment ENVIRONMENT', 'Environment to add frontend to') do |env|
    options['environment'] = env
  end

  opts.on('-h', '--help', 'Print this') { puts options; exit }
end.parse!

raise OptionParser::MissingArgument, 'Environment is required' if options['environment'].nil?

puts 'Type in your password for gateway.code.org'
password = STDIN.noecho(&:gets).chomp
username = Etc.getlogin

Net::SSH.start('gateway.code.org', username, :password => password) do |ssh|
  puts ssh.exec!('echo \'Verifying connection to gateway\'')
end

ec2client = Aws::EC2::Client.new

instances = ec2client.describe_instances

#Determine distribution of availability zones, pick the one that has the least capacity among frontend instances
frontend_instances = instances.reservations.map do |reservation|
  reservation.instances.select{|instance| instance.state.code == 16 && instance.tags.detect{|tag| tag.key == 'Name' && tag.value.include?('frontend')}}
  #Code 16 = Instance running as per documentation - http://docs.aws.amazon.com/AWSEC2/latest/CommandLineReference/ApiReference-cmd-DescribeInstanceStatus.html
end

frontend_instances.flatten!

instance_distribution = frontend_instances.each_with_object(Hash.new(0)){|(instance, _), instance_distribution| instance_distribution[instance.placement.availability_zone] += 1}
determined_instance_zone, instance_count = instance_distribution.min_by{|_, v| v}

puts "Using underscaled instance zone #{determined_instance_zone}"

instance_name = "frontend-#{determined_instance_zone[-1, 1] + (instance_count + 1).to_s}"

puts "Naming instance #{instance_name}, verifying that the name is okay"

Net::SSH.start('gateway.code.org', username, :password => password) do |ssh|
  node_list = ssh.exec!("knife node list | egrep \'^#{instance_name}$\'")

  unless node_list.nil?
    throw 'Node name is currently in use. This should never happen - see if the host exists in EC2'
  end

  client_list = ssh.exec!("knife client list | egrep \'^#{instance_name}$\'")

  unless client_list.nil?
    throw 'Client name is in use and is likely stale. Please log into gateway and delete the client, then rerun this command'
  end

end

puts "Name #{instance_name} is okay, creating frontend server"

run_instance_response = ec2client.run_instances ({
                                                    dry_run: false,
                                                    key_name: 'server_access_key',
                                                    min_count: 1,
                                                    max_count: 1,
                                                    image_id: 'ami-d05e75b8',  #Image ID for ubuntu instance we use
                                                    instance_type: 'c3.8xlarge',
                                                    monitoring: {
                                                        enabled: true
                                                    },
                                                    disable_api_termination: true, #Prevent against accidental termination
                                                    placement: {
                                                        availability_zone: determined_instance_zone
                                                    },
                                                    block_device_mappings: [
                                                        {
                                                            device_name: '/dev/sda1',
                                                            ebs: {
                                                                volume_size: 128,
                                                                delete_on_termination: true,
                                                                volume_type: 'gp2',
                                                            },
                                                        },
                                                    ],
                                                    security_groups: ['pegasus'],
                                                })

instance_id = run_instance_response.instances[0].instance_id

puts "Looking for instance id  #{instance_id}"

started_at = Time.now
ec2client.wait_until(:instance_running, instance_ids: [instance_id]) do |waiting|
  waiting.max_attempts = nil

  waiting.before_wait do |attempts, response|
    if Time.now - started_at > MAX_WAIT_TIME
      puts "Instance #{instance_id} still not created. Giving up - check the EC2 console and see if there's an error."
      exit(1)
    end
  end
end

puts "Instance #{instance_id} is now running, waiting for status checks to complete"

started_at = Time.now

ec2client.wait_until(:instance_status_ok, instance_ids: [instance_id]) do |waiting|
  waiting.max_attempts = nil

  waiting.before_wait do |attempts, response|
    if Time.now - started_at > MAX_WAIT_TIME
      puts "Instance #{instance_id} was created but has not passed status checks. Check EC2 console."
      exit(1)
    end
  end
end

puts "Instance #{instance_id} is healthy - adding to list of frontends for environment #{options['environment']}"

#Tag the instance with a name.
ec2client.create_tags({
                          resources: [instance_id],
                          tags: [
                              {
                                  key: 'Name',
                                  value: instance_name,
                              },
                          ],
                      })

puts "Created instance #{instance_id} with name #{instance_name}"

private_dns_name = ec2client.describe_instances({instance_ids: [instance_id],}).reservations[0].instances[0].private_dns_name

puts "Private DNS name #{private_dns_name}"

puts 'Writing new configuration file'

Net::SSH.start('gateway.code.org', username, :password => password) do |ssh|
  ssh.exec!("knife environment show #{options['environment']} -F json > /tmp/old_knife_config")
end

Net::SCP.download!('gateway.code.org', username, '/tmp/old_knife_config', '/tmp/knife_config', :ssh => { :password => password })

configuration_json = JSON.parse(File.read('/tmp/knife_config'))
configuration_json['override_attributes']['cdo-secrets']['app_servers'] ||= {}
configuration_json['override_attributes']['cdo-secrets']['app_servers'][instance_name] = private_dns_name

File.open('/tmp/new_knife_config.json', 'w') do |f|
  f.write(JSON.dump(configuration_json))
end

Net::SCP.upload!('gateway.code.org', username, '/tmp/new_knife_config.json', '/tmp/new_knife_config.json', :ssh => { :password => password })
puts 'New configuration file written.'

Net::SSH.start('gateway.code.org', username, :password => password) do |ssh|

  ssh.open_channel do |ch|
    execute_ssh_on_channel(ch,
                           "knife environment from file /tmp/new_knife_config.json",
                           'Unable to edit the configuration from file - log into gateway and look at the config file generated')
    ch.exec('rm /tmp/old_knife_config')
    ch.exec('rm /tmp/new_knife_config.json')

    # Commented out for now - bootstrapping will still be done manually
    #
    # execute_ssh_on_channel(ch,
    #                        "knife bootstrap #{private_dns_name} -x ubuntu --sudo -E production -N #{instance_name} -r role[front-end]",
    #                        "Unable to bootstrap instance #{instance_name} - log into gateway and retry bootstrapping.")
    #
    # execute_ssh_on_channel(ch,
    #                        "ssh production-daemon 'sudo chef-client'",
    #                        'Unable to run chef-client on production daemon')
  end
end
