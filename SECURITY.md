# Security Policy

## Supported versions

Only the latest published version receives security updates. Please upgrade before reporting.

## Reporting a vulnerability

**Please do not open public issues for security vulnerabilities.**

Instead, report privately using one of the following:

1. **Preferred:** Open a private security advisory at [https://github.com/NikPnevmatikos/Html-Renderer/security/advisories/new](https://github.com/NikPnevmatikos/Html-Renderer/security/advisories/new)
2. Email: `nikpnevmatikos.oss@gmail.com`

Include:

- A description of the issue
- Steps to reproduce (minimal HTML input, library version, platform)
- Impact assessment if you have one

You will receive an initial response within a few days. We appreciate responsible disclosure and will credit you in the release notes unless you prefer otherwise.

## Scope

Since the library renders untrusted HTML, relevant concerns include:

- Unexpected tag/attribute handling that could leak state
- Regex-based parsing errors that could cause denial of service (catastrophic backtracking)
- URL-handling in `<a href>` that could bypass the `onLinkPress` sandbox
- Any code path that uses `Linking.openURL` with unsanitized user input

Bugs outside this scope (rendering glitches, layout issues) should be filed as regular public issues.
