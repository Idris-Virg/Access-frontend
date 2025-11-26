<template>
  <div class="approval-workflow-app">
    <!-- Navbar -->
    <div class="navbar">
      <i class="fas fa-shield-alt"></i>
      <span>Summit Bank — Approval Workflow Portal</span>
    </div>

    <!-- Main Content -->
    <div class="container">
      <div class="main-layout">
        <!-- Request List Panel -->
        <div class="requests-panel">
          <div class="panel-header">
            <h2><i class="fas fa-list"></i>Requests</h2>
            <div class="filter-tabs">
              <div 
                v-for="filter in filters" 
                :key="filter.value"
                @click="currentFilter = filter.value"
                :class="['filter-tab', { active: currentFilter === filter.value }]"
              >
                {{ filter.label }}
              </div>
            </div>
          </div>

          <!-- Requests List -->
          <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading requests...</p>
          </div>
          <div v-else-if="filteredRequests.length === 0" class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>No requests found</p>
          </div>
          <div v-else>
            <div
              v-for="request in filteredRequests"
              :key="request.id"
              @click="selectRequest(request.id)"
              :class="['request-item', { active: currentRequestId === request.id }]"
            >
              <div class="request-item-header">
                <div class="request-id">#{{ request.id }}</div>
                <div :class="['request-status', `status-${request.status.toLowerCase().replace(' ', '-')}`]">
                  {{ request.status }}
                </div>
              </div>
              <div class="request-title">{{ request.request_type || 'Access Request' }}</div>
              <div class="request-meta">
                <span><i class="fas fa-user"></i> {{ request.requester_name }}</span>
                <span><i class="fas fa-envelope"></i> {{ request.requester_email }}</span>
                <span><i class="fas fa-calendar"></i> {{ formatDate(request.created_at) }}</span>
              </div>
              <div class="current-stage">
                <strong>Current Stage:</strong> {{ request.current_stage || 'Pending' }}
              </div>
              <div class="current-stage" style="margin-top: 8px;">
                <strong>Progress:</strong> {{ request.approved_count || 0 }}/{{ request.total_approvals || 3 }} approvals
              </div>
            </div>
          </div>
        </div>

        <!-- Approval Panel -->
        <div class="approval-panel">
          <div v-if="!currentRequestId" class="empty-state">
            <i class="fas fa-clipboard-list"></i>
            <h3>Select a request to review</h3>
            <p>Choose a request from the list to view details and make approval decisions</p>
          </div>

          <div v-else-if="selectedRequest">
            <!-- Request Details -->
            <div class="request-details">
              <h3><i class="fas fa-file-alt"></i>Request Details</h3>
              <div class="detail-row">
                <div class="detail-label">Request ID:</div>
                <div class="detail-value">#{{ selectedRequest.request.id }}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Requester:</div>
                <div class="detail-value">{{ selectedRequest.request.requester_name }} ({{ selectedRequest.request.requester_email }})</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Request Type:</div>
                <div class="detail-value">{{ selectedRequest.request.request_type || 'N/A' }}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Current Stage:</div>
                <div class="detail-value">{{ selectedRequest.request.current_stage || 'Pending' }}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="detail-value">{{ selectedRequest.request.status }}</div>
              </div>
              <div v-if="selectedRequest.request.summary" class="detail-row">
                <div class="detail-label">Summary:</div>
                <div class="detail-value">{{ selectedRequest.request.summary }}</div>
              </div>
              <div v-if="selectedRequest.request.request_details" class="detail-row">
                <div class="detail-label">Details:</div>
                <div class="detail-value">
                  <div class="request-details-text">{{ formatRequestDetails(selectedRequest.request.request_details) }}</div>
                </div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Created:</div>
                <div class="detail-value">{{ formatDateTime(selectedRequest.request.created_at) }}</div>
              </div>
            </div>

            <!-- Approval Workflow Steps -->
            <div class="steps-container">
              <div class="steps-title">Approval Workflow</div>
              <div class="steps">
                <div
                  v-for="(stage, index) in selectedRequest.workflow"
                  :key="index"
                  :class="['step', getStepClass(stage, index)]"
                >
                  <div class="step-circle">{{ stage.status === 'Approved' ? '✓' : (index + 1) }}</div>
                  <div class="step-label">{{ formatRole(stage.role) }}</div>
                </div>
              </div>
            </div>

            <!-- Approval Cards -->
            <div class="approval-cards">
              <div
                v-for="(stage, index) in selectedRequest.workflow"
                :key="index"
                :class="['approval-card', getCardClass(stage)]"
              >
                <div class="approval-card-header">
                  <div class="approval-card-title">{{ formatRole(stage.role) }} Approval</div>
                  <div :class="['approval-status-badge', `status-${stage.status.toLowerCase()}`]">
                    {{ stage.status }}
                  </div>
                </div>

                <div v-if="stage.approver_name" class="approval-info">
                  <strong>Approver:</strong> {{ stage.approver_name }} ({{ stage.approver_email || 'N/A' }})
                </div>

                <div v-if="stage.decided_at" class="approval-info">
                  <strong>Decided:</strong> {{ formatDateTime(stage.decided_at) }}
                </div>

                <div class="comment-section">
                  <label>Comments:</label>
                  <textarea
                    v-model="comments[index]"
                    :disabled="!canApprove(stage, index)"
                    :placeholder="canApprove(stage, index) ? 'Add your comments...' : 'No comments'"
                    class="comment-textarea"
                  ></textarea>
                </div>

                <div v-if="canApprove(stage, index)" class="approval-actions">
                  <button class="btn btn-approve" @click="updateApproval(index, 'Approved')">
                    <i class="fas fa-check"></i> Approve
                  </button>
                  <button class="btn btn-reject" @click="updateApproval(index, 'Rejected')">
                    <i class="fas fa-times"></i> Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notifications -->
    <div v-if="notification.visible" :class="['notification', notification.type]">
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      API_BASE: 'http://localhost:5501/api',
      loading: true,
      currentFilter: 'all',
      currentRequestId: null,
      allRequests: [],
      selectedRequest: null,
      comments: {},
      notification: {
        visible: false,
        message: '',
        type: 'success'
      },
      filters: [
        { label: 'All', value: 'all' },
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in-progress' }
      ]
    }
  },
  computed: {
    filteredRequests() {
      if (this.currentFilter === 'pending') {
        return this.allRequests.filter(r => r.status === 'Pending')
      } else if (this.currentFilter === 'in-progress') {
        return this.allRequests.filter(r => r.status === 'In Progress')
      }
      return this.allRequests
    }
  },
  methods: {
    async loadRequests() {
      try {
        this.loading = true
        const response = await fetch(`${this.API_BASE}/approvals/pending-access-requests`)
        if (response.ok) {
          this.allRequests = await response.json()
        } else {
          this.showNotification('Failed to load requests', 'error')
        }
      } catch (error) {
        console.error('Error loading requests:', error)
        this.showNotification('Error loading requests. Please check your connection.', 'error')
      } finally {
        this.loading = false
      }
    },
    async selectRequest(requestId) {
      this.currentRequestId = requestId
      this.comments = {}
      try {
        const response = await fetch(`${this.API_BASE}/approvals/access-request-workflow/${requestId}`)
        if (response.ok) {
          this.selectedRequest = await response.json()
        } else {
          const error = await response.json()
          this.showNotification(error.error || 'Failed to load request details', 'error')
        }
      } catch (error) {
        console.error('Error loading request details:', error)
        this.showNotification('Error loading request details', 'error')
      }
    },
    async updateApproval(stageIndex, status) {
      if (!this.currentRequestId || !this.selectedRequest) return
      const stage = this.selectedRequest.workflow[stageIndex]
      // Prompt for approver info. If the user cancels any prompt (null), abort the approval.
      const approverNameRaw = prompt('Enter your name:')
      if (approverNameRaw === null) {
        this.showNotification('Approval cancelled', 'error')
        return
      }
      const approverName = approverNameRaw.trim() || 'Approver'

      const approverEmailRaw = prompt('Enter your email:')
      if (approverEmailRaw === null) {
        this.showNotification('Approval cancelled', 'error')
        return
      }
      const approverEmail = approverEmailRaw.trim()
      if (!approverEmail) {
        this.showNotification('Approver email is required', 'error')
        return
      }
      try {
        const response = await fetch(`${this.API_BASE}/approvals/update-access-request-approval`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request_id: this.currentRequestId,
            role: stage.role,
            status: status,
            comment: this.comments[stageIndex] || '',
            approver_name: approverName,
            approver_email: approverEmail
          })
        })
        if (response.ok) {
          this.showNotification(`Request ${status.toLowerCase()} successfully!`, 'success')
          await this.selectRequest(this.currentRequestId)
          await this.loadRequests()
        } else {
          const error = await response.json()
          this.showNotification(error.error || 'Failed to update approval', 'error')
        }
      } catch (error) {
        console.error('Error updating approval:', error)
        this.showNotification('Error updating approval. Please try again.', 'error')
      }
    },
    showNotification(message, type = 'success') {
      this.notification = { visible: true, message, type }
      setTimeout(() => {
        this.notification.visible = false
      }, 3000)
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString()
    },
    formatDateTime(dateString) {
      return new Date(dateString).toLocaleString()
    },
    formatRole(role) {
      return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    },
    formatRequestDetails(details) {
      try {
        if (typeof details === 'string') {
          return JSON.stringify(JSON.parse(details), null, 2)
        }
        return JSON.stringify(details, null, 2)
      } catch {
        return String(details)
      }
    },
    getStepClass(stage, index) {
      if (stage.status === 'Approved') return 'completed'
      if (stage.status === 'Rejected') return 'rejected'
      if (stage.status === 'Pending' && this.selectedRequest.workflow.findIndex(s => s.status === 'Pending') === index) return 'active'
      return ''
    },
    getCardClass(stage) {
      if (stage.status === 'Approved') return 'approved'
      if (stage.status === 'Rejected') return 'rejected'
      return 'pending'
    },
    canApprove(stage, index) {
      if (stage.status !== 'Pending') return false
      const currentStageIndex = this.selectedRequest.workflow.findIndex(s => s.status === 'Pending')
      return index === currentStageIndex
    }
  },
  mounted() {
    this.loadRequests()
    setInterval(() => {
      this.loadRequests()
    }, 30000)
  }
}
</script>

<style scoped>
.approval-workflow-app {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.navbar {
  background: linear-gradient(135deg, #8b0000 0%, #b22222 100%);
  color: white;
  padding: 20px 30px;
  font-size: 22px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(139, 0, 0, 0.3);
  margin-bottom: 30px;
  border-radius: 10px;
  display: flex;
  align-items: center;
}

.container {
  max-width: 1400px;
}

.main-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 30px;
  height: calc(100vh - 150px);
}

.requests-panel-wrapper {
  max-height: calc(100vh - 150px);
  overflow-y: auto;
}

.requests-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 25px;
  height: 100%;
}

.panel-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.panel-header h2 {
  color: #8b0000;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.filter-tabs {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.filter-tab {
  padding: 8px 16px !important;
  border: 1px solid #e0e0e0 !important;
  border-radius: 6px !important;
  background: white !important;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.filter-tab.active {
  background: #8b0000 !important;
  color: white !important;
  border-color: #8b0000 !important;
}

.request-item {
  padding: 18px !important;
  border: 2px solid #e0e0e0 !important;
  border-radius: 10px !important;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s;
  background: white !important;
}

.request-item:hover {
  border-color: #8b0000 !important;
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(139, 0, 0, 0.15) !important;
}

.request-item.active {
  border-color: #8b0000 !important;
  background: #fff5f5 !important;
}

.request-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.request-id {
  font-weight: 600;
  color: #8b0000;
  font-size: 16px;
}

.request-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
}

.status-in-progress {
  background: #d1ecf1;
  color: #0c5460;
}

.status-approved {
  background: #d4edda;
  color: #155724;
}

.status-rejected {
  background: #f8d7da;
  color: #721c24;
}

.request-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 15px;
}

.request-meta {
  font-size: 13px;
  color: #666;
  margin-top: 8px;
}

.request-meta span {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.current-stage {
  margin-top: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
}

.current-stage strong {
  color: #8b0000;
}

.approval-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 30px;
  height: 100%;
  overflow-y: auto;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.request-details {
  margin-bottom: 30px;
  padding: 25px;
  background: #f8f9fa;
  border-radius: 10px;
  border-left: 4px solid #8b0000;
}

.request-details h3 {
  color: #8b0000;
  margin-bottom: 20px;
  font-size: 24px;
}

.detail-row {
  display: grid;
  grid-template-columns: 150px 1fr;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 600;
  color: #666;
}

.detail-value {
  color: #333;
}

.request-details-text {
  background: white;
  padding: 15px;
  border-radius: 6px;
  margin-top: 10px;
  white-space: pre-wrap;
  line-height: 1.6;
  font-family: monospace;
  font-size: 12px;
}

.steps-container {
  margin: 30px 0;
}

.steps-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.steps {
  display: flex;
  justify-content: space-between;
  position: relative;
  margin-bottom: 40px;
  gap: 20px;
}

.steps::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  height: 3px;
  background: #e0e0e0;
  z-index: 0;
}

.step {
  text-align: center;
  position: relative;
  z-index: 1;
  flex: 1;
}

.step-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 10px;
  font-weight: 600;
  transition: all 0.3s;
}

.step.active .step-circle {
  background: #8b0000;
  color: white;
  box-shadow: 0 0 0 4px rgba(139, 0, 0, 0.2);
}

.step.completed .step-circle {
  background: #28a745;
  color: white;
}

.step.rejected .step-circle {
  background: #dc3545;
  color: white;
}

.step-label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.step.active .step-label {
  color: #8b0000;
  font-weight: 600;
}

.approval-cards {
  display: grid;
  gap: 20px;
}

.approval-card {
  border: 2px solid #e0e0e0 !important;
  border-radius: 10px !important;
  background: white !important;
  transition: all 0.3s;
}

.approval-card.pending {
  border-color: #ffc107 !important;
  background: #fffbf0 !important;
}

.approval-card.approved {
  border-color: #28a745 !important;
  background: #f0f9f4 !important;
}

.approval-card.rejected {
  border-color: #dc3545 !important;
  background: #fff5f5 !important;
}

.approval-card-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.approval-status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

.approval-info {
  font-size: 14px;
  color: #666;
}

.approval-info strong {
  color: #333;
}

.comment-section label {
  font-weight: 600;
  color: #333;
}

.approval-actions {
  display: flex;
  gap: 15px;
}

.border-b {
  border-bottom: 2px solid #e0e0e0;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

@media (max-width: 1024px) {
  .main-layout {
    grid-template-columns: 1fr;
    height: auto;
  }

  .requests-panel-wrapper {
    max-height: 400px;
  }

  .approval-panel {
    height: auto;
  }
}
</style>
