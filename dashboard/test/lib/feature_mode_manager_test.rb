require 'test_helper'
require 'cdo/script_config'
require 'feature_mode_manager'

class FeatureModeManagerTest < ActiveSupport::TestCase
  def setup
    @gatekeeper = GatekeeperBase.create
    @dcdo = DCDOBase.create
  end

  # Verify that after setting each of the possible modes that the
  # feature mode manager knows we are in that mode.
  def test_round_trip_feature_modes
    scripts = ['fake1', 'fake2']
    %w{normal scale emergency}.each do |mode|
      FeatureModeManager.set_mode(mode, @gatekeeper, @dcdo, scripts)
      assert_equal mode, FeatureModeManager.get_mode(@gatekeeper, @dcdo, scripts)
    end
  end

  def test_get_mode_returns_nil_if_dcdo_property_does_not_match
    scripts = ['fake1', 'fake2']
    FeatureModeManager.set_mode('normal', @gatekeeper, @dcdo, scripts)
    @dcdo.set('hoc_activity_sample_weight', 2)
    assert_equal nil, FeatureModeManager.get_mode(@gatekeeper, @dcdo, scripts)
    # Set the DCDO property back to the original value and make sure we're in normal mode.
    @dcdo.set('hoc_activity_sample_weight', 1)
    assert_equal 'normal', FeatureModeManager.get_mode(@gatekeeper, @dcdo, scripts)
  end

  def test_get_mode_returns_nil_if_gatekeeper_property_does_not_match
    scripts = ['fake1', 'fake2']
    FeatureModeManager.set_mode('normal', @gatekeeper, @dcdo, scripts)
    @gatekeeper.set('postMilestone', where: {script_name: 'fake1'}, value: false)
    assert_equal nil, FeatureModeManager.get_mode(@gatekeeper, @dcdo, scripts)
    @gatekeeper.set('postMilestone', where: {script_name: 'fake1'}, value: true)
    assert_equal 'normal', FeatureModeManager.get_mode(@gatekeeper, @dcdo, scripts)
  end

  def test_normal_mode
    scripts = ScriptConfig.cached_scripts
    FeatureModeManager.set_mode('normal', @gatekeeper, @dcdo, scripts)
    scripts.each do |script|
      assert @gatekeeper.allows('postMilestone', where: {script_name: script})
      assert @gatekeeper.allows('shareEnabled', where: {script_name: script})
      assert @gatekeeper.allows('puzzle_rating', where: {script_name: script})
      assert @gatekeeper.allows('hint_view_request', where: {script_name: script})
    end

    assert_equal 1, @dcdo.get('hoc_activity_sample_weight', nil).to_i
  end

  def test_scale_mode
    scripts = ScriptConfig.cached_scripts
    FeatureModeManager.set_mode('scale', @gatekeeper, @dcdo, scripts)
    scripts.each do |script|
      refute @gatekeeper.allows('postMilestone', where: {script_name: script})
      assert @gatekeeper.allows('shareEnabled', where: {script_name: script})
      refute @gatekeeper.allows('puzzle_rating', where: {script_name: script})
      refute @gatekeeper.allows('hint_view_request', where: {script_name: script})
    end

    assert_equal 10, @dcdo.get('hoc_activity_sample_weight', nil).to_i
  end

  def test_emergency_mode
    scripts = ScriptConfig.cached_scripts
    FeatureModeManager.set_mode('emergency', @gatekeeper, @dcdo, scripts)
    scripts.each do |script|
      refute @gatekeeper.allows('postMilestone', where: {script_name: script})
      refute @gatekeeper.allows('shareEnabled', where: {script_name: script})
      refute @gatekeeper.allows('puzzle_rating', where: {script_name: script})
      refute @gatekeeper.allows('hint_view_request', where: {script_name: script})
    end

    assert_equal 10, @dcdo.get('hoc_activity_sample_weight', nil).to_i
  end

end
