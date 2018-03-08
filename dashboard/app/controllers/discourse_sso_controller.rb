require 'single_sign_on'

class DiscourseSsoController < ApplicationController
  before_action :authenticate_user! # ensures user must login

  def sso
    secret = CDO.discourse_sso_secret
    sso = SingleSignOn.parse(request.query_string, secret)
    sso.email = current_user.email # from devise
    sso.name = current_user.name # this is a custom method on the User class
    sso.username = current_user.email # from devise
    sso.external_id = current_user.id # from devise
    sso.sso_secret = secret

    redirect_to sso.to_url(sso.return_sso_url)
  end
end
