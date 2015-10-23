require pegasus_dir 'forms/volunteer_engineer_submission'

class VolunteerEngineerSubmission2015 < VolunteerEngineerSubmission
  def self.normalize(data)
    result = {}

    result[:name_s] = required stripped data[:name_s]
    result[:company_s] = nil_if_empty stripped data[:company_s]
    result[:experience_s] = required data[:experience_s]
    result[:location_s] = required stripped data[:location_s]
    result[:location_flexibility_ss] = required data[:location_flexibility_ss]
    result[:volunteer_after_hoc_b] = nil_if_empty data[:volunteer_after_hoc_b]
    result[:time_commitment_s] = nil_if_empty data[:time_commitment_s]
    result[:linkedin_s] = nil_if_empty stripped data[:linkedin_s]
    result[:facebook_s] = nil_if_empty stripped data[:facebook_s]
    result[:description_s] = required data[:description_s]
    result[:email_s] = required email_address data[:email_s]
    result[:allow_contact_b] = required data[:allow_contact_b]
    result[:unsubscribed_b] = default_if_empty data[:unsubscribed_b], false
    result[:unsubscribe_reason_s] = nil_if_empty data[:unsubscribe_reason_s]
    result[:unsubscribe_details_t] = nil_if_empty stripped data[:unsubscribe_details_t]

    result
  end

  def self.commitments()
    @commitments ||= commitments_with_i18n_labels(
      'annually',
      'monthly',
      'weekly',
      'more',
    )
  end

  def self.locations()
    @locations ||= locations_with_i18n_labels(
      'onsite',
      'remote',
    )
  end

  def self.locations_with_i18n_labels(*locations)
    results = {}
    locations.each do |location|
      results[location] = I18n.t("volunteer_engineer_submission_location_flexibility_#{location}")
    end
    results
  end

  def self.process(data)
    {}.tap do |results|
      location = search_for_address(data['location_s'])
      results.merge! location.to_solr if location
    end
  end

  def self.solr_query(params)
    query = "kind_s:\"#{self.name}\" && allow_contact_b:true && unsubscribed_b:false"

    coordinates = params['coordinates']
    distance = 500
    rows = 500

    fq = ["{!geofilt pt=#{coordinates} sfield=location_p d=#{distance}}"]

    unless params['location_flexibility_ss'].nil_or_empty?
      params['location_flexibility_ss'].each do |location|
        fq.push("location_flexibility_ss:#{location}")
      end
    end

    fq.push("experience_s:#{params['experience_s']}") unless params['experience_s'].nil_or_empty?

    {
      q: query,
      fq: fq,
      facet: true,
      'facet.field'=>['location_flexibility_ss', 'experience_s'],
      rows: rows,
      sort: "name_s asc"
    }
  end
end
