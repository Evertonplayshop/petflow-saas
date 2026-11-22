import { getSupabaseClient } from '../integrations/supabase/client';
import { AppServiceError } from '../lib/errors';

type StorageBucket = 'tenant-logos' | 'pet-photos' | 'product-images' | 'profile-avatars';

const MIME_TYPES: Record<StorageBucket, readonly string[]> = {
  'tenant-logos': ['image/png', 'image/jpeg', 'image/webp'],
  'pet-photos': ['image/png', 'image/jpeg', 'image/webp'],
  'product-images': ['image/png', 'image/jpeg', 'image/webp'],
  'profile-avatars': ['image/png', 'image/jpeg', 'image/webp'],
};

const MAX_SIZE: Record<StorageBucket, number> = {
  'tenant-logos': 2 * 1024 * 1024,
  'pet-photos': 5 * 1024 * 1024,
  'product-images': 5 * 1024 * 1024,
  'profile-avatars': 2 * 1024 * 1024,
};

function extensionFor(file: File): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  };
  return map[file.type] ?? 'bin';
}

export const storageService = {
  async upload(
    bucket: StorageBucket,
    tenantId: string,
    file: File,
    entityId: string
  ): Promise<string> {
    if (!MIME_TYPES[bucket].includes(file.type)) {
      throw new AppServiceError(
        'Formato de imagem não permitido.',
        'INVALID_FILE_TYPE'
      );
    }
    if (file.size > MAX_SIZE[bucket]) {
      throw new AppServiceError(
        `Arquivo maior que o limite de ${MAX_SIZE[bucket] / 1024 / 1024} MB.`,
        'FILE_TOO_LARGE'
      );
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new AppServiceError(
        'Supabase não configurado.',
        'SUPABASE_NOT_CONFIGURED'
      );
    }

    const path = `${tenantId}/${entityId}.${extensionFor(file)}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });
    if (uploadError) {
      throw new AppServiceError(uploadError.message, 'STORAGE_UPLOAD_ERROR');
    }

    if (bucket === 'pet-photos') {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (error || !data.signedUrl) {
        throw new AppServiceError(
          error?.message || 'Não foi possível criar URL privada da foto.',
          'STORAGE_URL_ERROR'
        );
      }
      return data.signedUrl;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  async uploadTenantLogo(tenantId: string, file: File): Promise<string> {
    const url = await this.upload('tenant-logos', tenantId, file, 'logo');
    const supabase = getSupabaseClient();
    if (!supabase) throw new AppServiceError('Supabase não configurado.', 'SUPABASE_NOT_CONFIGURED');

    const { error } = await supabase
      .from('tenants')
      .update({ logo_url: url })
      .eq('id', tenantId);
    if (error) {
      throw new AppServiceError(error.message, 'TENANT_LOGO_UPDATE_ERROR');
    }
    return url;
  },

  async uploadProfileAvatar(userId: string, file: File): Promise<string> {
    const url = await this.upload('profile-avatars', userId, file, 'avatar');
    const supabase = getSupabaseClient();
    if (!supabase) throw new AppServiceError('Supabase não configurado.', 'SUPABASE_NOT_CONFIGURED');

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', userId);
    if (error) {
      throw new AppServiceError(error.message, 'PROFILE_AVATAR_UPDATE_ERROR');
    }
    return url;
  },

  async uploadPetPhoto(
    tenantId: string,
    petId: string,
    file: File
  ): Promise<string> {
    const url = await this.upload('pet-photos', tenantId, file, petId);
    const supabase = getSupabaseClient();
    if (!supabase) throw new AppServiceError('Supabase não configurado.', 'SUPABASE_NOT_CONFIGURED');

    const { error } = await supabase
      .from('pets')
      .update({ photo_url: url })
      .eq('id', petId)
      .eq('tenant_id', tenantId);
    if (error) {
      throw new AppServiceError(error.message, 'PET_PHOTO_UPDATE_ERROR');
    }
    return url;
  },

  async uploadProductImage(
    tenantId: string,
    productId: string,
    file: File
  ): Promise<string> {
    const url = await this.upload('product-images', tenantId, file, productId);
    const supabase = getSupabaseClient();
    if (!supabase) throw new AppServiceError('Supabase não configurado.', 'SUPABASE_NOT_CONFIGURED');

    const { error } = await supabase
      .from('products')
      .update({ image_url: url })
      .eq('id', productId)
      .eq('tenant_id', tenantId);
    if (error) {
      throw new AppServiceError(error.message, 'PRODUCT_IMAGE_UPDATE_ERROR');
    }
    return url;
  },
};
