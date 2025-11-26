<template>
  <div class="dashboard superadmin-dashboard">
    <h2>Superadmin Dashboard</h2>
    <p>Superadmin overview and elevated controls</p>
    <ApprovalWorkflowTable :current-user="currentUser" :flags="flags" />
  </div>
</template>

<script>
import ApprovalWorkflowTable from '../ApprovalWorkflowTable.vue'
export default {
  props: ['currentUser', 'flags'],
  components: { ApprovalWorkflowTable }
}
</script>

<style scoped>
.superadmin-dashboard p { margin-bottom:12px }
</style>
