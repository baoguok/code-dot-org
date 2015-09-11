get '/v2/user' do
  only_for 'code.org'
  dont_cache
  forbidden! unless current_user
  content_type :json
  result = current_user.slice_keys(:id, :name, :admin)
  result[:owned_sections] = Dashboard::db[:sections].
      select(:id).where(user_id: current_user_id).all
  JSON.pretty_generate(result)
end

get '/v2/students' do
  only_for 'code.org'
  dont_cache
  content_type :json
  JSON.pretty_generate(DashboardStudent.fetch_user_students(current_user_id))
end

get '/v2/students/:id' do |id|
  only_for 'code.org'
  dont_cache
  forbidden! unless student = DashboardStudent.fetch_if_allowed(id, current_user_id)
  content_type :json
  JSON.pretty_generate(student.to_hash)
end


patch '/v2/students/:id' do |id|
  only_for 'code.org'
  dont_cache
  unsupported_media_type! unless payload = request.json_body
  forbidden! unless student = DashboardStudent::update_if_allowed(payload.merge(id: id), current_user_id)
  content_type :json
  JSON.pretty_generate(student.to_hash)
end
post '/v2/students/:id/update' do |id|
  call(env.merge('REQUEST_METHOD'=>'PATCH', 'PATH_INFO'=>"/v2/students/#{id}"))
end
