class Ability
  include CanCan::Ability

  def initialize(user)
    # Define abilities for the passed in user here. For example:
    #
    user ||= User.new # guest user (not logged in)
    if user.admin?
      can :manage, :all

      # Only custom levels and match/multi are editable
      cannot [:update, :destroy], Level do |level|
        !(level.custom? || level.is_a?(DSLDefined))
      end
    else
      can :read, :all
      cannot :read, [
        PrizeProvider,
        Prize,
        TeacherPrize,
        TeacherBonusPrize,
        LevelSourceHint,
        FrequentUnsuccessfulLevelSource,
        :reports,
        User,
        Follower,
        # Ops models
        District,
        Workshop,
        Cohort,
        WorkshopAttendance
      ]
    end

    if user.id
      can :manage, user

      # TODO a bunch of these should probably be limited by user_id
      can :create, Activity
      can :save_to_gallery, Activity, user_id: user.id
      can :create, GalleryActivity, user_id: user.id
      can :destroy, GalleryActivity, user_id: user.id
      can :create, UserLevel
      can :create, Follower, student_user_id: user.id
      can :destroy, Follower, student_user_id: user.id

      if user.hint_access? || user.teacher?
        can :manage, [LevelSourceHint, FrequentUnsuccessfulLevelSource]
      end

      if user.teacher?
        can :manage, Section, user_id: user.id
        can :manage, :teacher
        can :manage, user.students
        can :manage, Follower
        can :read, Workshop
      end

      if user.permission? 'facilitator'
        can :read, Workshop
        can :teachers, Workshop
        # Allow facilitator to manage Workshop/Attendance for
        # workshops in which they are a facilitator.
        can :manage, WorkshopAttendance do |attendance|
          attendance.segment.workshop.facilitators.include? user
        end
        can :manage, Workshop do |workshop|
          workshop.facilitators.include? user
        end
      end

      if user.permission? 'district_contact'
        can :teachers, District
        can [:cohort, :teacher], WorkshopAttendance
      end
    end

    #
    # The first argument to `can` is the action you are giving the user
    # permission to do.
    # If you pass :manage it will apply to every action. Other common actions
    # here are :read, :create, :update and :destroy.
    #
    # The second argument is the resource the user can perform the action on.
    # If you pass :all it will apply to every resource. Otherwise pass a Ruby
    # class of the resource.
    #
    # The third argument is an optional hash of conditions to further filter the
    # objects.
    # For example, here the user can only update published articles.
    #
    #   can :update, Article, :published => true
    #
    # See the wiki for details:
    # https://github.com/ryanb/cancan/wiki/Defining-Abilities
  end
end
