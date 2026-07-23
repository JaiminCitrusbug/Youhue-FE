/** Barrel — all approved screen components (72 In-scope screens). Presentational, on the shared library. */

/* Representative (◆ approved) */
export * from './ClassDashboard'        // SC-027
export * from './AlertDetail'           // SC-039
export * from './StudentCheckIn'        // SC-023
export * from './MyHistory'             // SC-025

/* Teacher safeguarding spine */
export * from './AlertsTriageQueue'     // SC-038
export * from './StudentDetail'         // SC-028
export * from './GuidedResponse'        // SC-040
export * from './PrivateNote'           // SC-041
export * from './InterventionLog'       // SC-042
export * from './Notifications'         // SC-054

/* Student app */
export * from './StudentReflection'     // SC-023 (step 2)
export * from './StudentSignInCode'     // SC-020
export * from './StudentSignInName'     // SC-021
export * from './StudentSignInQR'       // SC-022
export * from './PostCheckInActivity'   // SC-024

/* Auth & onboarding */
export * from './StaffSignIn'           // SC-014
export * from './ForgotPasswordRequest' // SC-015
export * from './CheckEmail'            // SC-016
export * from './SetNewPassword'        // SC-017
export * from './LinkSSO'               // SC-018
export * from './AcceptInvite'          // SC-019
export * from './RegisterSchool'        // SC-026
export * from './InviteColleague'       // SC-059
export * from './AlertEmail'            // SC-087
export * from './TransactionalEmail'    // SC-090

/* Teacher tools */
export * from './RosterImport'          // SC-036
export * from './RosterList'            // SC-037
export * from './CalendarManagement'    // SC-062
export * from './AccessWindow'          // SC-063
export * from './GroupsList'            // SC-030
export * from './GroupEdit'             // SC-031
export * from './GroupMembers'          // SC-032
export * from './CustomCheckInBuilder'  // SC-033
export * from './CustomTargetSchedule'  // SC-034
export * from './CustomCheckInsList'    // SC-035
export * from './AIThemeAnalysis'       // SC-044
export * from './ActivitiesLibrary'     // SC-045
export * from './ActivityRunAssign'     // SC-046
export * from './ActivityAuthor'        // SC-047
export * from './AIActivitySuggestion'  // SC-048
export * from './ReportsList'           // SC-049
export * from './ReportView'            // SC-050
export * from './ReportExport'          // SC-051

/* Leadership */
export * from './WholeSchoolOverview'   // SC-056
export * from './StaffManagement'       // SC-057
export * from './ConcernWords'          // SC-060
export * from './AlertRouting'          // SC-061
export * from './DataExport'            // SC-064
export * from './DataDeletion'          // SC-065
export * from './Subscription'          // SC-085
export * from './TrialBanner'           // SC-086
export * from './ConsentAttestation'    // SC-088

/* District & internal admin console */
export * from './DistrictComparison'    // SC-068
export * from './SchoolApprovals'       // SC-069
export * from './ApprovalDecision'      // SC-070
export * from './AdminSignIn'           // SC-073 (AdminSignIn + AdminMfaChallenge)
export * from './AdminDashboard'        // SC-074
export * from './SchoolAccounts'        // SC-075
export * from './TrialManagement'       // SC-076
export * from './SupportAccess'         // SC-077
export * from './SeedActivities'        // SC-078
export * from './DefaultWordLists'      // SC-079
export * from './AuditLog'              // SC-080
export * from './AdminProfile'          // SC-081
export * from './Profile'               // SC-052
export * from './PersonalSettings'      // SC-053

/* System & legal */
export * from './TermsOfService'        // SC-008
export * from './PrivacyPolicy'         // SC-009
export * from './CoppaFerpa'            // SC-010
export * from './NotFound404'           // SC-011
export * from './ServerError500'        // SC-012
export * from './Maintenance'           // SC-013
