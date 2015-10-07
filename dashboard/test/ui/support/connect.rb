require 'selenium/webdriver'
require 'cgi'
require 'httparty'

$browser_configs = JSON.load(open("browsers.json"))

MAX_CONNECT_RETRIES = 3

def local_browser
  browser = Selenium::WebDriver.for :chrome, url: "http://127.0.0.1:9515"
  if ENV['MAXIMIZE_LOCAL'] == 'true'
    max_width, max_height = browser.execute_script("return [window.screen.availWidth, window.screen.availHeight];")
    browser.manage.window.resize_to(max_width, max_height)
  end
  browser
end

def saucelabs_browser
  if CDO.saucelabs_username.blank?
    raise "Please define CDO.saucelabs_username"
  end

  if CDO.saucelabs_authkey.blank?
    raise "Please define CDO.saucelabs_authkey"
  end

  url = "http://#{CDO.saucelabs_username}:#{CDO.saucelabs_authkey}@ondemand.saucelabs.com:80/wd/hub"

  capabilities = Selenium::WebDriver::Remote::Capabilities.new
  browser_config = $browser_configs.detect {|b| b['name'] == ENV['BROWSER_CONFIG'] }

  browser_config.each do |key, value|
    capabilities[key] = value
  end

  capabilities[:javascript_enabled] = 'true'
  capabilities[:name] = ENV['TEST_RUN_NAME']
  capabilities[:build] = ENV['BUILD']

  puts "DEBUG: Capabilities: #{CGI::escapeHTML capabilities.inspect}"

  browser = nil
  Time.now.to_i.tap do |start_time|
    retries = 0
    begin
      browser = Selenium::WebDriver.for(:remote,
                                        url: url,
                                        desired_capabilities: capabilities,
                                        http_client: Selenium::WebDriver::Remote::Http::Default.new.tap{|c| c.timeout = 5.minutes}) # iOS takes more time
    rescue URI::InvalidURIError, Net::ReadTimeout
      raise if retries >= MAX_CONNECT_RETRIES
      retries += 1
      retry
    end
    puts "DEBUG: Got browser in #{Time.now.to_i - start_time}s with #{retries} retries"
  end

  puts "DEBUG: Browser: #{CGI::escapeHTML browser.inspect}"

  # Maximize the window on desktop, as some tests require 1280px width.
  unless ENV['MOBILE']
    max_width, max_height = browser.execute_script("return [window.screen.availWidth, window.screen.availHeight];")
    browser.manage.window.resize_to(max_width, max_height)
  end

  # let's allow much longer timeouts when searching for an element
  browser.manage.timeouts.implicit_wait = 2.minutes
  browser.send(:bridge).setScriptTimeout(1.minute * 1000)

  browser
end

def get_browser
  if ENV['TEST_LOCAL'] == 'true'
    # This drives a local installation of ChromeDriver running on port 9515, instead of Saucelabs.
    local_browser
  else
    saucelabs_browser
  end
end


browser = nil

Before do
  puts "DEBUG: browser == #{CGI::escapeHTML browser.inspect} @browser == #{CGI::escapeHTML @browser.inspect}"

  browser ||= get_browser
  @browser = browser
  @browser.manage.delete_all_cookies

  debug_cookies(@browser.manage.all_cookies) if @browser

  unless ENV['TEST_LOCAL'] == 'true'
    unless @sauce_session_id
      @sauce_session_id = @browser.send(:bridge).capabilities["webdriver.remote.sessionid"]
      visual_log_url = 'https://saucelabs.com/tests/' + @sauce_session_id
      puts "visual log on sauce labs: <a href='#{visual_log_url}'>#{visual_log_url}</a>"
    end
  end
end

def log_result(result)
  return if ENV['TEST_LOCAL'] == 'true' || @sauce_session_id

  url = "https://#{CDO.saucelabs_username}:#{CDO.saucelabs_authkey}@saucelabs.com/rest/v1/#{CDO.saucelabs_username}/jobs/#{@sauce_session_id}"
  HTTParty.put(url,
               body: {"passed" => result}.to_json,
               headers: {'Content-Type' => 'application/json'})
end

all_passed = true

# Do something after each scenario.
# The +scenario+ argument is optional, but
# if you use it, you can inspect status with
# the #failed?, #passed? and #exception methods.

After do |scenario|
  all_passed = all_passed && scenario.passed?
  log_result all_passed
end

at_exit do
  browser.quit unless browser.nil?
end
