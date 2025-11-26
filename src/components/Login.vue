<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-left">
        <div class="login-branding">
          <div class="logo-icon">
            <img src="https://res.cloudinary.com/summitbank/image/upload/v1757037165/Summit_Logo_2_why0cs.png" alt="Summit Bank" class="logo-img" />
          </div>
          <h1>Summit Bank</h1>
          <p>Approval Workflow System</p>
        </div>
        <div class="login-description">
          <h3>Secure Access Portal</h3>
          <p>Manage approval workflows with role-based access control and real-time collaboration.</p>
          <ul>
            <li><i class="fas fa-check-circle"></i> Real-time notifications</li>
            <li><i class="fas fa-check-circle"></i> Role-based permissions</li>
            <li><i class="fas fa-check-circle"></i> Audit trail</li>
          </ul>
        </div>
      </div>

      <div class="login-right">
        <div class="login-box">
          <div class="login-header">
            <h2>Approver Login</h2>
            <p>Sign in to your account</p>
          </div>

          <form @submit.prevent="login" class="login-form">
            <div class="form-group">
              <label for="name">Full Name</label>
              <div class="input-wrapper">
                <i class="fas fa-user"></i>
                <input 
                  id="name"
                  v-model="name" 
                  type="text"
                  placeholder="Enter your full name" 
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email Address</label>
              <div class="input-wrapper">
                <i class="fas fa-envelope"></i>
                <input 
                  id="email"
                  v-model="email" 
                  type="email"
                  placeholder="you@company.com" 
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label for="role">Your Role</label>
              <div class="input-wrapper select-wrapper">
                <i class="fas fa-briefcase"></i>
                <select id="role" v-model="role" required>
                  <option value="">Select a role</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
            </div>

            <button type="submit" class="btn-login">
              <i class="fas fa-sign-in-alt"></i>
              Sign In
            </button>
          </form>

          <div class="login-footer">
            <p>Need help? <a href="#support">Contact support</a></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue' 
import { useAuth } from '../composables/useAuth'

export default {
  setup() {
    const { saveUser } = useAuth()
    const name = ref('')
    const email = ref('')
    const role = ref('')

    function login() {
      if (!name.value.trim() || !email.value.trim() || !role.value) {
        alert('Please fill in all fields')
        return
      }
      saveUser({ name: name.value.trim(), email: email.value.trim(), role: role.value })
    }

    return { name, email, role, login }
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e7e8ee 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.login-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  max-width: 1000px;
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  background: white;
  min-height: 600px;
}

.login-left {
  background: linear-gradient(135deg, #8b0000 0%, #b22222 100%);
  color: white;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.login-branding {
  text-align: center;
  margin-bottom: 50px;
}

.logo-icon {
  font-size: 48px;
  margin-bottom: 20px;
  animation: bounce 2s infinite;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.login-branding h1 {
  font-size: 32px;
  margin-bottom: 8px;
  font-weight: 700;
}

.login-branding p {
  font-size: 14px;
  opacity: 0.9;
}

.login-description {
  flex: 1;
}

.login-description h3 {
  font-size: 22px;
  margin-bottom: 12px;
  font-weight: 600;
}

.login-description p {
  font-size: 14px;
  opacity: 0.85;
  margin-bottom: 25px;
  line-height: 1.6;
}

.login-description ul {
  list-style: none;
}

.login-description li {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
  font-size: 14px;
}

.login-description li i {
  margin-right: 10px;
  font-size: 16px;
  color: #ffd700;
}

.login-right {
  padding: 60px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-box {
  width: 100%;
}

.login-header {
  margin-bottom: 40px;
}

.login-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 700;
}

.login-header p {
  color: #999;
  font-size: 14px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 12px 15px;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.input-wrapper:focus-within {
  border-color: #8b0000;
  background: white;
  box-shadow: 0 4px 12px rgba(139, 0, 0, 0.1);
}

.input-wrapper i {
  color: #999;
  margin-right: 10px;
  font-size: 16px;
  transition: color 0.3s;
}

.input-wrapper:focus-within i {
  color: #8b0000;
}

.input-wrapper input,
.input-wrapper select {
  border: none;
  background: transparent;
  flex: 1;
  font-size: 14px;
  color: #333;
  outline: none;
  font-family: inherit;
}

.input-wrapper input::placeholder {
  color: #bbb;
}

.input-wrapper select {
  cursor: pointer;
}

.input-wrapper select option {
  color: #333;
  background: white;
}

.select-wrapper select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
}

.btn-login {
  background: linear-gradient(135deg, #8b0000 0%, #b22222 100%);
  color: white;
  border: none;
  padding: 14px 20px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 15px rgba(139, 0, 0, 0.2);
}

.btn-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 0, 0, 0.3);
}

.btn-login:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(139, 0, 0, 0.2);
}

.login-footer {
  margin-top: 25px;
  text-align: center;
  font-size: 13px;
  color: #999;
}

.login-footer a {
  color: #8b0000;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s;
}

.login-footer a:hover {
  color: #b22222;
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-wrapper {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .login-left {
    padding: 40px 30px;
    min-height: 200px;
  }

  .login-left {
    display: none;
  }

  .login-right {
    padding: 40px 30px;
  }

  .login-branding h1 {
    font-size: 24px;
  }

  .login-header h2 {
    font-size: 24px;
  }
}
</style>
