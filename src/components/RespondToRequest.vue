<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleCancel">
    <div class="modal-container">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <h2 class="modal-title">Respond to Request</h2>
          <p class="modal-subtitle">Add resolution notes or respond to the requester</p>
        </div>
        <i class="fas fa-comment-dots header-icon"></i>
      </div>

      <!-- Form Body -->
      <div class="modal-body">
        <!-- Response Notes Text Area -->
        <div class="form-field">
          <textarea
            v-model="responseNotes"
            class="response-textarea"
            placeholder="Response Notes"
            rows="6"
          ></textarea>
        </div>

        <!-- Action Dropdown -->
        <div class="form-field">
          <div class="action-label-wrapper">
            <span class="action-label">Action</span>
            <div class="label-line"></div>
          </div>
          <div class="select-wrapper">
            <select v-model="selectedAction" class="action-select">
              <option value="respond-only">Respond Only</option>
              <option value="resolve">Resolve</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
            </select>
            <i class="fas fa-chevron-down select-arrow"></i>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="modal-footer">
        <button class="btn-cancel" @click="handleCancel">Cancel</button>
        <button class="btn-submit" @click="handleSubmit">
          <i class="fas fa-paper-plane"></i>
          Submit Response
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RespondToRequest',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    request: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'submit'],
  data() {
    return {
      responseNotes: '',
      selectedAction: 'respond-only'
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        // Reset form when modal opens
        this.responseNotes = ''
        this.selectedAction = 'respond-only'
      }
    }
  },
  methods: {
    handleCancel() {
      this.$emit('close')
    },
    handleSubmit() {
      this.$emit('submit', {
        responseNotes: this.responseNotes,
        action: this.selectedAction,
        request: this.request
      })
      this.handleCancel()
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-container {
  background: #faf9f6;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Header */
.modal-header {
  background: #8b0000;
  color: white;
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-content {
  flex: 1;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: white;
}

.modal-subtitle {
  font-size: 14px;
  margin: 0;
  opacity: 0.95;
  color: white;
}

.header-icon {
  font-size: 24px;
  color: white;
  opacity: 0.9;
}

/* Body */
.modal-body {
  padding: 28px;
  background: #faf9f6;
}

.form-field {
  margin-bottom: 24px;
}

.form-field:last-child {
  margin-bottom: 0;
}

.response-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  min-height: 120px;
  background: white;
  color: #333;
  box-sizing: border-box;
}

.response-textarea:focus {
  outline: none;
  border-color: #8b0000;
  box-shadow: 0 0 0 3px rgba(139, 0, 0, 0.1);
}

.response-textarea::placeholder {
  color: #999;
}

/* Action Dropdown */
.action-label-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.action-label {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
}

.label-line {
  flex: 1;
  height: 1px;
  background: #e0e0e0;
}

.select-wrapper {
  position: relative;
}

.action-select {
  width: 100%;
  padding: 12px 40px 12px 15px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-family: inherit;
  font-size: 14px;
  background: white;
  color: #333;
  appearance: none;
  cursor: pointer;
  box-sizing: border-box;
}

.action-select:focus {
  outline: none;
  border-color: #8b0000;
  box-shadow: 0 0 0 3px rgba(139, 0, 0, 0.1);
}

.select-arrow {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #666;
  font-size: 12px;
}

/* Footer */
.modal-footer {
  padding: 20px 28px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #faf9f6;
  border-top: 1px solid #e0e0e0;
}

.btn-cancel {
  padding: 10px 20px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  background: white;
  color: #666;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f5f5f5;
  border-color: #bbb;
}

.btn-submit {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: #8b0000;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-submit:hover {
  background: #b22222;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 0, 0, 0.3);
}

.btn-submit:active {
  transform: translateY(0);
}

@media (max-width: 640px) {
  .modal-container {
    width: 95%;
    margin: 20px;
  }

  .modal-header {
    padding: 20px;
  }

  .modal-body {
    padding: 20px;
  }

  .modal-footer {
    padding: 16px 20px;
    flex-direction: column-reverse;
  }

  .btn-cancel,
  .btn-submit {
    width: 100%;
  }
}
</style>
