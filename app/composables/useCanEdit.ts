import { useAuthStore } from '~/stores/auth'
import { UserRole } from '~/types/chat'

export const GUEST_EDIT_DENIED_MESSAGE = 'У вас нет прав для редактирования'

export function isGuestAccount(user?: { username?: string; role?: UserRole } | null): boolean {
  if (!user) return false
  return user.role === UserRole.Guest || user.username === 'guest'
}

export function useCanEdit() {
  const auth = useAuthStore()
  const toast = useToast()

  const canEdit = computed(() => !isGuestAccount(auth.user))

  function assertCanEdit(): boolean {
    if (canEdit.value) return true
    toast.show(GUEST_EDIT_DENIED_MESSAGE)
    return false
  }

  return {
    canEdit,
    assertCanEdit,
  }
}
