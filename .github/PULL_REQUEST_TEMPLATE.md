name: Pull request
description: Fill in the relevant sections. If your change is small (typo, one-line fix), most of these can be skipped.
body:
  - type: markdown
    attributes:
      value: |
        Thanks for the contribution! Please make sure `npm test` passes locally
        before requesting review.

  - type: dropdown
    id: type
    attributes:
      label: Type of change
      description: Pick the closest match.
      options:
        - Bug fix
        - New feature
        - Documentation
        - Refactor / cleanup
        - Tests
        - Other
    validations:
      required: true

  - type: textarea
    id: summary
    attributes:
      label: Summary
      description: One or two sentences — what does this PR do and why?
    validations:
      required: true

  - type: textarea
    id: changes
    attributes:
      label: Changes
      description: Bullet list of the most important changes. Mention any breaking changes.
    validations:
      required: false

  - type: textarea
    id: testing
    attributes:
      label: How was this tested?
      description: Describe how you verified the change works.
    validations:
      required: false

  - type: checkboxes
    id: checklist
    attributes:
      label: Checklist
      options:
        - label: `npm test` passes locally
        - label: I have updated the README / docs (if user-facing behavior changed)
        - label: I have added or updated tests (if behavior changed)
        - label: No new secrets, internal URLs, or company names introduced
