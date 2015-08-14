require 'minitest/autorun'
require 'rack/test'
require 'securerandom'

require_relative '../../lib/cdo/aws/s3'
require_relative '../../deployment'

class AwsS3IntegrationTest < Minitest::Test
  # A test bucket, only used for these tests.
  TEST_BUCKET = 'cdo-temp'

  # An integration test of the AWS S3 wrapper that runs against the actual AWS service.
  # This must be run a server with access to the production AWS keys.
  def test_aws_s3
    # Test upload_to_bucket and download_from_bucket with :no_random.
    test_key = Random.rand.to_s
    test_value = Random.rand.to_s
    upload_key = AWS::S3::upload_to_bucket(TEST_BUCKET, test_key, test_value, :no_random => true)
    assert_equal test_value, AWS::S3::download_from_bucket(TEST_BUCKET, test_key)
    assert_equal test_key, upload_key

    # Test upload_to_bucket and download_from_bucket with key randomization.
    key = 'key'
    test_value2 = Random.rand.to_s
    randomized_key = AWS::S3::upload_to_bucket(TEST_BUCKET, key, test_value2)
    assert randomized_key.end_with? key
    assert randomized_key.length > key.length
    assert_equal test_value2, AWS::S3::download_from_bucket(TEST_BUCKET, randomized_key)

    test_value3 = Random.rand.to_s
    randomized_key2 = AWS::S3::upload_to_bucket(TEST_BUCKET, key, test_value3)
    assert randomized_key != randomized_key2
    assert_equal test_value3, AWS::S3::download_from_bucket(TEST_BUCKET, randomized_key2)
  end
end
