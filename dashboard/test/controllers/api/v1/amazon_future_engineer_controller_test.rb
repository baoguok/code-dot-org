require 'test_helper'

class Api::V1::AmazonFutureEngineerControllerTest < ActionDispatch::IntegrationTest
  setup do
    CDO.stubs(:afe_pardot_form_handler_url).returns('fake_pardot_url.com')
  end

  test 'logged out cannot submit' do
    Net::HTTP.expects(:post_form).never

    post '/dashboardapi/v1/amazon_future_engineer_submit',
      params: valid_params, as: :json

    assert_response :forbidden
  end

  test 'submit returns BAD REQUEST when params are malformed' do
    Net::HTTP.expects(:post_form).never

    # Intentionally missing required field traffic-source
    sign_in create :teacher
    post '/dashboardapi/v1/amazon_future_engineer_submit',
      params: valid_params.delete('traffic-source'), as: :json

    assert_response :bad_request, "Expected BAD REQUEST, got: #{response.status}\n#{response.body}"
  end

  test 'submit returns BAD REQUEST when params are missing' do
    Net::HTTP.stubs(:post_form)

    sign_in create :teacher
    post '/dashboardapi/v1/amazon_future_engineer_submit'

    assert_response :bad_request, "Expected BAD REQUEST, got: #{response.status}\n#{response.body}"
  end

  test 'logged in can submit' do
    Timecop.freeze do
      # Establish an expectation that we post to Pardot with the
      # correct parameters
      expected_call = Net::HTTP.expects(:post_form).with do |url, params|
        url.to_s == CDO.afe_pardot_form_handler_url &&
          params.to_h == {
            'traffic-source' => 'AFE-code.org',
            'first-name' => 'test',
            'last-name' => 'test',
            'email' => 'test@code.org',
            'nces-id' => '123456789012',
            'street-1' => 'test street',
            'street-2' => 'test street 2',
            'city' => 'seattle',
            'state' => 'wa',
            'zip' => '98105',
            'inspirational-marketing-kit' => '0',
            'csta-plus' => '0',
            'aws-educate' => '0',
            'amazon-terms' => '1',
            'new-code-account' => '0',
            'registration-date-time' => Time.now.iso8601
          }
      end
      expected_call.returns FakeResponse.new

      sign_in create :teacher
      post '/dashboardapi/v1/amazon_future_engineer_submit',
        params: valid_params, as: :json

      assert_response :success, "Failed response: #{response.body}"
    end
  end

  private

  def valid_params
    {
      'trafficSource' => 'AFE-code.org',
      'firstName' => 'test',
      'lastName' => 'test',
      'email' => 'test@code.org',
      'schoolId' => '123456789012',
      'street1' => 'test street',
      'street2' => 'test street 2',
      'city' => 'seattle',
      'state' => 'wa',
      'zip' => '98105',
      'inspirationKit' => '0',
      'csta' => '0',
      'consentCSTA' => '0',
      'awsEducate' => '0',
      'consentAFE' => '1',
      'newCodeAccount' => '0'
    }
  end

  class FakeResponse
    def code
      '200'
    end

    def body
      ''
    end
  end
end
