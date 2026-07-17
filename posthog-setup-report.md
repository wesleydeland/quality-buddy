# PostHog post-wizard report

PostHog is now initialized for the Vite browser application and the Express server. Browser SDK configuration reads Vite environment variables, while the server reads runtime environment variables. The integration preserves default autocapture and session recording, captures errors from failed API responses, and forwards browser distinct and session IDs to the backend for the server-side sprint event.

| Event name | Description | File |
| --- | --- | --- |
| `team_member_added` | Captures successful addition of a teammate to the rotation. | `frontend/src/components/AddMemberForm.jsx` |
| `team_member_removed` | Captures successful removal of a teammate from the rotation. | `frontend/src/components/TeamManager.jsx` |
| `team_order_updated` | Captures successful updates to the teammate rotation order. | `frontend/src/components/TeamManager.jsx` |
| `sprint_created` | Captures successful generation of a quality buddy sprint. | `frontend/src/components/NewSprintForm.jsx` |
| `sprint_deleted` | Captures successful deletion of a quality buddy sprint. | `frontend/src/components/CurrentSprintView.jsx` |
| `sprint_history_opened` | Captures opening a historical sprint's assignment details. | `frontend/src/components/SprintHistory.jsx` |
| `slack_assignments_copied` | Captures copying a sprint's assignment message for Slack. | `frontend/src/components/SlackCopyButton.jsx` |
| `assignment_image_exported` | Captures successful clipboard or download export of sprint assignments as an image. | `frontend/src/components/ImageCopyButton.jsx` |
| `sprint_created_server` | Captures the completed sprint creation operation from the server. | `backend/src/routes/sprints.js` |

## Next steps

- [Analytics basics (wizard) dashboard](https://us.posthog.com/project/516078/dashboard/1867172)
- Insights were not created yet because the newly added events have not reached the project schema. Generate production or development activity, then add trends for sprint creation, member changes, and assignment exports.

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add the exact PostHog env var names you added to `.env.example` and any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.

### Agent skill

An agent skill folder remains in the project for future Claude Code work. It provides current framework-specific PostHog integration guidance.
