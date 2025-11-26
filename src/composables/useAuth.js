import { ref } from 'vue'

const STORAGE_KEY = 'approval_current_user'

const currentUser = ref(null)

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) currentUser.value = JSON.parse(raw)
  } catch (e) {
    console.error('Failed to load user from storage', e)
  }
}

function saveUser(user) {
  currentUser.value = user
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } catch (e) {
    console.error('Failed to save user to storage', e)
  }
}

function clearUser() {
  currentUser.value = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.error('Failed to remove user from storage', e)
  }
}

loadUser()

export function useAuth() {
  return {
    currentUser,
    saveUser,
    clearUser
  }
}
