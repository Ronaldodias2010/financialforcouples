-- Use Supabase auth functions to create the admin user
SELECT auth.create_user(
  jsonb_build_object(
    'email', 'admin@arxexperience.com.br',
    'password', 'Ropri2001@',
    'email_confirm', true,
    'user_metadata', jsonb_build_object('display_name', 'Admin')
  )
);