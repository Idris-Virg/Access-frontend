<template>
  <div class="support-requests-app">
    <!-- Navbar -->
    <div class="navbar">
      <img src="https://res.cloudinary.com/summitbank/image/upload/v1757037165/Summit_Logo_2_why0cs.png" alt="Summit Bank" class="navbar-logo" />
      <span>Summit Bank — Approval Workflow Portal</span>
    </div>

    <!-- Main Content -->
    <div class="container">
      <div class="support-requests-wrapper">
        <!-- Header Section -->
        <div class="page-header">
          <h1 class="page-title">Support Requests</h1>
          <div class="total-badge">
            {{ filteredRequests.length }} Total
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
        <div v-else class="table-container">
          <table class="support-requests-table">
              <thead>
                <tr>
                <th>Request ID</th>
                  <th>Requester</th>
                <th>Subject</th>
                <th>Priority</th>
                  <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
                </tr>
              </thead>
              <tbody>
              <tr v-for="request in paginatedRequests" :key="request.id">
                <td>
                  <span :class="['request-id-badge', getRequestIdBadgeClass(request.id)]">
                    {{ formatRequestId(request.id) }}
                  </span>
                </td>
                <td>
                  <div class="requester-cell">
                    <div class="requester-avatar">
                      <i class="fas fa-user"></i>
                    </div>
                    <div class="requester-info">
                      <div class="requester-name">{{ request.requester_name }}</div>
                      <div class="requester-department">{{ getRequesterDepartment(request) }}</div>
                    </div>
                    </div>
                  </td>
                <td>
                  <div class="subject-cell">
                    <div class="subject-title">{{ getSubject(request) }}</div>
                    <div class="subject-description">{{ getSubjectDescription(request) }}</div>
                  </div>
                </td>
                <td>
                  <span :class="['priority-badge', getPriorityClass(request)]">
                    <i :class="['priority-icon', getPriorityIcon(request)]"></i>
                    {{ getPriorityText(request) }}
                  </span>
                </td>
                <td>
                  <span :class="['status-badge', getStatusClass(request)]">
                    <i :class="['status-icon', getStatusIcon(request)]"></i>
                    {{ request.status || 'Pending' }}
                  </span>
                </td>
                <td>
                  <div class="created-cell">
                    <div class="created-date">{{ formatDate(request.created_at) }}</div>
                    <div class="created-time">{{ formatTime(request.created_at) }}</div>
                  </div>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="action-btn" @click="viewRequest(request)" title="View">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button 
                      v-if="canComment(request)" 
                      class="action-btn" 
                      @click="openRespondModal(request)" 
                      title="Comment"
                    >
                      <i class="fas fa-comment"></i>
                    </button>
                    <button 
                      v-if="canResolve(request)" 
                      class="action-btn" 
                      @click="resolveRequest(request)" 
                      title="Resolve"
                    >
                      <i class="fas fa-check"></i>
                    </button>
                    <button 
                      v-if="canDelete(request)" 
                      class="action-btn delete-btn" 
                      @click="deleteRequest(request)" 
                      title="Delete"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
            <div class="pagination">
            <div class="pagination-left">
              <span class="items-per-page-label">Items per page:</span>
              <select v-model="itemsPerPage" class="items-per-page-select">
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            <div class="pagination-right">
              <span class="pagination-info">
                {{ startIndex }}-{{ endIndex }} of {{ filteredRequests.length }}
              </span>
              <button 
                @click="goToFirstPage"
                :disabled="currentPage === 1"
                class="pagination-btn"
                title="First page"
              >
                <i class="fas fa-angle-double-left"></i>
              </button>
              <button 
                @click="goToPreviousPage"
                :disabled="currentPage === 1"
                class="pagination-btn"
                title="Previous page"
              >
                <i class="fas fa-angle-left"></i>
              </button>
              <button 
                @click="goToNextPage"
                :disabled="currentPage === totalPages"
                class="pagination-btn"
                title="Next page"
              >
                <i class="fas fa-angle-right"></i>
              </button>
              <button 
                @click="goToLastPage"
                :disabled="currentPage === totalPages"
                class="pagination-btn"
                title="Last page"
              >
                <i class="fas fa-angle-double-right"></i>
                  </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Respond to Request Modal -->
    <RespondToRequest
      :visible="showRespondModal"
      :request="selectedRequestForResponse"
      @close="closeRespondModal"
      @submit="handleRespondSubmit"
    />

    <!-- Notifications -->
    <div v-if="notification.visible" :class="['notification', notification.type]">
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
import RespondToRequest from './RespondToRequest.vue'

export default {
  components: {
    RespondToRequest
  },
  props: {
    currentUser: { type: Object, default: null },
    flags: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      API_BASE: 'http://localhost:5501/api',
      loading: true,
      currentFilter: 'all',
        archiveMode: false,
        archiveStorageKey: 'approval_local_archive',
        localArchive: [],
      currentPage: 1,
      itemsPerPage: 10,
      allRequests: [],
      showRespondModal: false,
      selectedRequestForResponse: null,
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
      if (this.archiveMode) {
        let archive = this.localArchive || []
        if (this.currentFilter === 'pending') return archive.filter(r => r.status === 'Pending')
        if (this.currentFilter === 'in-progress') return archive.filter(r => r.status === 'In Progress')
        return archive
      }

      let requests = this.allRequests || []
      if (this.currentFilter === 'pending') {
        return requests.filter(r => (r.status || '').toString() === 'Pending')
      } else if (this.currentFilter === 'in-progress') {
        return requests.filter(r => (r.status || '').toString() === 'In Progress')
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
    },
    startIndex() {
      return this.filteredRequests.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1
    },
    endIndex() {
      const end = this.currentPage * this.itemsPerPage
      return Math.min(end, this.filteredRequests.length)
    }
  },
  watch: {
    itemsPerPage() {
      this.currentPage = 1
    }
  },
  methods: {
    async loadRequests() {
      try {
        this.loading = true
        if (this.archiveMode) {
          this.localArchive = this.loadLocalArchive() || []
          if ((!this.localArchive || this.localArchive.length === 0) && this.currentUser && this.canonicalRole(this.currentUser.role) === 'superadmin') {
            this.showNotification('No archived items available locally', 'info')
          }
          return
        }

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
    formatRequestId(id) {
      if (!id) return 'N/A'
      return `IT-2024-${String(id).padStart(3, '0')}`
    },
    getRequestIdBadgeClass(id) {
      const num = id % 3
      if (num === 0) return 'badge-orange'
      if (num === 1) return 'badge-blue'
      return 'badge-green'
    },
    getRequesterDepartment(request) {
      // Extract department from request data or use default
      return request.requester_department || request.department || 'Operations'
    },
    getSubject(request) {
      return request.request_type || request.subject || 'Access Request'
    },
    getSubjectDescription(request) {
      const desc = request.summary || request.request_details || request.description || ''
      if (typeof desc === 'object') {
        return JSON.stringify(desc).substring(0, 60) + '...'
      }
      return (desc || 'No description available').substring(0, 60) + (desc && desc.length > 60 ? '...' : '')
    },
    getPriorityText(request) {
      // Determine priority based on request data
      if (request.priority) return request.priority
      const status = (request.status || '').toString().toLowerCase()
      if (status.includes('critical') || status.includes('urgent')) return 'Critical'
      if (status.includes('high')) return 'High'
      if (status.includes('medium')) return 'Medium'
      return 'Low'
    },
    getPriorityClass(request) {
      const priority = this.getPriorityText(request).toLowerCase()
      if (priority === 'critical') return 'priority-critical'
      if (priority === 'high') return 'priority-high'
      if (priority === 'medium') return 'priority-medium'
      return 'priority-low'
    },
    getPriorityIcon(request) {
      const priority = this.getPriorityText(request).toLowerCase()
      if (priority === 'critical') return 'fas fa-exclamation-triangle'
      if (priority === 'high') return 'fas fa-arrow-up'
      if (priority === 'medium') return 'fas fa-minus'
      return 'fas fa-arrow-down'
    },
    getStatusClass(request) {
      const status = (request.status || 'Pending').toString().toLowerCase().replace(' ', '-')
      if (status === 'resolved') return 'status-resolved'
      if (status === 'in-progress') return 'status-in-progress'
      if (status === 'declined' || status === 'rejected') return 'status-declined'
      return 'status-pending'
    },
    getStatusIcon(request) {
      const status = (request.status || 'Pending').toString().toLowerCase()
      if (status === 'resolved') return 'fas fa-check'
      if (status === 'in-progress') return 'fas fa-spinner'
      if (status === 'declined' || status === 'rejected') return 'fas fa-times'
      return 'far fa-clock'
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    },
    formatTime(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
    },
    viewRequest(request) {
      // Handle view action
      console.log('View request:', request)
      this.showNotification('Viewing request details...', 'info')
    },
    openRespondModal(request) {
      this.selectedRequestForResponse = request
      this.showRespondModal = true
    },
    closeRespondModal() {
      this.showRespondModal = false
      this.selectedRequestForResponse = null
    },
    async handleRespondSubmit(data) {
      console.log('Respond to request:', data)
      this.showNotification('Response submitted successfully!', 'success')
      await this.loadRequests()
    },
    async resolveRequest(request) {
      if (confirm('Are you sure you want to resolve this request?')) {
        this.showNotification('Request resolved successfully!', 'success')
        await this.loadRequests()
      }
    },
    async deleteRequest(request) {
      if (confirm('Are you sure you want to delete this request?')) {
        this.showNotification('Request deleted successfully!', 'success')
            await this.loadRequests()
          }
    },
    canComment(request) {
      const status = (request.status || '').toString().toLowerCase()
      return status !== 'resolved' && status !== 'declined'
    },
    canResolve(request) {
      const status = (request.status || '').toString().toLowerCase()
      return status !== 'resolved' && status !== 'declined'
    },
    canDelete(request) {
      const status = (request.status || '').toString().toLowerCase()
      return status !== 'resolved' && status !== 'declined'
    },
    goToFirstPage() {
      this.currentPage = 1
    },
    goToPreviousPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },
    goToNextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    },
    goToLastPage() {
      this.currentPage = this.totalPages
    },
    toggleArchiveMode() {
      this.archiveMode = !this.archiveMode
      this.currentPage = 1
      this.loadRequests()
    },
    loadLocalArchive() {
      try {
        const raw = localStorage.getItem(this.archiveStorageKey)
        if (!raw) return []
        return JSON.parse(raw)
      } catch (e) {
        console.error('Failed to load local archive', e)
        return []
      }
    },
    showNotification(message, type = 'success') {
      this.notification = { visible: true, message, type }
      setTimeout(() => {
        this.notification.visible = false
      }, 3000)
    },
    canonicalRole(role) {
      try {
        if (!role) return ''
        if (Array.isArray(role) && role.length > 0) {
          role = role[0]
        }
        let r = role.toString().toLowerCase().trim()
        if (r.indexOf(',') !== -1) r = r.split(',')[0]
        if (r.indexOf('/') !== -1) r = r.split('/')[0]
        r = r.replace(/[^a-z0-9]/g, '')
        if (r === 'administrator') return 'admin'
        if (r === 'superadministrator' || r === 'superadministrator') return 'superadmin'
        if (r === 'super' || r === 'superadmin' || r === 'super_admin') return 'superadmin'
        if (r === 'users' || r === 'enduser' || r === 'employee') return 'user'
        if (r === 'mgr' || r === 'managerrole') return 'manager'
        if (r === 'complianceofficer' || r === 'compliance_team') return 'compliance'
        if (r === 'admin') return 'admin'
        if (r === 'manager') return 'manager'
        if (r === 'compliance') return 'compliance'
        if (r === 'user') return 'user'
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
.support-requests-app {
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

.support-requests-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 30px;
  min-height: calc(100vh - 200px);
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.total-badge {
  background: #ffc1cc;
  color: #333;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
}

/* Table */
.table-container {
  overflow-x: auto;
}

.support-requests-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.support-requests-table thead {
  background: #f5f5f5;
}

.support-requests-table th {
  padding: 14px 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  white-space: nowrap;
}

.support-requests-table tbody tr {
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s;
}

.support-requests-table tbody tr:hover {
  background-color: #f9f9f9;
}

.support-requests-table td {
  padding: 16px 12px;
  vertical-align: top;
}

/* Request ID Badge */
.request-id-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
}

.badge-orange {
  background: #ffe5cc;
  color: #cc6600;
}

.badge-blue {
  background: #cce5ff;
  color: #0066cc;
}

.badge-green {
  background: #ccffcc;
  color: #00cc00;
}

/* Requester Cell */
.requester-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.requester-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #666;
  font-size: 18px;
}

.requester-info {
  flex: 1;
}

.requester-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.requester-department {
  font-size: 12px;
  color: #666;
}

/* Subject Cell */
.subject-cell {
  max-width: 300px;
}

.subject-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.subject-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

/* Priority Badge */
.priority-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
}

.priority-high {
  background: #ffe5cc;
  color: #cc6600;
}

.priority-medium {
  background: #cce5ff;
  color: #0066cc;
}

.priority-low {
  background: #ccffcc;
  color: #00cc00;
}

.priority-critical {
  background: #ffcccc;
  color: #cc0000;
}

.priority-icon {
  font-size: 12px;
}

/* Status Badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 13px;
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

.status-resolved {
  background: #d4edda;
  color: #155724;
}

.status-declined {
  background: #f8d7da;
  color: #721c24;
}

.status-icon {
  font-size: 12px;
}

/* Created Cell */
.created-cell {
  font-size: 13px;
}

.created-date {
  color: #333;
  margin-bottom: 2px;
}

.created-time {
  color: #666;
  font-size: 12px;
}

/* Actions Cell */
.actions-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
  color: #333;
}

.action-btn.delete-btn:hover {
  background: #fff5f5;
  border-color: #ff6b6b;
  color: #cc0000;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  margin-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.pagination-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.items-per-page-label {
  font-size: 14px;
  color: #666;
}

.items-per-page-select {
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;
}

.pagination-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-info {
  font-size: 14px;
  color: #666;
  margin-right: 8px;
}

.pagination-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #ccc;
  color: #333;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading & Empty States */
.loading {
  text-align: center;
  padding: 60px 20px;
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

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* Notifications */
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

.notification.info {
  background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
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

/* Responsive */
@media (max-width: 1024px) {
  .support-requests-table {
    font-size: 12px;
  }

  .support-requests-table th,
  .support-requests-table td {
    padding: 10px 8px;
  }

  .subject-cell {
    max-width: 200px;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .pagination {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .pagination-left,
  .pagination-right {
    justify-content: center;
  }
}
</style>