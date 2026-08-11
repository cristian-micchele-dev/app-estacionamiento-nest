import api from '@/lib/axios'
import type { UserApi } from '@/services/users.service'

export interface UpdateProfileData {
  name?: string
  email?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export const profileService = {
  update(data: UpdateProfileData): Promise<UserApi> {
    return api.patch('/users/me', data).then(r => r.data)
  },
  changePassword(data: ChangePasswordData): Promise<void> {
    return api.patch('/users/me/password', data).then(() => undefined)
  },
}
