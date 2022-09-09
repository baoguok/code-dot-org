module Services
  # A module to assist with providing globally-unique identifiers for models
  # whose unique identifiers are only unique within the context of a given
  # relationship.
  module GloballyUniqueIdentifiers
    # Simple helper which builds out a regex from the given models. Requires
    # that the models define a KEY_CHAR_RE which can be used to identify valid
    # `key` values for the model.
    #
    # Specifically, given Bar and Baz, we will get a regex which matches
    # strings of the form `bar_key/baz_key`
    def self.build_key_re(models)
      keys = models.map do |model|
        "(?<#{model.name.demodulize}>#{model::KEY_CHAR_RE}+)"
      end
      return Regexp.new(keys.join('/'))
    end

    # Returns a key which can be used by to globally and uniquely identify the
    # given Vocabulary object
    #
    # @see GloballyUniqueIdentifiers.find_vocab
    def self.build_vocab_key(vocab)
      if vocab&.course_version&.course_offering.blank?
        STDERR.puts "Vocabulary object #{vocab.key.inspect} is missing course version and/or offering"
        return
      end

      [vocab.key, vocab.course_version.course_offering.key, vocab.course_version.key].join('/')
    end

    # Returns a regular expression which can be used to match the keys
    # generated by build_vocab_key.
    def self.vocab_key_re
      @@vocab_key_re ||= build_key_re([Vocabulary, CourseOffering, CourseVersion])
    end

    # Returns the Vocabulary object identified by the given globally-unique key
    #
    # @see GloballyUniqueIdentifiers.build_vocab_key
    def self.find_vocab(key)
      result = vocab_key_re.match(key)
      return if result.blank?

      keys = result.named_captures
      course_version = CourseVersion.joins(:course_offering).
        find_by(key: keys["CourseVersion"], "course_offerings.key": keys["CourseOffering"])
      return Vocabulary.find_by(key: keys["Vocabulary"], course_version: course_version)
    end

    # Returns a key which can be used by to globally and uniquely identify the
    # given Resource object
    #
    # @see GloballyUniqueIdentifiers.find_resource
    def self.build_resource_key(resource)
      if resource&.course_version&.course_offering.blank?
        STDERR.puts "Resource object #{resource.key.inspect} is missing course version and/or offering"
        return
      end

      [resource.key, resource.course_version.course_offering.key, resource.course_version.key].join('/')
    end

    # Returns a regular expression which can be used to match the keys
    # generated by build_resource_key.
    def self.resource_key_re
      @@resource_key_re ||= build_key_re([Resource, CourseOffering, CourseVersion])
    end

    # Returns the Resource object identified by the given globally-unique key
    #
    # @see GloballyUniqueIdentifiers.build_resource_key
    def self.find_resource(key)
      result = resource_key_re.match(key)
      return if result.blank?

      keys = result.named_captures
      course_version = CourseVersion.joins(:course_offering).
        find_by(key: keys["CourseVersion"], "course_offerings.key": keys["CourseOffering"])
      return Resource.find_by(key: keys["Resource"], course_version: course_version)
    end

    # Returns a key which can be used by to globally and uniquely identify the
    # given Lesson object
    #
    # Note that currently, this is a one-way only process; we do not yet have a
    # way of finding lessons by this key because we do not yet have a way of
    # building the regular expression because neither scripts nor lessons have
    # expression validation for their relevant identifiers.
    def self.build_lesson_key(lesson)
      return if lesson&.script.blank?
      [lesson.script.name, lesson.key].join('/')
    end
  end
end
