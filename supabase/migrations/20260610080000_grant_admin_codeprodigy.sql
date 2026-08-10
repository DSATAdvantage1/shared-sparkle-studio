-- Grant admin access to the project owner account.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'codeprodigy313@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
