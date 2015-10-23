function processResponse(data)
{
  $('#unsubscribe-volunteer-form').hide();
  $('#thanks').show();
}

function processError(data)
{
  $('#error-message').text('An error occurred. Please try again or contact us if you continue to receive this error.').show();
  $('body').scrollTop(0);
  $("#btn-submit").removeAttr('disabled');
  $("#btn-submit").removeClass("button_disabled").addClass("button_enabled");
}

function unsubscribeVolunteerList()
{
  $("#btn-submit").attr('disabled','disabled');
  $("#btn-submit").removeClass("button_enabled").addClass("button_disabled");

  secret = $('#volunteer-secret').text()
  form_results = $('#unsubscribe-volunteer-form').serializeArray();

  var data = {};
  $(form_results).each(function(index, obj){
    data[obj.name] = obj.value;
  });

  $.ajax({
    url: "/v2/forms/VolunteerEngineerSubmission2015/" + secret + "/update",
    method: "post",
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify(data)
  }).done(processResponse).fail(processError);

  return false;
}

$(document).ready(function() {
  $('#unsubscribe-volunteer-reason').change(function() {
    if($('#unsubscribe-volunteer-other').is(':checked')) {
      $('#unsubscribe-volunteer-details').closest('.form-group').slideDown();
    } else {
      $('#unsubscribe-volunteer-details').closest('.form-group').slideUp();
    }
  });
});
