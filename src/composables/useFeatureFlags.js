export function getFeatureFlagsForRole(role) {
  // normalize
  const r = (role || '').toString()
  const flags = {
    canBulkApprove: false,
    canForceApprove: false,
    showAdminTools: false,
    showComplianceReports: false,
    showTeamOverview: false
  }

  if (r === 'admin') {
    flags.canBulkApprove = true
    flags.canForceApprove = true
    flags.showAdminTools = true
    flags.showComplianceReports = true
    flags.showTeamOverview = true
  } else if (r === 'manager') {
    flags.canBulkApprove = true
    flags.showTeamOverview = true
  } else if (r === 'superadmin') {
    flags.showTeamOverview = true
  } else if (r === 'compliance') {
    flags.showComplianceReports = true
  }

  return flags
}
