# QuickNotes REST API

Base URL: `https://api.quicknotes.example/v1`

All requests and responses use JSON unless the response is `204 No Content`. Notes belong to the authenticated user. Protected endpoints require a valid bearer token.

## Endpoints

### List notes

- **Method and path:** `GET /notes?limit=10&offset=0`
- **Description:** Returns the signed-in user's notes, newest first.
- **Success:** `200 OK`
- **Example response:**
  ```json
  {
    "items": [
      { "id": 42, "title": "Project idea", "body": "Sketch the first screen.", "createdAt": "2026-10-01T09:30:00Z" }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  }
  ```

### Get one note

- **Method and path:** `GET /notes/{noteId}`
- **Description:** Returns one note owned by the signed-in user.
- **Success:** `200 OK`

### Create a note

- **Method and path:** `POST /notes`
- **Description:** Creates a note for the signed-in user.
- **Example request:**
  ```json
  { "title": "Project idea", "body": "Sketch the first screen." }
  ```
- **Success:** `201 Created`
- **Example response:**
  ```json
  { "id": 42, "title": "Project idea", "body": "Sketch the first screen.", "createdAt": "2026-10-01T09:30:00Z" }
  ```

### Update a note

- **Method and path:** `PATCH /notes/{noteId}`
- **Description:** Updates one or more fields on a note owned by the user.
- **Example request:**
  ```json
  { "title": "Revised project idea" }
  ```
- **Success:** `200 OK`

### Delete a note

- **Method and path:** `DELETE /notes/{noteId}`
- **Description:** Deletes one note owned by the signed-in user.
- **Success:** `204 No Content`

### List tags

- **Method and path:** `GET /tags`
- **Description:** Returns tags available to the signed-in user.
- **Success:** `200 OK`

### List notes by tag

- **Method and path:** `GET /notes?tag={tagName}`
- **Description:** Returns the user's notes that have the named tag.
- **Success:** `200 OK`

## Error responses

Error responses use this JSON shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Title is required." } }
```

- **400 Bad Request:** The request is invalid, for example a note title is empty or longer than 100 characters.
- **401 Unauthorized:** The request has no valid authentication token.
- **403 Forbidden:** The token is valid, but the user is not allowed to perform the requested action.
- **404 Not Found:** The requested note ID does not exist for the signed-in user.
- **500 Internal Server Error:** An unexpected server failure prevented the request from completing.
