# QuickNotes System Architecture

## Assumptions and scale estimate

Assume 1,000,000 registered users, with 20% active each day. Each daily active user reads 20 note lists and creates or updates 2 notes per day. A stored note, including its row metadata and tag links, averages 1.5 KB. There are 86,400 seconds in a day and peak traffic is estimated at 5 times the daily average.

- **Daily active users:** `1,000,000 x 0.20 = 200,000 DAU`
- **Reads per day:** `200,000 x 20 = 4,000,000`
- **Average reads per second:** `4,000,000 / 86,400 = 46.30 reads/second`
- **Peak reads per second:** `46.30 x 5 = 231.50 reads/second`
- **Writes per day:** `200,000 x 2 = 400,000`
- **Average writes per second:** `400,000 / 86,400 = 4.63 writes/second`
- **New storage per year:** `400,000 x 1.5 KB x 365 = 219,000,000 KB`, or about **219 GB/year** decimal, before indexes, backups, and replicas.

This is read-heavy: the estimate is about 10 reads for every write. The design should scale read capacity with caching, a database read replica, and CDN delivery for static assets, while keeping writes consistent on the primary database.

## Functional requirements

- Users can create, read, update, and delete their own notes.
- Users can categorize notes with tags and search their notes.
- Users can authenticate and cannot read or change another user's private notes.
- The system reports validation and service errors clearly and does not lose a saved note after a successful write.

## Non-functional requirements

- Target 99.9% monthly availability for note reads and writes.
- Keep common note-list requests under 300 ms at the 95th percentile.
- Scale horizontally as active users and request volume grow.
- Protect account data in transit and at rest, and enforce ownership on every note request.
- Use backups and tested recovery procedures to limit data loss after a database failure.

## Architecture diagram

```text
                          +----------------------+
                          |  Browser / Mobile    |
                          +----+------------+----+
                               |            |
                 DNS: app host |            | DNS: static host
                               v            v
                         +-----+----+   +---+-----+
                         |   DNS    |   |   DNS   |
                         +--+---+---+   +----+----+
                            |   |            |
             private API ---+   |            v
                                |       +----+-----+
                                |       |   CDN    |  static assets
                                |       +----------+
                                v
                       +--------+---------+
                       |  Load Balancer   |
                       +----+---------+---+
                            |         |
                      +-----v---+ +---v------+
                      | App A   | | App B    |
                      +--+---+--+ +--+----+--+
                         |   |       |    |
                    cache|   |write  |    +-----> +-----------+
                         v   v       |            | Job Queue |
                    +----+---+-+  +--v---------+  +-----+-----+
                    |  Cache  |  | Primary DB |        |
                    +----+----+  +------+-----+        v
                         |              |         +----+------+
                         | cache miss   |         |  Worker   |
                         +--------------+         +-----------+
                                        |
                                  replication
                                        v
                                 +------+------+
                                 | Read Replica|
                                 +-------------+
```

The client resolves application and static-content hostnames through DNS; authenticated API requests go to the load balancer, while the CDN serves static files. The API reads a user's notes from cache when available, otherwise from the read replica, and sends writes to the primary database.

## Components

- **Browser/mobile client:** Collects note input and displays notes and request states.
- **DNS:** Resolves the application and static-content names to their service endpoints.
- **CDN:** Caches and serves static client files close to users without caching private note responses publicly.
- **Load balancer:** Health-checks app servers and distributes API requests across healthy instances.
- **App servers A and B:** Run the same stateless API so the service can handle more traffic and survive one server failure.
- **Cache:** Speeds up repeated note-list reads and reduces database load, with entries expired or invalidated after writes.
- **Primary database:** Provides the authoritative transactional copy for note and tag changes.
- **Read replica:** Serves read queries to increase read capacity while replication keeps it close to the primary.
- **Job queue:** Holds background work such as notifications or search-index updates so API requests do not wait for it.
- **Worker:** Processes queued background jobs and retries temporary failures.

## GET /notes flow

1. The client resolves the API hostname through DNS and sends an authenticated `GET /notes` request.
2. The load balancer routes the request to a healthy app server.
3. The app server validates the user's identity and checks the cache for that user's note list.
4. On a cache hit, the app returns the cached private result for that user; on a miss, it reads from the read replica.
5. The app returns the JSON response and may cache the result with a short expiry; the client renders the notes.

## POST /notes flow

1. The client sends an authenticated `POST /notes` request with the title, body, and optional tag IDs.
2. DNS resolves the API host, and the load balancer routes the request to a healthy app server.
3. The app validates ownership, title length, and tag references before writing.
4. The app inserts the note and tag relationships in one transaction on the primary database.
5. After commit, the app invalidates the affected user's cache and publishes any asynchronous follow-up work to the queue.
6. The API returns `201 Created` with the saved note; a worker handles queued work independently.

## Trade-offs and resilience

- **Cache speed versus freshness:** Caching reduces read latency and database load, but a cached list can be briefly stale; short expiries plus write-triggered invalidation limit that window.
- **Read replica scale versus replication lag:** Replicas add read capacity, but may briefly lag behind the primary; after a write, the API can read that user's next request from the primary or return the created record directly.
- **Asynchronous work versus immediate completion:** A queue keeps notifications and indexing off the request path, but those features are eventually consistent and need retries and monitoring.
- **Single-point-of-failure controls:** Multiple app servers sit behind health checks; the database needs automated primary failover, a replica, and backups; the queue and cache should use managed redundant deployments; DNS and CDN are globally redundant services.
