DROP VIEW IF EXISTS csf_teachers_trained;

-- the first date a teacher was trained in CSF
-- for teachers trained using old PD model, only resolving to the month
create or replace view analysis.csf_teachers_trained as
select 
  user_id, 
  min(trained_at) trained_at    
from
(
  -- first: find any teachers who attended a section used for CSF PD in the old data model
  select 
    f.student_user_id user_id,
    to_date(
      nullif(
        case json_extract_path_text( json_extract_array_element_text( json_extract_path_text( data_text, 'dates'), 0), 'date_s')
        when '08/10/2015' then '08/10/15' -- fix malformed data
        when '7/19/2016' then '07/19/16' -- fix malformed data
        else json_extract_path_text( json_extract_array_element_text( json_extract_path_text( data_text, 'dates'), 0), 'date_s')
        end,
      ''),
    'MM/DD/YY'
    ) trained_at
  from pegasus_pii.forms
  join dashboard_production.sections se on se.id = nullif(json_extract_path_text(data_text, 'section_id_s'),'')::int
  join dashboard_production.followers f on f.section_id = se.id
  where kind = 'ProfessionalDevelopmentWorkshop'
  and nullif(json_extract_path_text(data_text, 'section_id_s'),'') is not null
  
  union all
  
  -- second: add in any teachers in sections that aren't in the forms table, but are labeled "csf_workshop"
  SELECT DISTINCT 
    f.student_user_id user_id, 
    date_trunc('month', se.created_at)::date trained_at
  FROM dashboard_production.followers f
    JOIN dashboard_production.sections se ON se.id = f.section_id
  WHERE se.section_type = 'csf_workshop'
  AND se.id not in 
  (
    select nullif(json_extract_path_text(data_text, 'section_id_s'),'')::int
    from pegasus_pii.forms f
    where kind = 'ProfessionalDevelopmentWorkshop'
    and nullif(json_extract_path_text(data_text, 'section_id_s'),'') is not null
  )

  UNION ALL

  -- third: add in any teachers in the new PD attendance model
  SELECT DISTINCT 
    pde.user_id, 
    pds.start::date trained_at
  FROM dashboard_production_pii.pd_enrollments pde
    JOIN dashboard_production_pii.pd_attendances pda ON pda.pd_enrollment_id = pde.id
    JOIN dashboard_production_pii.pd_workshops pdw ON pdw.id = pde.pd_workshop_id
  JOIN dashboard_production_pii.pd_sessions pds ON pds.pd_workshop_id = pdw.id
  WHERE course = 'CS Fundamentals'
    AND   (pdw.subject IN ( 'Intro Workshop', 'Intro', 'Deep Dive Workshop') or pdw.subject is null)
)
group by 1
with no schema binding;

GRANT ALL PRIVILEGES ON analysis.csf_teachers_trained TO GROUP admin;
GRANT SELECT ON analysis.csf_teachers_trained TO GROUP reader, GROUP reader_pii;
