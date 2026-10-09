# QuickNotes Data Model

## Entities and relationships

- **users** stores account identity and creation time. One user can own many notes, so `users` to `notes` is one-to-many.
- **notes** stores a user's title and body. `owner_id` links each note to exactly one user.
- **tags** stores reusable labels with unique names.
- **note_tags** joins notes and tags. Notes and tags are many-to-many: a note can have many tags and each tag can label many notes. The join table stores each pairing and uses a composite primary key to prevent duplicates.

## SQLite schema

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
  user_id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  note_id INTEGER PRIMARY KEY,
  owner_id INTEGER NOT NULL,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 100),
  body TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE tags (
  tag_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE note_tags (
  note_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(note_id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
);
```

## Example queries

```sql
-- 1. Find a user's notes, newest first.
SELECT title, body, created_at
FROM notes
WHERE owner_id = 1
ORDER BY created_at DESC;

-- 2. Find all notes with a given tag (many-to-many JOIN).
SELECT n.title, n.body
FROM notes AS n
JOIN note_tags AS nt ON nt.note_id = n.note_id
JOIN tags AS t ON t.tag_id = nt.tag_id
WHERE t.name = 'ideas';

-- 3. Count notes for each user, including users with no notes.
SELECT u.display_name, COUNT(n.note_id) AS note_count
FROM users AS u
LEFT JOIN notes AS n ON n.owner_id = u.user_id
GROUP BY u.user_id, u.display_name;
```

## Index

I would add `CREATE INDEX idx_notes_owner_created ON notes(owner_id, created_at DESC);`. It helps the common query that loads one user's notes in newest-first order, while keeping notes isolated by owner.

## SQL or NoSQL?

I would choose SQL because users, notes, tags, and note-tag assignments have clear relationships and integrity rules. Foreign keys and unique constraints prevent orphaned records and duplicate tag assignments, while joins make tagged-note queries straightforward. A document database could store tags inside each note, but reusing and renaming tags across many notes would require extra consistency work.
