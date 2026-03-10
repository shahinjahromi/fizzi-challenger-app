# Build Roadmap

## Implementation Steps

1. **Project Structure**
   - Define the folder structure for the app.
   - Set up essential files and configurations.

2. **Authentication Module**
   - Implement user authentication.
   - Include signup/login functionality.
   - Secure password storage and recovery options.

3. **Workspaces**
   - Create the workspace feature for project collaborations.
   - Allow multiple users to work in isolated environments.

4. **Accounts**
   - Manage user accounts and profiles.
   - Ensure smooth account creation and customization options.

5. **Money Movement**
   - Build functionalities for transferring and managing funds.
   - Integrate APIs for banking transactions.

6. **Statements**
   - Generate financial statements for users.
   - Provide downloadable and printable formats.

7. **Messaging**
   - Implement a messaging system for user communication.
   - Enable real-time notifications and updates.

8. **Profile/Security**
   - Enhance user profile management features.
   - Implement security measures for data protection.

9. **Limits**
   - Set transaction limits and user restrictions as needed.
   - Introduce alerts for exceeding limits.

10. **Local Deployment**
    - Guide for deploying the app locally for testing.
    - Include setup instructions and configuration files.

11. **Azure Pipeline Setup**
    - Configure Azure DevOps pipelines for CI/CD.
    - Establish deployment workflows and testing automation.

---

## UI Design Requirements & Traceability

12. **UI Implementation and Conformance**
    - All UI layouts, screens, and components must conform to business requirements in `docs/requirements/`.
    - All UI designs must match:
      - The latest Figma workspace: [OMB Future State](https://figma.com/design/6frH5xNjfyojd27BK3E07a/OMB-Future-State?node-id=4336-2&t=XcbuMuK5rT8Y9p7J-1)
      - Exported assets/specs in `docs/design/`
      - Style tokens, icons, component specs provided in the repo

    - **Integration Steps:**
      - Review both requirements and relevant Figma boards before building any UI feature.
      - Use exported design tokens, SVGs, or guideline documents from `docs/design/`.
      - Confirm all layouts, colors, fonts, spacing match both Figma/`docs/design`.
      - Ensure accessibility and responsiveness reflect Figma and exported specs.

    - **Validation & Review:**
      - Visually compare UI with Figma and exported assets.
      - Use the UI section of `docs/requirements/REVIEW_CHECKLIST.md`.
      - Reviewer validates UI conformance and documents checks in PR.

    - **Acceptance Criteria:**
      - No UI code merged until it meets requirements, Figma design, and design exports.
      - Any deviations documented and approved.

    - **Continuous Sync:**
      - Refresh exported assets in `docs/design` whenever Figma updates.
      - Update design review checklist to include “docs/design asset reviewed.”

    - **Traceability:**
      - Decisions, assets, and checks linked in PRs and tracked in `docs/traceability/traceability_matrix.csv`.

---

## Summary

This roadmap ensures all modules (backend, frontend, deployment, CI/CD) are built according to business requirements, and all UI development stays in sync with Figma and documented design assets. All reviewers and Copilot agents must reference both textual requirements and design resources for their workflow.
