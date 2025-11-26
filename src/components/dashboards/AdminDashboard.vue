<template>
  <div class="dashboard admin-dashboard">
    <h2>Admin Dashboard</h2>
    <div class="admin-tools">
      <button class="btn" @click="runSystemAudit">Run System Audit</button>
      <button class="btn" @click="openReports">Open Compliance Reports</button>
    </div>

    <div class="workflow-area">
      <!-- admin can see full approval table with admin flags -->
      <ApprovalWorkflowTable :current-user="currentUser" :flags="flags" />
    </div>
  </div>
</template>

<script>
import ApprovalWorkflowTable from '../ApprovalWorkflowTable.vue'
export default {
  props: ['currentUser', 'flags'],
  components: { ApprovalWorkflowTable },
  methods: {
    runSystemAudit() {
      alert('System audit started (placeholder)')
    },
    openReports() {
      alert('Opening compliance reports (placeholder)')
    }
  }
}
</script>

<style scoped>
.admin-tools { display:flex; gap:10px; margin-bottom:12px }
.btn { background:#8b0000; color:white; border:none; padding:8px 10px; border-radius:6px }
</style>
