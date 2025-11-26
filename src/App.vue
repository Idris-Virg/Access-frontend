<template>
  <v-app>
    <div>
      <Login v-if="!currentUser" />

      <div v-else>
        <div class="top-bar">
          Logged in as <strong>{{ currentUser.name }}</strong> ({{ currentUser.role }})
          <div>
            <button class="logout-btn" @click="logout">Logout</button>
          </div>
        </div>

        <!-- Render role-specific dashboards -->
        <AdminDashboard v-if="currentUser.role === 'admin'" :current-user="currentUser" :flags="flags" />
        <SuperadminDashboard v-else-if="currentUser.role === 'superadmin'" :current-user="currentUser" :flags="flags" />
        <ApprovalWorkflowTable v-else :current-user="currentUser" :flags="flags" />
      </div>
    </div>
  </v-app>
</template>

<script setup>
import { computed } from 'vue'
import ApprovalWorkflowTable from './components/ApprovalWorkflowTable.vue'
import Login from './components/Login.vue'
import { useAuth } from './composables/useAuth'
import { getFeatureFlagsForRole } from './composables/useFeatureFlags'
import AdminDashboard from './components/dashboards/AdminDashboard.vue'
import SuperadminDashboard from './components/dashboards/SuperadminDashboard.vue'

const { currentUser: currentUserRef, clearUser } = useAuth()

function logout() {
  clearUser()
}

const currentUser = computed(() => currentUserRef.value)

const flags = computed(() => getFeatureFlagsForRole(currentUser.value && currentUser.value.role))

</script>

<style>
/* Global basic body styling to match original look */
body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #fffafa 0%, #fffafa 50%, #fffafa 100%);
  color: #343a40;
}
.top-bar { display:flex; justify-content:space-between; align-items:center; padding:12px 20px; background:#fff; border-bottom:1px solid #eee }
.logout-btn { background:#8b0000; color:white; border:none; padding:6px 10px; border-radius:6px }
</style>
