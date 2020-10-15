class LessonsController < ApplicationController
  load_and_authorize_resource

  before_action :require_levelbuilder_mode, except: [:show]
  before_action :disallow_legacy_script_levels, only: [:edit, :update]

  # Script levels which are not in activity sections will not show up on the
  # lesson edit page, in which case saving the edit page would cause those
  # script levels to be lost. Prevent this by disallowing editing in this case.
  # This helps avoid losing data from existing scripts by accidentally editing
  # them with the new lessons editor on levelbuilder.
  def disallow_legacy_script_levels
    return if [:development, :adhoc].include? rack_env
    return unless @lesson.script_levels.reject(&:activity_section).any?
    raise CanCan::AccessDenied.new(
      "cannot edit lesson #{@lesson.id} because it contains legacy script levels"
    )
  end

  # GET /lessons/1
  def show
    @lesson_data = {
      title: @lesson.localized_title,
      overview: @lesson.overview,
      announcements: @lesson.announcements,
      purpose: @lesson.purpose,
      preparation: @lesson.preparation
    }
  end

  # GET /lessons/1/edit
  def edit
    @lesson_data = @lesson.summarize_for_lesson_edit
  end

  # PATCH/PUT /lessons/1
  def update
    @lesson.update!(lesson_params)
    @lesson.update_activities(JSON.parse(params[:activities])) if params[:activities]

    redirect_to lesson_path(id: @lesson.id)
  end

  private

  def lesson_params
    # Convert camelCase params to snake_case. Right now this only works on
    # top-level key names. This lets us do the transformation before calling
    # .permit, so that we can use snake_case key names in our parameter list,
    # because transform_keys returns a params object while deep_transform_keys
    # returns a plain Hash.
    lp = params.transform_keys(&:underscore)

    # for now, only allow editing of fields that cannot be edited on the
    # script edit page.
    lp = lp.permit(
      :overview,
      :student_overview,
      :assessment,
      :unplugged,
      :creative_commons_license,
      :lockable,
      :purpose,
      :preparation,
      :announcements
    )
    lp[:announcements] = JSON.parse(lp[:announcements]) if lp[:announcements]
    lp
  end
end
