# Retrieves, parses and summarizes Foorm Survey results for consumption by APIs.
module Pd::Foorm
  class SurveyResults
    extend Helper
    include Constants

    # Calculates survey summary for a given workshop id. Will return object of
    # {
    #        course_name: 'CS Principles',
    #        questions: <parsed form, see FoormParser>,
    #        this_workshop: <summarized survey answers, see WorkshopSummarizer>
    #      }
    def self.get_summary_for_workshop(workshop_id)
      return unless workshop_id

      # get workshop metadata
      ws_data = Pd::Workshop.find(workshop_id)
      # get survey results and surveys for the workshop
      ws_submissions, form_submissions, forms = get_raw_data_for_workshop(workshop_id)

      # parse Foorm::Forms into format more usable by summarizer and friendlier for sending on
      parsed_forms = Pd::Foorm::FoormParser.parse_forms(forms)
      # summarize survey results by day and question
      summarized_answers = Pd::Foorm::WorkshopSummarizer.summarize_answers_by_survey(form_submissions, parsed_forms, ws_submissions)

      {
        course_name: ws_data.course,
        questions: parsed_forms,
        this_workshop: summarized_answers
      }
    end

    # TODO: add rollups
    # def self.get_rollup_for_workshop(workshop_id)
    # end

    # TODO: once we store facilitator data
    # def self.get_rollup_for_facilitator(workshop_id, facilitator_id)
    # end

    # given a workshop id, get the raw data needed for summarizing workshop survey results.
    # Will return an array of [WorkshopSurveyFoormSubmissions, FoormSubmissions and FoormForms]
    # for the given workshop id.
    def self.get_raw_data_for_workshop(workshop_id)
      ws_submissions = Pd::WorkshopSurveyFoormSubmission.where(pd_workshop_id: workshop_id)

      submission_ids = ws_submissions.pluck(:foorm_submission_id)
      foorm_submissions = submission_ids.empty? ? [] : ::Foorm::Submission.find(submission_ids)
      form_names_versions = foorm_submissions.pluck(:form_name, :form_version).uniq
      forms = []
      form_names_versions.each do |name, version|
        form = ::Foorm::Form.where(name: name, version: version).first
        forms << form if form
      end

      [ws_submissions, foorm_submissions, forms]
    end
  end
end
