# DrillDeck REST API

Base URL: `http://localhost:5000/api`

Protected routes require:

```http
Authorization: Bearer <JWT_TOKEN>
```

## Health

- `GET /health` — runs a live SQLite query and returns application/version status.

## Authentication

- `POST /auth/register` — create a trainee account.
- `POST /auth/login` — authenticate an administrator or trainee and return a JWT.
- `GET /auth/me` — validate the current JWT and return the account.

## Scenarios

- `GET /scenarios` — list published scenarios for trainees; administrators receive drafts too. Supports `q`, `category`, `difficulty`, `sortBy` and `order`.
- `GET /scenarios/summary` — dynamic scenario count, decision count, difficulty totals and categories.
- `GET /scenarios/:id` — return one scenario. Administrators receive option scores/feedback for editing; trainee payloads hide the answer key.
- `POST /scenarios/:id/feedback` — trainee sends `stepId` and `choiceId`; backend validates ownership and returns score, maximum score and coaching.
- `POST /scenarios` — administrator creates a scenario with 3–12 steps and 4–8 choices per step.
- `PUT /scenarios/:id` — administrator updates all metadata, steps, options, scores, feedback and publication status in a transaction.
- `DELETE /scenarios/:id` — administrator deletes only scenarios without recorded attempts. Scenarios with history must be unpublished.

## Attempts and persistence

- `POST /attempts` — trainee submits one choice for every step. Backend rejects duplicate steps, validates IDs, calculates score/XP and saves history snapshots.
- `GET /attempts/my` — current trainee’s persistent attempt summaries.
- `GET /attempts/all` — administrator’s complete attempt list. Supports `userId`, `scenarioId` and `resultLevel`.
- `GET /attempts/:id` — complete decision-by-decision attempt detail. Allowed for the owner or an administrator.

## Dashboards

- `GET /dashboard/trainee` — totals, average, best score, XP, level, published progress, category analytics and recent attempts.
- `GET /dashboard/admin` — platform totals, difficulty distribution, scenario averages and recent activity.

## Administrator account management

- `GET /admin/trainees` — trainee list with attempt count, completed scenarios, average, best score and last activity.
- `PUT /admin/trainees/:id` — atomically update name, email and an optional new password.
- `PATCH /admin/trainees/:id/password` — reset only the trainee password.
- `DELETE /admin/trainees/:id` — transactionally delete the trainee and linked attempt/answer rows.

## Error responses

Errors use JSON:

```json
{ "message": "Description of the problem" }
```

Typical status codes: `400` invalid data, `401` authentication required, `403` wrong role, `404` missing record, `409` data conflict, `500` unexpected error and `503` unavailable database.
