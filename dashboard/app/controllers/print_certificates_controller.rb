require 'base64'

class PrintCertificatesController < ApplicationController
  include CertificatesHelper

  # GET /print_certificates/:encoded_params
  # encoded_params includes:
  #   name - student name (optional)
  #   course - course name (optional)
  #   donor - donor name (optional)
  def show
    view_options(no_header: true, no_footer: true, white_background: true, full_width: true)

    begin
      data = JSON.parse(Base64.urlsafe_decode64(params[:encoded_params]))
    rescue ArgumentError, OpenSSL::Cipher::CipherError
      return render status: :bad_request, json: {message: 'invalid base64'}
    end

    @student_name = data['name']
    @certificate_image_url = certificate_image_url(data['name'], data['course'], data['donor'])
  end

  # POST /print_certificates/batch
  def batch
    student_names = params[:studentNames]&.split("\n")&.map(&:strip)

    @certificate_data = {
      courseName: params[:courseName],
      imageUrl: params[:imageUrl],
      studentNames: student_names
    }
  end
end
