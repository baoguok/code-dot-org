# == Schema Information
#
# Table name: levels
#
#  id                       :integer          not null, primary key
#  game_id                  :integer
#  name                     :string(255)      not null
#  created_at               :datetime
#  updated_at               :datetime
#  level_num                :string(255)
#  ideal_level_source_id    :integer
#  solution_level_source_id :integer
#  user_id                  :integer
#  properties               :text(65535)
#  type                     :string(255)
#  md5                      :string(255)
#  published                :boolean          default(FALSE), not null
#  notes                    :text(65535)
#
# Indexes
#
#  index_levels_on_game_id  (game_id)
#

class Gamelab < Blockly
  before_save :update_palette

  serialized_attrs %w(
    free_play
    text_mode_at_start
    submittable
    data_properties
    hide_view_data_button
    debugger_disabled
  )

  # List of possible skins, the first is used as a default.
  def self.skins
    ['gamelab']
  end

  def self.create_from_level_builder(params, level_params)
    create!(level_params.merge(
        user: params[:user],
        game: Game.gamelab,
        level_num: 'custom',
        properties: {
          code_functions: JSON.parse(palette),
          edit_code: true
        }
    ))
  end

  def xml_blocks
    %w()
  end

  def update_palette
    if self.code_functions.present? && self.code_functions.is_a?(String)
      self.code_functions = JSON.parse(self.code_functions)
    end
  rescue JSON::ParserError => e
    errors.add(:code_functions, "#{e.class.name}: #{e.message}")
    return false
  end

  def self.palette
    <<-JSON.strip_heredoc.chomp
      {
        // Game Lab
        "fill": null,
        "noFill": null,
        "stroke": null,
        "strokeWeight": null,
        "noStroke": null,
        "arc": null,
        "ellipse": null,
        "line": null,
        "point": null,
        "rect": null,
        "regularPolygon": null,
        "shape": null,
        "text": null,
        "textAlign": null,
        "textFont": null,
        "textSize": null,
        "drawSprites": null,
        "allSprites": null,
        "background": null,
        "width": null,
        "height": null,
        "camera.on": null,
        "camera.off": null,
        "camera.isActive": null,
        "camera.mouseX": null,
        "camera.mouseY": null,
        "camera.position.x": null,
        "camera.position.y": null,
        "camera.zoom": null,
        "playSound": null,

        // Sprites
        "var sprite = createSprite": null,
        "setSpeed": null,
        "getAnimationLabel": null,
        "getDirection": null,
        "getSpeed": null,
        "remove": null,
        "addAnimation": null,
        "addImage": null,
        "addSpeed": null,
        "bounce": null,
        "collide": null,
        "displace": null,
        "overlap": null,
        "changeAnimation": null,
        "changeImage": null,
        "attractionPoint": null,
        "setCollider": null,
        "setVelocity": null,
        "sprite.height": null,
        "sprite.width": null,
        "depth": null,
        "lifetime": null,
        "mirrorX": null,
        "mirrorY": null,
        "nextFrame": null,
        "pause": null,
        "play": null,
        "setFrame": null,
        "sprite.x": null,
        "sprite.y": null,
        "rotateToDirection": null,
        "rotation": null,
        "rotationSpeed": null,
        "scale": null,
        "shapeColor": null,
        "sprite.velocityX": null,
        "sprite.velocityY": null,
        "visible": null,

        // Groups
        "var group = new Group": null,
        "add": null,
        "group.remove": null,
        "clear": null,
        "contains": null,
        "get": null,
        "group.bounce": null,
        "group.collide": null,
        "group.displace": null,
        "group.overlap": null,
        "maxDepth": null,
        "minDepth": null,

        // Input
        "didMouseMove": null,
        "keyDown": null,
        "keyWentDown": null,
        "keyWentUp": null,
        "mouseDown": null,
        "mouseWentDown": null,
        "mouseWentUp": null,
        "mouseX": null,
        "mouseY": null,

        // Control
        "forLoop_i_0_4": null,
        "ifBlock": null,
        "ifElseBlock": null,
        "whileBlock": null,

        // Math
        "addOperator": null,
        "subtractOperator": null,
        "multiplyOperator": null,
        "divideOperator": null,
        "equalityOperator": null,
        "inequalityOperator": null,
        "greaterThanOperator": null,
        "greaterThanOrEqualOperator": null,
        "lessThanOperator": null,
        "lessThanOrEqualOperator": null,
        "andOperator": null,
        "orOperator": null,
        "notOperator": null,
        "randomNumber_min_max": null,
        "mathRound": null,
        "mathAbs": null,
        "mathMax": null,
        "mathMin": null,
        "mathRandom": null,

        // Variables
        "declareAssign_x": null,
        "declareNoAssign_x": null,
        "assign_x": null,
        "declareAssign_str_hello_world": null,
        "substring": null,
        "indexOf": null,
        "includes": null,
        "length": null,
        "toUpperCase": null,
        "toLowerCase": null,
        "declareAssign_list_abd": null,
        "listLength": null,

        // Functions
        "functionParams_none": null,
        "functionParams_n": null,
        "callMyFunction": null,
        "callMyFunction_n": null,
        "return": null
      }
    JSON
  end
end
