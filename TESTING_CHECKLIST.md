# DrillDeck Final Testing Checklist

## Automated checks

### Static check

```powershell
npm.cmd run verify
```

Expected: 12 scenarios, 60 decisions, 240 choices, 4 scenarios per difficulty and highest-score positions `15, 15, 15, 15`.

### Live integration check

Start the app, then double-click `run-final-check.bat`.

Expected final line:

```text
ALL LIVE CHECKS PASSED — DrillDeck is ready for demonstration.
```

The live check builds the frontend and verifies live SQLite health, visual assets, authentication, role restrictions, scenario CRUD, extra answer options, dynamic counts, hidden answer keys, feedback, server scoring, dashboards, SQL snapshots, logout/login persistence, trainee editing, detailed administrator records, deletion protection and cleanup.

## Manual trainee test

- [ ] Register a new trainee.
- [ ] Log out and sign in again.
- [ ] Search and filter the scenario library.
- [ ] Complete a scenario and inspect immediate coaching.
- [ ] Confirm the result page shows score, level, XP and decision review.
- [ ] Open History and inspect all saved answers.
- [ ] Log out, sign in and confirm the attempt remains.
- [ ] Restart DrillDeck and confirm the attempt remains.

## Manual administrator test

- [ ] Sign in using `admin@drilldeck.local` / `Admin123!`.
- [ ] Create a draft with at least 3 decisions.
- [ ] Add a fifth option to one decision.
- [ ] Publish it and confirm a trainee can see it.
- [ ] Edit title, category, difficulty, option score and feedback.
- [ ] Restart DrillDeck and confirm the changes remain.
- [ ] Unpublish it and confirm trainees cannot see it.
- [ ] Open Trainee records and inspect totals, average and best score.
- [ ] Open an attempt and inspect every saved answer.
- [ ] Edit a trainee name/email and optionally reset the password.

## Security and validation

- [ ] Trainee cannot access administrator API routes.
- [ ] Administrator cannot submit a trainee attempt.
- [ ] Duplicate email registration returns a clear conflict.
- [ ] Passwords shorter than 8 characters are rejected.
- [ ] Scenarios with fewer than 3 steps are rejected.
- [ ] Steps with fewer than 4 or more than 8 choices are rejected.
- [ ] Duplicate option text and tied highest scores are rejected.
- [ ] Trainee scenario JSON does not expose `score` or `feedback` before choosing.
- [ ] Duplicate step submissions are rejected.
- [ ] Server calculates the final score rather than trusting the browser.
- [ ] A scenario with saved attempts cannot be deleted.
