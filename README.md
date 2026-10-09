# QuickNotes System Design

QuickNotes is a small notes client and system-design exercise covering a REST API, relational data model, and a scalable service architecture. The browser client uses JSONPlaceholder for its live GET, POST, and DELETE examples; the documents describe the production API and storage design.

## Run the API client

Serve the repository root locally so the browser can load the client files and call the API:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000` and use **Load notes** or create a note. The demo API may return simulated POST/DELETE responses; its data is not persisted by JSONPlaceholder.

## Design documents

- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)

## What I learned

- How REST methods and status codes describe resource operations.
- How primary keys, foreign keys, and join tables model related data.
- How caches, read replicas, queues, and workers change performance and consistency trade-offs.
