<template>
  <div class="approval-workflow-app">
    <!-- Navbar -->
    <div class="navbar">
      <img src="https://res.cloudinary.com/summitbank/image/upload/v1757037165/Summit_Logo_2_why0cs.png" alt="Summit Bank" class="navbar-logo" />
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
                @click="currentFilter = filter.value; currentPage = 1"
                :class="['filter-tab', { active: currentFilter === filter.value }]"
              >
                {{ filter.label }}
              </div>
            </div>
          </div>

          <!-- Requests Table -->
          <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Loading requests...</p>
          </div>
          <div v-else-if="filteredRequests.length === 0" class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>No requests found</p>
          </div>
          <div v-else class="table-wrapper">
            <table class="requests-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Requester</th>
                  <th>Status</th>
                  <th>Stage</th>
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="request in paginatedRequests"
                  :key="request.id"
                  @click="selectRequest(request.id)"
                  :class="['request-row', { active: currentRequestId === request.id }]"
                >
                  <td class="request-id">#{{ request.id }}</td>
                  <td class="request-type">{{ request.request_type || 'Access Request' }}</td>
                  <td class="request-requester">{{ request.requester_name }}</td>
                  <td>
                    <div :class="['request-status', `status-${request.status.toLowerCase().replace(' ', '-')}`]">
                      {{ request.status }}
                    </div>
                  </td>
                  <td class="request-stage">{{ request.current_stage || 'Pending' }}</td>
                  <td class="request-progress">{{ request.approved_count || 0 }}/{{ request.total_approvals || 3 }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
            <div class="pagination">
              <button 
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="pagination-btn"
              >
                <i class="fas fa-chevron-left"></i>
              </button>
              <div class="pagination-info">
                Page {{ currentPage }} of {{ totalPages }} ({{ filteredRequests.length }} total)
              </div>
              <button 
                @click="currentPage = Math.min(totalPages, currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="pagination-btn"
              >
                <i class="fas fa-chevron-right"></i>
              </button>
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

            <!-- Admin force-approve action (visible with flag) -->
            <div v-if="flags && flags.canForceApprove" style="margin-bottom:12px; text-align:right;">
              <button class="btn btn-danger" @click="forceApproveCurrentRequest">Force Approve Current Stage</button>
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

            <!-- Approval Cards - Only show stages for current user's role -->
            <div class="approval-cards">
              <div
                v-for="(stage, index) in selectedRequest.workflow"
                :key="index"
                v-show="isStageForCurrentRole(stage)"
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
  props: {
    currentUser: { type: Object, default: null },
    flags: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      API_BASE: 'http://localhost:5501/api',
      loading: true,
      currentFilter: 'all',
      currentRequestId: null,
      currentPage: 1,
      itemsPerPage: 10,
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
      let requests = this.allRequests

      // All roles see all requests
      
      // Apply status filters
      if (this.currentFilter === 'pending') {
        return requests.filter(r => r.status === 'Pending')
      } else if (this.currentFilter === 'in-progress') {
        return requests.filter(r => r.status === 'In Progress')
      }
      return requests
    },
    totalPages() {
      return Math.ceil(this.filteredRequests.length / this.itemsPerPage)
    },
    paginatedRequests() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.filteredRequests.slice(start, end)
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
      // Require logged-in user
      if (!this.currentUser) {
        this.showNotification('Please login to approve requests', 'error')
        return
      }

      // Role-based authorization: require user's role matches the stage role
      const userRole = this.canonicalRole(this.currentUser.role)
      const stageRole = this.canonicalRole(stage.role)
      if (!userRole || !stageRole) {
        this.showNotification('Unable to determine role for authorization. Contact admin.', 'error')
        return
      }
      if (userRole !== stageRole) {
        this.showNotification('You are not authorized to approve this stage', 'error')
        return
      }

      const approverName = this.currentUser.name || 'Approver'
      const approverEmail = this.currentUser.email || ''
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
          // If the decision was Rejected, bounce the request back to the previous approver
          if ((status || '').toString().toLowerCase() === 'rejected') {
            try {
              // Update local workflow state so the UI reflects the bounce immediately
              const wf = this.selectedRequest && this.selectedRequest.workflow ? this.selectedRequest.workflow : null
              if (wf && wf[stageIndex]) {
                // mark current stage rejected
                wf[stageIndex].status = 'Rejected'
                wf[stageIndex].approver_name = approverName
                wf[stageIndex].approver_email = approverEmail
                wf[stageIndex].decided_at = new Date().toISOString()

                // move back to previous stage (if exists) and set it to Pending so that previous approver can act
                const prevIndex = stageIndex - 1
                if (prevIndex >= 0 && wf[prevIndex]) {
                  wf[prevIndex].status = 'Pending'
                  // clear any previous approver details so the previous approver receives it fresh
                  delete wf[prevIndex].approver_name
                  delete wf[prevIndex].approver_email
                  delete wf[prevIndex].decided_at
                }

                // update request-level status to reflect it's back in progress
                if (this.selectedRequest.request) {
                  this.selectedRequest.request.status = 'In Progress'
                }
              }
            } catch (e) {
              console.error('Error applying local bounce-back update:', e)
            }

            // reload list so request summaries reflect new progress, but avoid re-fetching details which we updated locally
            await this.loadRequests()
          } else {
            // For approvals (non-reject), re-fetch details from server to get authoritative state
            await this.selectRequest(this.currentRequestId)
            await this.loadRequests()
          }
        } else {
          const error = await response.json()
          this.showNotification(error.error || 'Failed to update approval', 'error')
        }
      } catch (error) {
        console.error('Error updating approval:', error)
        this.showNotification('Error updating approval. Please try again.', 'error')
      }
    },
    // Admin-only force approve for current request (if allowed by flags)
    async forceApproveCurrentRequest() {
      if (!this.flags || !this.flags.canForceApprove) {
        this.showNotification('Not authorized to force-approve', 'error')
        return
      }
      if (!this.selectedRequest) {
        this.showNotification('No request selected', 'error')
        return
      }
      const pendingIndex = this.selectedRequest.workflow.findIndex(s => s.status === 'Pending')
      if (pendingIndex === -1) {
        this.showNotification('No pending stage to approve', 'error')
        return
      }
      await this.updateApproval(pendingIndex, 'Approved')
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
      const status = (stage.status || '').toString().toLowerCase()
      if (status === 'approved') return 'completed'
      if (status === 'rejected') return 'rejected'
      const pendingIndex = this.selectedRequest && this.selectedRequest.workflow
        ? this.selectedRequest.workflow.findIndex(s => (s.status || '').toString().toLowerCase() === 'pending')
        : -1
      if (status === 'pending' && pendingIndex === index) return 'active'
      return ''
    },
    getCardClass(stage) {
      const status = (stage.status || '').toString().toLowerCase()
      if (status === 'approved') return 'approved'
      if (status === 'rejected') return 'rejected'
      return 'pending'
    },
    canApprove(stage, index) {
      const status = (stage.status || '').toString().toLowerCase()
      if (status !== 'pending') return false
      // Must be logged in
      if (!this.currentUser) return false

      // Use canonical roles to avoid accidental matches (e.g. 'super_admin' vs 'superadmin', 'users' vs 'user')
      const userCanonical = this.canonicalRole(this.currentUser.role)
      const stageCanonical = this.canonicalRole(stage.role)

      // Only allow action when both canonicals are defined and exactly equal
      if (!userCanonical || !stageCanonical) return false

      // Enforce sequential approvals: all previous stages must be Approved
      const wf = this.selectedRequest && this.selectedRequest.workflow ? this.selectedRequest.workflow : null
      if (wf) {
        for (let i = 0; i < index; i++) {
          const prevStatus = (wf[i].status || '').toString().toLowerCase()
          if (prevStatus !== 'approved') return false
        }
      }

      return userCanonical === stageCanonical
    },
    isStageForCurrentRole(stage) {
      if (!this.currentUser) return false
      const userCanonical = this.canonicalRole(this.currentUser.role)
      const stageCanonical = this.canonicalRole(stage.role)
      if (!userCanonical || !stageCanonical) return false
      // Only show the approval card to the exact matching role
      return userCanonical === stageCanonical
    },
    // Return a canonical role string from various possible role inputs
    // e.g. 'Super_Admin', 'super-admin' -> 'superadmin'; 'users' -> 'user'
    canonicalRole(role) {
      try {
        if (!role) return ''
        // If role is an array, take first entry
        if (Array.isArray(role) && role.length > 0) {
          role = role[0]
        }
        let r = role.toString().toLowerCase().trim()
        // split on commas/slashes if multiple roles provided, take first meaningful token
        if (r.indexOf(',') !== -1) r = r.split(',')[0]
        if (r.indexOf('/') !== -1) r = r.split('/')[0]
        r = r.replace(/[^a-z0-9]/g, '')
        // map common synonyms
        if (r === 'administrator') return 'admin'
        if (r === 'superadministrator' || r === 'superadministrator') return 'superadmin'
        if (r === 'super' || r === 'superadmin' || r === 'super_admin') return 'superadmin'
        if (r === 'users' || r === 'enduser' || r === 'employee') return 'user'
        if (r === 'mgr' || r === 'managerrole') return 'manager'
        if (r === 'complianceofficer' || r === 'compliance_team') return 'compliance'
        // common short forms
        if (r === 'admin') return 'admin'
        if (r === 'manager') return 'manager'
        if (r === 'compliance') return 'compliance'
        if (r === 'user') return 'user'
        // fallback: return cleaned token as-is
        return r
      } catch {
        return ''
      }
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
  gap: 15px;
}

.navbar-logo {
  height: 45px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.main-layout {
  display: grid;
  grid-template-columns: 500px 1fr;
  gap: 30px;
  height: calc(100vh - 150px);
}

.requests-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 25px;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.panel-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
  flex-shrink: 0;
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
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.filter-tab:hover {
  background: #f5f5f5;
}

.filter-tab.active {
  background: #8b0000;
  color: white;
  border-color: #8b0000;
}

.table-wrapper {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.requests-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-bottom: 15px;
}

.requests-table thead {
  position: sticky;
  top: 0;
  background: #f8f9fa;
  z-index: 10;
}

.requests-table th {
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  color: #8b0000;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
}

.requests-table tbody {
  flex: 1;
}

.request-row {
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.3s;
  padding: 0;
}

.request-row:hover {
  background-color: #f5f5f5;
}

.request-row.active {
  background-color: #fff5f5;
  border-left: 4px solid #8b0000;
}

.request-row td {
  padding: 12px 8px;
  border-bottom: 1px solid #e0e0e0;
}

.request-id {
  font-weight: 600;
  color: #8b0000;
}

.request-type {
  font-weight: 500;
  color: #333;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.request-requester {
  color: #666;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.request-status {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
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

.request-stage {
  color: #666;
  font-size: 12px;
}

.request-progress {
  text-align: center;
  font-weight: 600;
  color: #8b0000;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 15px;
  border-top: 2px solid #e0e0e0;
  flex-shrink: 0;
}

.pagination-btn {
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  color: #8b0000;
}

.pagination-btn:hover:not(:disabled) {
  background: #8b0000;
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 13px;
  color: #666;
  font-weight: 500;
  min-width: 200px;
  text-align: center;
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
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 25px;
  background: white;
  transition: all 0.3s;
}

.approval-card.pending {
  border-color: #ffc107;
  background: #fffbf0;
}

.approval-card.approved {
  border-color: #28a745;
  background: #f0f9f4;
}

.approval-card.rejected {
  border-color: #dc3545;
  background: #fff5f5;
}

.approval-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
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
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
}

.approval-info strong {
  color: #333;
}

.comment-section {
  margin-bottom: 20px;
}

.comment-section label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.comment-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: all 0.3s;
}

.comment-textarea:focus {
  outline: none;
  border-color: #8b0000;
  box-shadow: 0 0 0 3px rgba(139, 0, 0, 0.1);
}

.comment-textarea:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.approval-actions {
  display: flex;
  gap: 15px;
}

.btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-approve {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.btn-approve:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.btn-reject {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
}

.btn-reject:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

.notification.success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
}

.notification.error {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #8b0000;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .main-layout {
    grid-template-columns: 1fr;
    height: auto;
  }

  .requests-panel {
    max-height: 400px;
  }

  .approval-panel {
    height: auto;
  }
}
</style>
