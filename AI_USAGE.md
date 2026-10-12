# AI usage

## Tools

- **Claude (Anthropic, Claude Opus 5.5, in the Claude app with a code workspace).** Used for planning, writing code, running it, and testing.

## How I used it

**Planning and stack choice.** Before any code, I asked Claude to compare the allowed stacks (Node/Express, FastAPI, Django, NestJS; Postgres vs MongoDB) against what I can confidently explain. I chose FastAPI + PostgreSQL because the patterns map onto the Java/Spring work I do day to day:

| Here | Spring equivalent |
| --- | --- |
| router | `@RestController` |
| Pydantic models | DTOs + Bean Validation |
| SQLAlchemy | Hibernate/JPA |
| Alembic | Flyway |

I also asked for a deliberately small scope, plain code over clever abstractions, and one commit per logical step, so the history shows how it was built.

**Code generation.** Claude wrote the large majority of the code (backend, frontend, tests, configs) step by step, matching the commit history. It ran the code against a real local PostgreSQL after each step rather than generating everything at once.

**Verification during the build.** Each step was checked before committing:

- **API calls.** Every endpoint was exercised with `curl`, including validation failures, a missing admin key and 404s.
- **Pytest suite.** 14 tests run against a real Postgres test database.
- **Screenshots.** Pages were rendered in a headless browser at desktop, 390px and 360px widths.
- **Simulated deploy.** The Render start command was run against a fresh database using a `postgres://` URL.
- **Production build.** A production build called the API cross-origin, to check CORS.

**Problems this caught, fixed in their own commits:**

- The locations dropdown listed "Whitefield" and "whitefield" as two entries. It now groups case-insensitively, matching the filter.
- On 360px phones the header wrapped onto two lines and the nav overflowed; the filters also stacked into four tall rows.
- Pydantic's raw error messages ("String should have at least 1 character", "relative URL without a base") weren't fit for a sales user. The API now returns plain messages keyed by field.

**Decisions made explicitly, not left to defaults:**

- `ON DELETE SET NULL` on inquiries, so deleting a listing never deletes sales leads.
- Price stored as whole rupees in `BIGINT`, not a float.
- A sort whitelist rather than raw column names.
- The admin key kept in `sessionStorage`, so it's cleared when the tab closes.
- Tests run on Postgres rather than SQLite, so DB constraints are exercised.

## My review and changes

- I chose the stack and set the ground rules before any code was written: a small scope, plain code I can explain, one commit per logical step, and testing against a real Postgres database rather than SQLite.
- I'm doing a file-by-file review before the walkthrough. Anything I change will land as separate commits on top of this history.
