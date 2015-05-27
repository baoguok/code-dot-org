module SerializedProperties
  extend ActiveSupport::Concern
  included do
    serialize :properties, JSON
    class_attribute :serialized_properties
    self.serialized_properties ||= {}

    after_initialize :init_properties
    before_save { properties.select! { |_, v| v.present? } }
  end

  def assign_attributes(new_attributes)
    init_properties
    attributes = new_attributes.stringify_keys
    new_properties = attributes.delete('properties').try(:stringify_keys!)
    super(attributes)
    # If the properties hash is explicitly assigned then merge its keys with existing properties
    # instead of replacing the entire hash
    super(properties: properties.merge(new_properties)) if new_properties
  end

  def init_internals
    self.class.init_internals
    super
  end

  module ClassMethods
    def sti_hierarchy
      classes = []
      clazz = self
      while clazz != ActiveRecord::Base
        classes << clazz
        clazz = clazz.superclass
      end
      classes
    end

    def serialized_attrs(*args)
      (serialized_properties[self.to_s] ||= []).concat args
    end

    def init_internals
      sti_hierarchy.map { |x| serialized_properties[x.to_s] || [] }.flatten.each do |property|
        define_method(property) { read_attribute('properties')[property.to_s] }
        define_method("#{property}?") { read_attribute('properties')[property.to_s] }
        define_method("#{property}=") { |value| read_attribute('properties')[property.to_s] = value }
      end
    end
  end

  private
  def init_properties
    write_attribute('properties', {}) unless read_attribute('properties')
  end

end
