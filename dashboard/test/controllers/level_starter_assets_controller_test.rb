require 'test_helper'

class LevelStarterAssetsControllerTest < ActionController::TestCase
  setup do
    Rails.application.config.stubs(:levelbuilder_mode).returns(true)

    # File must exist in order to use fixture_file_upload below.
    @filename = 'welcome.jpg'
    FileUtils.touch(@filename)

    @file = fixture_file_upload(@filename, 'image/jpg')
  end

  teardown do
    # Clean up file created in setup.
    File.delete(@filename)
  end

  test 'show: returns summary of assets' do
    uuid_name_1 = "#{SecureRandom.uuid}.png"
    key_1 = "starter_assets/#{uuid_name_1}"
    uuid_name_2 = "#{SecureRandom.uuid}.jpg"
    key_2 = "starter_assets/#{uuid_name_2}"
    file_objs = [
      MockS3ObjectSummary.new(key_1, 123, 1.day.ago),
      MockS3ObjectSummary.new(key_2, 321, 2.days.ago)
    ]
    LevelStarterAssetsController.any_instance.
      expects(:get_object).twice.
      returns(file_objs[0], file_objs[1])
    level_starter_assets = {
      'ty.png' => uuid_name_1,
      'welcome.jpg' => uuid_name_2
    }
    level = create(:level, starter_assets: level_starter_assets)

    get :show, params: {level_name: level.name}
    starter_assets = JSON.parse(response.body)['starter_assets']

    assert_equal 2, starter_assets.count
    assert_equal 'ty.png', starter_assets[0]['filename']
    assert_equal 'image', starter_assets[0]['category']
    assert_equal file_objs[0].size, starter_assets[0]['size']
    assert_equal 'welcome.jpg', starter_assets[1]['filename']
    assert_equal 'image', starter_assets[1]['category']
    assert_equal file_objs[1].size, starter_assets[1]['size']
  end

  test 'file: returns requested file' do
    uuid_name = "#{SecureRandom.uuid}.png"
    file_obj = MockS3ObjectSummary.new(uuid_name, 123, 1.day.ago)
    LevelStarterAssetsController.any_instance.
      expects(:get_object).
      with(uuid_name).
      returns(file_obj)
    LevelStarterAssetsController.any_instance.
      expects(:read_file).
      with(file_obj).
      returns('hello, world!')
    level_starter_assets = {
      'ty.png' => uuid_name
    }
    level = create(:level, starter_assets: level_starter_assets)

    get :file, params: {level_name: level.name, filename: 'ty', format: 'png'}

    assert_equal 'hello, world!', response.body
    assert_equal 'image/png', response.headers['Content-Type']
    assert_equal 'inline', response.headers['Content-Disposition']
  end

  test 'upload: forbidden for non-levelbuilders' do
    sign_in create(:student)
    post :upload, params: {level_name: create(:level).name, files: []}
    assert_response :forbidden
  end

  test 'upload: forbidden if not in levelbuilder_mode' do
    Rails.application.config.stubs(:levelbuilder_mode).returns(false)
    sign_in create(:levelbuilder)
    post :upload, params: {level_name: create(:level).name, files: []}
    assert_response :forbidden
  end

  test 'upload: raises an error if 2+ files are uploaded' do
    sign_in create(:levelbuilder)

    e = assert_raises do
      post :upload, params: {level_name: create(:level).name, files: ['file-1', 'file-2']}
    end
    assert_equal 'One file upload expected. Actual: 2', e.message
  end

  test 'upload: returns unprocessable_entity if file fails to upload' do
    file_obj = MockS3ObjectSummary.new('123-abc.jpg', 123, 1.day.ago)
    LevelStarterAssetsController.any_instance.
      expects(:get_object).
      returns(file_obj)
    file_obj.expects(:upload_file).returns(false)

    sign_in create(:levelbuilder)
    post :upload, params: {level_name: create(:level).name, files: [@file]}

    assert_response :unprocessable_entity
  end

  test 'upload: returns unprocessable_entity if file uploads but starter asset is not added' do
    file_obj = MockS3ObjectSummary.new('123-abc.jpg', 123, 1.day.ago)
    LevelStarterAssetsController.any_instance.
      expects(:get_object).
      returns(file_obj)
    file_obj.expects(:upload_file).returns(true)
    Level.any_instance.expects(:save).returns(false)

    sign_in create(:levelbuilder)
    post :upload, params: {level_name: create(:level).name, files: [@file]}

    assert_response :unprocessable_entity
  end

  test 'upload: returns summary if file uploads and starter asset is added' do
    file_obj = MockS3ObjectSummary.new('123-abc.jpg', 123, 1.day.ago)
    LevelStarterAssetsController.any_instance.
      expects(:get_object).
      twice. # FIX THIS - ONLY CALL ONCE
      returns(file_obj)
    file_obj.expects(:upload_file).returns(true)

    sign_in create(:levelbuilder)
    level = create :level
    post :upload, params: {level_name: level.name, files: [@file]}

    level.reload
    assert_equal 1, level.starter_assets.length
    assert_response :success
    summary = JSON.parse(response.body)
    assert_equal @filename, summary['filename']
    assert_equal 'image', summary['category']
    assert_equal 123, summary['size']
  end
end

# Mock Aws::S3::ObjectSummary class since we can't request the objects from S3 in tests:
# https://docs.aws.amazon.com/sdkforruby/api/Aws/S3/ObjectSummary.html
class MockS3ObjectSummary
  attr_reader :key, :size, :last_modified

  def initialize(key, size, last_modified)
    @key = key
    @size = size
    @last_modified = last_modified
  end
end
