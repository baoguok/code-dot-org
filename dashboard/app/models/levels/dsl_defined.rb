# == Schema Information
#
# Table name: levels
#
#  id                    :integer          not null, primary key
#  game_id               :integer
#  name                  :string(255)      not null
#  created_at            :datetime
#  updated_at            :datetime
#  level_num             :string(255)
#  ideal_level_source_id :integer
#  user_id               :integer
#  properties            :text(65535)
#  type                  :string(255)
#  md5                   :string(255)
#  published             :boolean          default(FALSE), not null
#  notes                 :text(65535)
#  audit_log             :text(65535)
#
# Indexes
#
#  index_levels_on_game_id  (game_id)
#  index_levels_on_name     (name)
#

# Levels defined using a text-based ruby DSL syntax.
# See #BaseDSL for the DSL format implementation.
class DSLDefined < Level
  include Seeded
  after_destroy :delete_level_file

  def dsl_default
    "Enter the level definition here.\n"
  end

  def self.setup(data)
    level = find_or_create_by({name: data[:name]})
    level.send(:write_attribute, 'properties', {})

    level.update!(name: data[:name], game_id: Game.find_by(name: to_s).id, properties: data[:properties])

    level
  end

  def self.dsl_class
    "#{self}DSL".constantize
  end

  # Use DSL class to parse file
  def self.parse_file(filename, name=nil)
    parse(File.read(filename), filename, name)
  end

  # Use DSL class to parse string
  def self.parse(str, filename, name=nil)
    dsl_class.parse(str, filename, name)
  end

  def self.create_from_level_builder(params, level_params, old_name = nil)
    text = level_params[:dsl_text] || params[:dsl_text]
    transaction do
      # Parse data, save updated level data to database
      data, i18n = dsl_class.parse(text, '')
      level_params.delete(:name)
      level_params.delete(:type) if data[:properties][:type]
      data[:properties].merge! level_params

      if old_name && data[:name] != old_name
        raise "Renaming of DSLDefined levels is not allowed: '#{old_name}' --> '#{data[:name]}'"
      end

      level = setup data

      # Save updated level data to external files
      if Rails.application.config.levelbuilder_mode
        level.rewrite_dsl_file(text)
        rewrite_i18n_file(i18n)
      end

      level
    end
  end

  # Write the specified text to the dsl level definition file for this level.
  def rewrite_dsl_file(text)
    File.write(file_path, (encrypted ? encrypted_dsl_text(text) : text))
  end

  def self.rewrite_i18n_file(i18n)
    # Rewrite autogenerated 'dsls.en.yml' i18n file with new master-copy English strings
    yml_file = Rails.root.join("config/locales/dsls.en.yml")
    i18n_strings = File.exist?(yml_file) ? YAML.load_file(yml_file) : {}
    # Overwrite existing string keys with their new values
    i18n_strings.deep_merge! i18n
    i18n_warning = "# Autogenerated English-language level-definition locale file. Do not edit by hand or commit to version control.\n"
    File.write(yml_file, i18n_warning + i18n_strings.deep_sort.to_yaml(line_width: -1))
  end

  def filename
    return nil if name.blank?
    # Find a file in config/scripts/**/*.[class]* containing the string "name '[name]'"
    grep_string = "grep -lir \"name '#{name}'\" --include=*.#{self.class.to_s.underscore}* config/scripts --color=never"
    `#{grep_string}`.chomp.presence || "config/scripts/#{name.parameterize.underscore}.#{self.class.to_s.underscore}"
  end

  def file_path
    return nil if filename.blank?
    Rails.root.join filename
  end

  def encrypted_dsl_text(dsl_text)
    ["name '#{name}'",
     "encrypted '#{Encryption.encrypt_object(dsl_text)}'"].join("\n")
  end

  def self.decrypt_dsl_text_if_necessary(dsl_text)
    if dsl_text =~ /^encrypted '(.*)'$/m
      begin
        return Encryption.decrypt_object($1)
      rescue Exception
        # just return the encrypted text
      end
    end
    return dsl_text
  end

  def clone_with_name(new_name)
    raise "A level named '#{new_name}' already exists" if Level.find_by_name(new_name)
    old_dsl = dsl_text
    new_dsl = old_dsl.try(:sub, "name '#{name}'", "name '#{new_name}'")

    # raises unless the name is formatted with single, non-curly quotes, e.g.:
    # name 'level-name', or the dsl_text is entirely blank as during unit tests
    raise "name not formatted correctly in dsl text for level: '#{name}'" if old_dsl && old_dsl == new_dsl

    level_params = {}
    level_params[:encrypted] = encrypted if encrypted
    self.class.create_from_level_builder({dsl_text: new_dsl}, level_params) if new_dsl
  end

  def dsl_text
    self.class.decrypt_dsl_text_if_necessary(File.read(file_path)) if file_path && File.exist?(file_path)
  end

  def assign_attributes(params)
    if params[:dsl_text].present?
      self.class.create_from_level_builder({dsl_text: params.delete(:dsl_text)}, params, name)
    else
      super(params)
    end
  end

  def encrypted
    properties['encrypted'].present? && properties['encrypted'] != "false"
  end

  def encrypted=(value)
    properties['encrypted'] = value
  end

  # don't allow markdown in DSL levels unless child class overrides this
  def supports_markdown?
    false
  end

  private

  def delete_level_file
    File.delete(file_path) if File.exist?(file_path)
  end
end

# The following capitalization variant is needed so that annotate_models
# is able to find the model class.
DslDefined = DSLDefined
