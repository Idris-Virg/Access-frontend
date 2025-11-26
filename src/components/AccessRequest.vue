<template>
  <v-container class="container" fluid>
    <div class="corner-decoration corner-1"></div>
    <div class="corner-decoration corner-2"></div>

    <div class="header">
      <h1>Access Request Portal</h1>
      <p>Submit your access requests through our streamlined approval workflow</p>
    </div>

    <v-form ref="formRef" @submit.prevent="onSubmit">
      <v-row class="form-grid" dense>
        <v-col cols="12">
          <v-card class="service-box" flat>
            <div class="service-icon"><i class="fas fa-robot"></i></div>
            <div class="service-content">
              <strong>Application Database Access</strong>
              <small>For an existing application that needs access to a database. This includes read/write permissions, connection strings, and environment-specific access controls.</small>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="form-section" flat>
            <v-text-field label="Name" v-model="model.requester_name" :rules="[rules.required]" outlined dense />
            <v-text-field label="Email" v-model="model.requester_email" :rules="[rules.required, rules.email]" outlined dense type="email" />
            <v-select :items="requestTypes" v-model="model.request_type" label="Request Type" :rules="[rules.required]" outlined dense />
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="form-section" flat>
            <v-text-field label="Summary" v-model="model.summary" :rules="[rules.required]" outlined dense />
            <v-text-field label="Date Needed" v-model="model.date_needed" :rules="[rules.required]" outlined dense type="date" />
          </v-card>
        </v-col>

        <v-col cols="12">
          <v-card class="form-section full-width" flat>
            <v-textarea label="Why is this needed?" v-model="model.description" :rules="[rules.required]" outlined rows="4" />
            <v-textarea label="Technical Requirements & Description" v-model="model.reason" :rules="[rules.required]" outlined rows="4" />
          </v-card>
        </v-col>

        <v-col cols="12">
          <div class="note">
            <strong>Approval Workflow</strong>
            This request will be automatically routed to your Manager and the relevant resource owner for approval. You will receive notifications at each stage of the process.
          </div>
        </v-col>

        <v-col cols="12" class="d-flex justify-center">
          <v-btn color="red darken-2" class="ma-4" type="submit" large>
            <v-icon left>mdi-send</v-icon>
            Submit Access Request
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'

const formRef = ref(null)

const requestTypes = [
  'Application Database Access',
  'Password Recovery',
  'API Access',
  'System Permissions',
]

const model = ref({
  requester_name: '',
  requester_email: '',
  request_type: '',
  summary: '',
  date_needed: '',
  description: '',
  reason: '',
})

const rules = {
  required: (v) => (!!v && v.toString().trim() !== '') || 'Required',
  email: (v) => /\S+@\S+\.\S+/.test(v) || 'Invalid email',
}

const onSubmit = async () => {
  if (!model.value.requester_name || !model.value.requester_email) {
    alert('Please fill required fields.')
    return
  }

  const requestDetails = {
    summary: model.value.summary,
    description: model.value.description,
    reason: model.value.reason,
    date_needed: model.value.date_needed,
  }

  const formData = {
    requester_name: model.value.requester_name,
    requester_email: model.value.requester_email,
    request_type: model.value.request_type,
    request_details: JSON.stringify(requestDetails),
  }
  
  try {
    const res = await fetch('http://localhost:5501/api/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    const data = await res.json()

    if (res.ok) {
      alert('Request Submitted Successfully!')
      model.value = { requester_name: '', requester_email: '', request_type: '', summary: '', date_needed: '', description: '', reason: '' }
      if (formRef.value && typeof formRef.value.reset === 'function') formRef.value.reset()
    } else {
      alert('❌ Error: ' + (data.error || 'Unknown error'))
    }
  } catch (error) {
    alert('❌ Failed to submit request.')
    console.error(error)
  }
}
</script>

<style scoped>
/* Reused and adapted styles from your HTML for a similar look inside Vuetify */
.container {
  max-width: 1200px;
  margin: 50px auto;
  background: white;
  padding: 50px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(220, 53, 69, 0.15), 0 0 0 1px rgba(255,255,255,0.1);
  position: relative;
  overflow: hidden;
}
.container::before { content: ''; position: absolute; top:0; left:0; right:0; height:6px; background: linear-gradient(90deg,#ff6b6b,#dc3545,#c82333,#a71e2a); box-shadow:0 2px 10px rgba(173,31,43,0.3)}
.header { text-align:center; margin-bottom:40px; position:relative; z-index:1 }
.header h1 { font-size:42px; font-weight:800; background: linear-gradient(135deg,#dc3545,#a71e2a); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom:15px; letter-spacing:-0.5px }
.header p { font-size:18px; color:#666; max-width:600px; margin:0 auto; line-height:1.6 }
.form-grid { gap:30px }
.form-section { background: linear-gradient(135deg,#fafafa,#f0f0f0); padding:24px; border-radius:16px; border:1px solid rgba(220,53,69,0.08) }
.service-box { background: linear-gradient(135deg,#fff5f5,#ffe6e6); border:2px solid #dc3545; padding:18px; border-radius:16px; margin-bottom:18px; box-shadow:0 10px 30px rgba(220,53,69,0.08); display:flex; align-items:center }
.service-icon { font-size:32px; color:#dc3545; margin-right:20px; background: rgba(221,206,207,0.06); padding:12px; border-radius:12px }
.service-content strong { font-size:18px; color:#a71e2a; display:block; margin-bottom:6px; font-weight:700 }
.note { margin-top:18px; font-size:15px; color:#a71e2a; background: linear-gradient(135deg,#fff5f5,#ffe6e6); border-left:5px solid #dc3545; padding:15px 18px; border-radius:10px; font-weight:600 }
.full-width { width:100% }

/* make v-text-field and v-textarea blend a bit with the design */
.v-input__control { background: white }

/* corner decorations */
.corner-decoration { position:absolute; width:120px; height:120px; z-index:0 }
.corner-1 { top:20px; right:20px; background: radial-gradient(circle, rgba(220,53,69,0.05) 0%, transparent 70%) }
.corner-2 { bottom:20px; left:20px; background: radial-gradient(circle, rgba(220,53,69,0.05) 0%, transparent 70%) }
</style>
