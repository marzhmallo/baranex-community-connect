-- Remove duplicate roles, keeping only one role per user (prefer admin > staff > user)
DELETE FROM user_roles ur1
WHERE EXISTS (
  SELECT 1 FROM user_roles ur2
  WHERE ur2.user_id = ur1.user_id
  AND ur2.id != ur1.id
  AND (
    -- Keep admin if it exists
    (ur2.role = 'admin' AND ur1.role != 'admin')
    -- Otherwise keep staff over user
    OR (ur2.role = 'staff' AND ur1.role = 'user')
    -- If same role, keep the earlier one
    OR (ur2.role = ur1.role AND ur2.id < ur1.id)
  )
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);