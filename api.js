const API_URL = "https://jsonplaceholder.typicode.com/posts";
const loadButton = document.querySelector("#load-btn");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");
const notesList = document.querySelector("#notes-list");
const status = document.querySelector("#status");

let notes = [];

function showStatus(message, type) {
  status.textContent = message;
  status.className = `status status--${type}`;
}

function renderNotes(list = notes) {
  notesList.textContent = "";

  if (list.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "empty-state";
    emptyMessage.textContent = "No notes yet. Create one to get started.";
    notesList.append(emptyMessage);
    return;
  }

  list.forEach(note => {
    const item = document.createElement("li");
    const title = document.createElement("h3");
    const body = document.createElement("p");
    const deleteButton = document.createElement("button");

    item.className = "note-card";
    title.textContent = note.title;
    body.textContent = note.body;
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteNote(note.id, deleteButton));

    item.append(title, body, deleteButton);
    notesList.append(item);
  });
}

async function request(url = API_URL, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  if (response.status === 204) return null;
  return response.json();
}

async function loadNotes() {
  loadButton.disabled = true;
  showStatus("Loading notes...", "loading");

  try {
    notes = await request(`${API_URL}?_limit=10`);
    renderNotes();
    showStatus(`Loaded ${notes.length} notes.`, "success");
  } catch (error) {
    showStatus("Could not load notes. Please try again.", "error");
  } finally {
    loadButton.disabled = false;
  }
}

async function createNote(title, body) {
  submitButton.disabled = true;
  showStatus("Creating note...", "loading");

  try {
    const note = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, userId: 1 }),
    });
    notes.unshift(note);
    renderNotes();
    noteForm.reset();
    showStatus("Note created successfully.", "success");
  } catch (error) {
    showStatus("Could not create the note. Please try again.", "error");
  } finally {
    submitButton.disabled = false;
  }
}

async function deleteNote(id, button) {
  button.disabled = true;
  showStatus("Deleting note...", "loading");

  try {
    await request(`${API_URL}/${id}`, { method: "DELETE" });
    notes = notes.filter(note => note.id !== id);
    renderNotes();
    showStatus("Note deleted successfully.", "success");
  } catch (error) {
    showStatus("Could not delete the note. Please try again.", "error");
  } finally {
    button.disabled = false;
  }
}

loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = titleInput.value.trim();
  if (title === "") {
    showStatus("A title is required.", "error");
    titleInput.focus();
    return;
  }
  if (title.length > 100) {
    showStatus("Title must be 100 characters or fewer.", "error");
    titleInput.focus();
    return;
  }

  createNote(title, bodyInput.value.trim());
});
