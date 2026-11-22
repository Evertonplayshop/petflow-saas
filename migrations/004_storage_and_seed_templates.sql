-- ============================================================================
-- PETFLOW SaaS — Migration 004: Supabase Storage Buckets & Tenant Isolation
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('tenant-logos', 'tenant-logos', TRUE, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('pet-photos', 'pet-photos', FALSE, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('product-images', 'product-images', TRUE, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp']),
  ('profile-avatars', 'profile-avatars', TRUE, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Padrão de caminho obrigatório: <tenant_id>/<entity_or_filename>
DROP POLICY IF EXISTS storage_tenant_logos_select ON storage.objects;
CREATE POLICY storage_tenant_logos_select ON storage.objects
  FOR SELECT USING (bucket_id = 'tenant-logos');

DROP POLICY IF EXISTS storage_tenant_logos_write ON storage.objects;
CREATE POLICY storage_tenant_logos_write ON storage.objects
  FOR ALL USING (
    bucket_id = 'tenant-logos'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, ARRAY['owner', 'manager']::public.app_role[])
  )
  WITH CHECK (
    bucket_id = 'tenant-logos'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, ARRAY['owner', 'manager']::public.app_role[])
  );

DROP POLICY IF EXISTS storage_pet_photos_select ON storage.objects;
CREATE POLICY storage_pet_photos_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'pet-photos'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND public.is_tenant_member(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS storage_pet_photos_write ON storage.objects;
CREATE POLICY storage_pet_photos_write ON storage.objects
  FOR ALL USING (
    bucket_id = 'pet-photos'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, ARRAY['owner', 'manager', 'attendant', 'employee']::public.app_role[])
  )
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, ARRAY['owner', 'manager', 'attendant', 'employee']::public.app_role[])
  );

DROP POLICY IF EXISTS storage_product_images_select ON storage.objects;
CREATE POLICY storage_product_images_select ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS storage_product_images_write ON storage.objects;
CREATE POLICY storage_product_images_write ON storage.objects
  FOR ALL USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, ARRAY['owner', 'manager', 'stock_clerk']::public.app_role[])
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND public.has_tenant_role(((storage.foldername(name))[1])::uuid, ARRAY['owner', 'manager', 'stock_clerk']::public.app_role[])
  );

DROP POLICY IF EXISTS storage_profile_avatars_select ON storage.objects;
CREATE POLICY storage_profile_avatars_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS storage_profile_avatars_write ON storage.objects;
CREATE POLICY storage_profile_avatars_write ON storage.objects
  FOR ALL USING (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
