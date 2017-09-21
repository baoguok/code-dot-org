require 'cdo/school_autocomplete'

# Preload the SchoolAutocomplete singleton instance.
# Skip if this is running a Rake task (e.g. rake db:setup) or when caching is disabled

unless File.basename($0) == 'rake'
  unless Rails.application.config.skip_preload_schools
    startTime = Time.now
    SchoolAutocomplete.instance
    CDO.log.info "Preloaded schools in #{Time.now - startTime} second(s)"
  end
end
