# Security Policy

## Supported versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a vulnerability

**Please do not file a public GitHub issue for security vulnerabilities.**

Report privately by email to **wesdeland@gmail.com**. Please include:

- A clear description of the issue and its impact
- Steps to reproduce, or a proof-of-concept if possible
- The commit / version affected
- Your assessment of severity (e.g. "an attacker on the LAN can read other
  users' rotation data")

You can expect an acknowledgement within **7 days**. After triage I will
either:

- Confirm the issue and start working on a fix (with an estimated disclosure
  timeline), or
- Explain why it does not meet the bar for a security advisory.

## Scope

In-scope concerns include, but are not limited to:

- Authentication / authorization bypasses (note: this app has **no auth** by
  design — see README "Notes" — so anyone with LAN access can read/write)
- SQL injection in the API layer
- Server-side request forgery via the OTel exporters
- Path traversal in static-file or DB handling
- Prototype pollution in dependencies

Out-of-scope:

- Vulnerabilities in the upstream Node.js / Vite / React / OTel SDK
  ecosystem (please report those to the respective maintainers)
- Lack of HTTPS / TLS on the local network (the app is designed to be
  fronted by a reverse proxy that handles TLS in production)

## Disclosure policy

I follow a **coordinated disclosure** model. Please give me a reasonable
window (typically 90 days) to release a fix before publishing details.

## Recognition

Researchers who follow this policy and whose reports lead to a fix will be
credited in the release notes (unless they prefer to remain anonymous).
