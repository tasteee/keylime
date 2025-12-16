class AuthStore {
  isAuthenticated = $state(false)
  user = $state<{ id: string; name: string; email: string } | null>(null)

  login = () => {
    this.isAuthenticated = true
    this.user = {
      id: 'user_123',
      name: 'Demo User',
      email: 'demo@keylime.app'
    }
  }

  logout = () => {
    this.isAuthenticated = false
    this.user = null
  }
}

const authStore = new AuthStore()
export default authStore
