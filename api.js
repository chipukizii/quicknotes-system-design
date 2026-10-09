const API_URL = "https://jsonplaceholder.typicode.com/posts";
const loadButton = document.querySelector("#load-btn");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");
const notesList = document.querySelector("#notes-list");
const status = document.querySelector("#status");
const languageButtons = document.querySelectorAll("[data-language]");

const translations = {
  en: {
    eyebrow: "QUICKNOTES / API LAB", headline: "Notes, in motion.",
    tagline: "Write notes in English or Kiswahili.", createLabel: "CREATE",
    formHeading: "Write a note", loadButton: "Load notes", titleLabel: "Title",
    titlePlaceholder: "A short title", bodyLabel: "Note",
    bodyPlaceholder: "You can write in English or Kiswahili.",
    submitButton: "Create note", notesLabel: "YOUR NOTES",
    notesHeading: "Recent notes", idleStatus: "Load notes to see the latest posts.",
    loadingStatus: "Loading notes...", loadedStatus: "Loaded {count} notes.",
    loadError: "Could not load notes. Please try again.",
    emptyState: "No notes yet. Create one to get started.",
    titleRequired: "A title is required.", titleTooLong: "Title must be 100 characters or fewer.",
    creatingStatus: "Creating note...", createdStatus: "Note created successfully.",
    createError: "Could not create the note. Please try again.",
    deletingStatus: "Deleting note...", deletedStatus: "Note deleted successfully.",
    deleteError: "Could not delete the note. Please try again.",
    deleteButton: "Delete", footer: "QuickNotes · Learn by building.",
  },
  sw: {
    eyebrow: "QUICKNOTES / JARIBIO LA API", headline: "Vidokezo, hatua kwa hatua.",
    tagline: "Andika vidokezo kwa Kiingereza au Kiswahili.", createLabel: "ONGEZA",
    formHeading: "Andika dokezo", loadButton: "Pakia madokezo", titleLabel: "Kichwa",
    titlePlaceholder: "Kichwa kifupi", bodyLabel: "Dokezo",
    bodyPlaceholder: "Unaweza kuandika kwa Kiingereza au Kiswahili.",
    submitButton: "Hifadhi dokezo", notesLabel: "MADOKEZO YAKO",
    notesHeading: "Madokezo ya hivi karibuni", idleStatus: "Pakia madokezo ili kuona ya hivi karibuni.",
    loadingStatus: "Inapakia madokezo...", loadedStatus: "Madokezo {count} yamepakiwa.",
    loadError: "Imeshindikana kupakia madokezo. Jaribu tena.",
    emptyState: "Bado hakuna madokezo. Anza kwa kuandika moja.",
    titleRequired: "Kichwa kinahitajika.", titleTooLong: "Kichwa kisiwe na zaidi ya herufi 100.",
    creatingStatus: "Inahifadhi dokezo...", createdStatus: "Dokezo limehifadhiwa.",
    createError: "Imeshindikana kuhifadhi dokezo. Jaribu tena.",
    deletingStatus: "Inafuta dokezo...", deletedStatus: "Dokezo limefutwa.",
    deleteError: "Imeshindikana kufuta dokezo. Jaribu tena.",
    deleteButton: "Futa", footer: "QuickNotes · Jifunze kwa vitendo.",
  },
};

let notes = [];
let language = "en";
let currentStatus = { key: "idleStatus", type: "idle", values: {} };

function updateStatus() {
  let message = translations[language][currentStatus.key];
  for (const [key, value] of Object.entries(currentStatus.values)) {
    message = message.replace(`{${key}}`, value);
  }
  status.textContent = message;
  status.className = `status status--${currentStatus.type}`;
}

function showStatus(key, type, values = {}) {
  currentStatus = { key, type, values };
  updateStatus();
}

function renderNotes(list = notes) {
  notesList.textContent = "";

  if (list.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "empty-state";
    emptyMessage.textContent = translations[language].emptyState;
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
    deleteButton.textContent = translations[language].deleteButton;
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
  showStatus("loadingStatus", "loading");

  try {
    notes = await request(`${API_URL}?_limit=10`);
    renderNotes();
    showStatus("loadedStatus", "success", { count: notes.length });
  } catch (error) {
    showStatus("loadError", "error");
  } finally {
    loadButton.disabled = false;
  }
}

async function createNote(title, body) {
  submitButton.disabled = true;
  showStatus("creatingStatus", "loading");

  try {
    const note = await request(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, userId: 1 }),
    });
    notes.unshift(note);
    renderNotes();
    noteForm.reset();
    showStatus("createdStatus", "success");
  } catch (error) {
    showStatus("createError", "error");
  } finally {
    submitButton.disabled = false;
  }
}

async function deleteNote(id, button) {
  button.disabled = true;
  showStatus("deletingStatus", "loading");

  try {
    await request(`${API_URL}/${id}`, { method: "DELETE" });
    notes = notes.filter(note => note.id !== id);
    renderNotes();
    showStatus("deletedStatus", "success");
  } catch (error) {
    showStatus("deleteError", "error");
  } finally {
    button.disabled = false;
  }
}

function setLanguage(nextLanguage) {
  language = nextLanguage;
  document.documentElement.lang = language;

  document.querySelectorAll("[data-i18n]").forEach(element => {
    element.textContent = translations[language][element.dataset.i18n];
  });
  titleInput.placeholder = translations[language].titlePlaceholder;
  bodyInput.placeholder = translations[language].bodyPlaceholder;
  languageButtons.forEach(button => {
    const active = button.dataset.language === language;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active);
  });

  updateStatus();
  renderNotes();
}

loadButton.addEventListener("click", loadNotes);
languageButtons.forEach(button => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});

noteForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = titleInput.value.trim();
  if (title === "") {
    showStatus("titleRequired", "error");
    titleInput.focus();
    return;
  }
  if (title.length > 100) {
    showStatus("titleTooLong", "error");
    titleInput.focus();
    return;
  }

  createNote(title, bodyInput.value.trim());
});

setLanguage(language);
