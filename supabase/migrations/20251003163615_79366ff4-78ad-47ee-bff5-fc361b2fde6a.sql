-- Add RLS policy to allow admins to view roles for users in their barangay
CREATE POLICY "Admins can view roles in their barangay"
ON public.user_roles
FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = user_roles.user_id
    AND p.brgyid = get_user_brgyid(auth.uid())
  )
);