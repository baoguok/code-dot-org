require 'cdo/db'
require 'cdo/properties'

class Tutorials

  def initialize(table)
    @table = table
  end

  def launch_url_for(code,domain)
    return DB[:beyond_tutorials].where(code:code).first[:url] if @table == :beyond_tutorials

    api_domain = domain.gsub('csedweek.org','code.org')
    api_domain = api_domain.gsub('al.code.org','code.org')
    api_domain = api_domain.gsub('ar.code.org','code.org')
    api_domain = api_domain.gsub('br.code.org','code.org')
    api_domain = api_domain.gsub('eu.code.org','code.org')
    api_domain = api_domain.gsub('ro.code.org','code.org')
    api_domain = api_domain.gsub('uk.code.org','code.org')
    api_domain = api_domain.gsub('za.code.org','code.org')
    "http://#{api_domain}/api/hour/begin/#{code}"
  end

  def find_with_tag(tag)
    results = {}
    DB[@table].all.each do |i|
      tags = CSV.parse_line(i[:tags].to_s)
      next unless tags.include?(tag)
      results[i[:code]] = i
    end
    results
  end

  def find_with_tag_and_language(tag, language)
    results = {}
    DB[@table].all.each do |i|
      tags = CSV.parse_line(i[:tags].to_s)
      next unless tags.include?(tag)

      languages = CSV.parse_line(i[:languages_supported].to_s)
      next unless languages.nil_or_empty? || languages.include?(language) || languages.include?(language[0,2])

      results[i[:code]] = i
    end
    results
  end
end

def event_whitelisted?(name, type)
  DB[:cdo_events_whitelist].where(organization_name_s:name.to_s.strip).and(event_type_s:type).count == 0
end

def country_from_code(code)
  DB[:geography_countries].where(code_s:code.to_s.strip.upcase).first
end
def country_name_from_code(code)
  country = country_from_code(code)
  return code unless country
  country[:name_s]
end
def no_credit_count
  DB[:cdo_state_promote].where(cs_counts_t:'No').exclude(state_code_s:'DC').count
end
def credit_count
  50 - no_credit_count
end
def us_state_from_code(code)
  DB[:geography_us_states].where(code_s:code.to_s.strip.upcase).first
end
def us_state_code?(code)
  !us_state_from_code(code).nil?
end
def us_state_name_from_code(code)
  state = us_state_from_code(code)
  return code unless state
  state[:name_s]
end

def zip_code_from_code(code)
  DB[:geography_us_zip_codes].where(code_s:code.to_s.strip).first
end
def zip_code?(code)
  !zip_code_from_code(code).nil?
end

require 'cdo/geocoder'

def search_for_address(address)
  sleep(0.01)
  Geocoder.search(address).first
end

def geocode_address(address)
  location = search_for_address(address)
  return nil unless location
  return nil unless location.latitude && location.longitude
  "#{location.latitude},#{location.longitude}"
end

def geocode_ip_address(ip_address)
  geocode_address(ip_address)
end

def geocode_zip_code(code)
  zip_code = zip_code_from_code(code)
  return nil unless zip_code
  return nil unless zip_code[:latitude_f] && zip_code[:longitude_f]
  "#{zip_code[:latitude_f]},#{zip_code[:longitude_f]}"
end


require 'securerandom'
require 'json'

class Form2 < OpenStruct

  def initialize(params={})
    params = params.dup
    params[:data] = JSON.load(params[:data])
    params[:processed_data] = JSON.load(params[:processed_data])
    super params
  end

  def self.from_row(row)
    return nil unless row
    self.new row
  end

end
