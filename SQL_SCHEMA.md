# DrillDeck SQL Schema

SQLite is accessed through Sequelize ORM.

## Users
- `id` primary key
- `name`
- `email` unique
- `password` bcrypt hash
- `role`: `admin` or `trainee`
- timestamps

## Scenarios
- `id` primary key
- `title` unique
- `category`
- `difficulty`: Easy, Medium or Hard
- `description`
- `imageKey`
- `durationMinutes`
- `learningOutcome`
- `skillFocus`
- `isPublished`
- `createdBy` foreign key to Users
- timestamps

## Steps
- `id` primary key
- `scenarioId` foreign key to Scenarios
- `orderNumber`
- `situation`
- `question`
- timestamps

## Choices
- `id` primary key
- `stepId` foreign key to Steps
- `text`
- `score` integer 0–10
- `feedback`
- timestamps

## Attempts
- `id` primary key
- `userId` foreign key to Users
- `scenarioId` foreign key to Scenarios
- `totalScore`
- `maxScore`
- `percentage`
- `resultLevel`
- `scenarioTitle` historical snapshot
- `categorySnapshot` historical snapshot
- `difficultySnapshot` historical snapshot
- `xpEarned`
- `completedAt`
- timestamps

## AttemptAnswers
- `id` primary key
- `attemptId` foreign key to Attempts
- nullable `stepId` and `choiceId` references
- `stepNumber`
- `score`
- `maxScore`
- `questionText` historical snapshot
- `selectedText` historical snapshot
- `feedbackText` historical snapshot
- timestamps

The snapshot columns preserve exactly what the trainee saw and selected at completion time. During later scenario editing, old step/choice references are safely detached while the text, score and feedback snapshots remain. Signing out never removes these SQL rows.
