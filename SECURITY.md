# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Design Guard, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email the maintainer directly or use [GitHub private vulnerability reporting](https://github.com/freptar0/design-guard/security/advisories/new)
3. Include a description of the vulnerability and steps to reproduce

We will respond within 48 hours and work with you on a fix.

## API Key Safety

- **Never commit** your `.env` file or `.guardrc.json` -- both are gitignored by default
- Store `STITCH_API_KEY` in environment variables or `.env` files only
- If you accidentally expose an API key, revoke it immediately at [stitch.withgoogle.com](https://stitch.withgoogle.com)

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |
