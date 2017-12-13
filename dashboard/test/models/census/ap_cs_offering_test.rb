require 'test_helper'

class Census::ApCsOfferingTest < ActiveSupport::TestCase
  test "Basic offering creation succeeds" do
    offering = build :ap_cs_offering
    assert offering.valid?, offering.errors.full_messages
  end

  test "Offering creation without course fails" do
    offering = build :ap_cs_offering, :without_course
    refute offering.valid?
  end

  test "Offering creation without school_code fails" do
    offering = build :ap_cs_offering, :without_school_code
    refute offering.valid?
  end

  test "Offering creation without school_year fails" do
    offering = build :ap_cs_offering, :without_school_year
    refute offering.valid?
  end

  test "Offering creation with invalid course fails" do
    caught = false
    begin
      build :ap_cs_offering, :with_invalid_course
    rescue ArgumentError
      caught = true
    end
    assert caught, "Expected ArgumentError when creating offering with invalid course"
  end

  test "Offering creation with invalid school_year fails" do
    offering = build :ap_cs_offering, :with_invalid_school_year
    refute offering.valid?
  end
end
