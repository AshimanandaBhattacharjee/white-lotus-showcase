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

I told Claude I would need to walk through and defend every part of the code. On that basis we agreed a deliberately small scope, plain code over clever abstractions, and one commit per logical step, so the history shows how it was built.

**Code generation.** Claude wrote the large majority of the code (backend, frontend, tests, configs) step by step in a single evening session; it made the commits as it finished each step, which is why they are minutes apart. It ran the code against a real local PostgreSQL after each step rather than generating everything at once.

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

- I picked FastAPI + PostgreSQL from the options compared, because I can explain every layer through my Spring/Hibernate experience, and agreed the build approach before any code was written.
- I'm doing a file-by-file review before the walkthrough. Anything I change will land as separate commits after the `submission` tag.
