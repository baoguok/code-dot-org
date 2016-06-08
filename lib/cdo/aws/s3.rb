require 'aws-sdk'

module AWS
  module S3
    # An exception class used to wrap the underlying Amazon NoSuchKey exception.
    class NoSuchKey < Exception
      def initialize(message = nil)
        super(message)
      end
    end

    # Creates an S3 client using the the official AWS SDK for Ruby v2 and
    # the credentials specified in the CDO config.
    # @return [Aws::S3::Client]
    def self.connect_v2!
      Aws::S3::Client.new
    end

    # A simpler name for connect_v2!
    def self.create_client
      self.connect_v2!
    end

    # Returns the value of the specified S3 key in bucket.
    # @param [String] bucket
    # @param [String] key
    # @return [String]
    def self.download_from_bucket(bucket, key, options={})
      create_client.get_object(bucket: bucket, key: key).body.read.force_encoding(Encoding::BINARY)
    rescue Aws::S3::Errors::NoSuchKey
      raise NoSuchKey.new("No such key `#{key}'")
    end

    # Sets the value of a key in the given S3 bucket.
    # The key name is derived from 'filename', prepending a random prefix
    # unless options[:no_random] is set.
    # @param [String] bucket S3 bucket name.
    # @param [String] filename Suffix of the key to fetch
    # @param [String] data The data set.
    # @param [Hash] options Aws::S3::Client#put_object options as documented at
    # http://docs.aws.amazon.com/sdkforruby/api/Aws/S3/Client.html#put_object-instance_method.
    # @return [String] The key of the new value, derived from filename.
    def self.upload_to_bucket(bucket, filename, data, options={})
      no_random = options.delete(:no_random)
      filename = "#{random}-#{filename}" unless no_random
      create_client.put_object(options.merge(bucket: bucket, key: filename, body: data))
      filename
    end

    # Allow the RNG to be stubbed in tests
    def self.random
      SecureRandom.hex
    end

    def self.public_url(bucket, filename)
      Aws::S3::Object.new(bucket, filename, region: CDO.aws_region).public_url
    end

    class LogUploader
      # A LogUploader is constructed with some preconfigured settings that will
      # apply to all log uploads - presumably you may be uploading many similar
      # logs.
      # @param [String] bucket name on S3
      # @param [String] prefix to prepend to all log keys/filenames
      # @param [Hash] options applied to all uploads - can be overwritten by
      #        options in individual upload calls.
      def initialize(bucket, prefix, options = {})
        @bucket = bucket
        @prefix = prefix
        @global_options = options
      end

      # Uploads a log to S3 at the given key (appended to the configured prefix),
      # returning a URL to the uploaded file.
      # @param [String] key where the log will be placed under the configured prefix
      # @param [String] body of the log to be uploaded
      # @param [Hash] options
      # @return [String] public URL of uploaded log
      # @raise [Exception] if the S3 upload fails
      # @see http://docs.aws.amazon.com/sdkforruby/api/Aws/S3/Client.html#put_object-instance_method for supported options
      def upload_log(key, body, options={})
        result = AWS::S3.create_client.put_object(
          @global_options.merge(options).merge(
            bucket: @bucket,
            key: "#{@prefix}/#{key}",
            body: body
          )
        )
        log_url = "https://s3.amazonaws.com/#{@bucket}/#{@prefix}/#{key}"
        log_url += "?versionId=#{result[:version_id]}" unless result[:version_id].nil?
        log_url
      end

      # Uploads the given file to S3, returning a URL to the uploaded file.
      # @param [String] filename to upload to S3
      # @param [Hash] options
      # @return [String] public URL of uploaded file
      # @raise [Exception] if the file cannot be opened or the S3 upload fails
      # @see http://docs.aws.amazon.com/sdkforruby/api/Aws/S3/Client.html#put_object-instance_method for supported options
      def upload_file(filename, options={})
        File.open(filename, 'rb') do |file|
          return upload_log(filename, file, options)
        end
      end
    end
  end
end
