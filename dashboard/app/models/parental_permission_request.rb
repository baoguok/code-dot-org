# == Schema Information
#
# Table name: parental_permission_requests
#
#  id           :bigint           not null, primary key
#  user_id      :integer          not null
#  parent_email :string(255)      not null
#  uuid         :string(255)      not null
#  created_at   :datetime         not null
#  updated_at   :datetime         not null
#
# Indexes
#
#  index_parental_permission_requests_on_user_id  (user_id)
#
class ParentalPermissionRequest < ApplicationRecord
  before_create :set_uuid

  def set_uuid
    self.uuid = SecureRandom.uuid
  end
end
