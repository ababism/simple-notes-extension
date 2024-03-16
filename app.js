async function appApplicationName(containerId, applicationName) {

    // инициализация главных переменных
    const container = document.getElementById(containerId);
    const appName = appApplicationName ? appApplicationName : "simple-notes-app"

    const ST_KEYS = {
        USER_DATA: 'user_data',
        NOTES: 'notes',
    };
    // Проверки

    // код для проверки Web Storage c https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
    function storageAvailable(type) {
        let storage;
        try {
            storage = window[type];
            const x = "__storage_test__";
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch (e) {
            return (
                e instanceof DOMException &&
                // everything except Firefox
                (e.code === 22 ||
                    // Firefox
                    e.code === 1014 ||
                    // test name field too, because code might not be present
                    // everything except Firefox
                    e.name === "QuotaExceededError" ||
                    // Firefox
                    e.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
                // acknowledge QuotaExceededError only if there's something already stored
                storage &&
                storage.length !== 0
            );
        }
    }

    // Вспомогательные функции
    const LocalStorageWrapper = {
        prefix: appName + '.',

        setItem(key, value) {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
        },

        getItem(key) {
            const value = localStorage.getItem(this.prefix + key);
            return value ? JSON.parse(value) : null;
        },

        removeItem(key) {
            localStorage.removeItem(this.prefix + key);
        },

        clear() {
            // only items of this app
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
        }
    };

    const SessionStorageWrapper = {
        prefix: appName + '.',

        setItem(key, value) {
            sessionStorage.setItem(this.prefix + key, JSON.stringify(value));
        },

        getItem(key) {
            const value = sessionStorage.getItem(this.prefix + key);
            return value ? JSON.parse(value) : null;
        },

        removeItem(key) {
            sessionStorage.removeItem(this.prefix + key);
        },

        clear() {
            // only items of this app
            Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    sessionStorage.removeItem(key);
                }
            });
        }
    };

    // Сам код
    if (!container) {
        console.error("Элемент (контейнер для встройки) с id", containerId, "не найден.");
        return
    }
    if (!storageAvailable("localStorage")) {
        console.error("Web Storage API localStorage не поддерживается. Обеспечьте поддержку localStorage");
        return
    }
    if (!storageAvailable("sessionStorage")) {
        console.error("Web Storage API sessionStorage не поддерживается. Обеспечьте поддержку sessionStorage");
        return
    }

    const startNotes = [
        {
            id: 1,
            title: "Welcome!",
            content: "This is SimpleNotes extension. Easily create, edit, and manage your notes directly in your browser. \n\nKey features for you:\n- Add and modify your notes quickly and effortlessly.\n- Backup your notes by exporting them or import from other sources.\n- Find note that you need with a simple search function.\n\n We care about your privacy! All your data stored locally, and won't be accessible online",
            date: new Date(),
            changedAt: new Date
        },
    ];

    if (!LocalStorageWrapper.getItem(ST_KEYS.NOTES)) {
        LocalStorageWrapper.setItem(ST_KEYS.NOTES, JSON.stringify(startNotes));
    }

    userData = SessionStorageWrapper.getItem(ST_KEYS.USER_DATA);
    if (!userData || !userData.lastNoteId) {
        displayNotesScreen();
    } else {
        lastNoteId = userData.lastNoteId;
        displayNoteScreen(lastNoteId);
    }

    async function displayNotesScreen() {
        container.innerHTML = '';
        displayMainMenu();

        // sync
        const notes = JSON.parse(LocalStorageWrapper.getItem(ST_KEYS.NOTES)) || [];
        // sync end

        notes.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));

        const notesList = document.createElement('ul');
        notesList.className = ('notes-list');
        notesList.id = "notes-list"

        notes.forEach((note, index) => {
            const noteListItem = document.createElement('div');
            noteListItem.className = 'note';
            noteListItem.classList.add('fade-truncate');
            noteListItem.addEventListener('click', () => displayNoteScreen(note.id));
            noteListItem.innerHTML = `<h2>${note.title}</h2><p>${note.content}</p>`
            notesList.appendChild(noteListItem);
        });

        container.appendChild(notesList);
    }

    async function displayNoteScreen(noteId) {
        container.innerHTML = '';

        const notes = JSON.parse(LocalStorageWrapper.getItem('notes')) || [];

        const note = notes.find(note => note.id === noteId);
        if (!note) {
            displayNotesScreen();
            return;
        }
        saveLastScreen(noteId)

        displayNoteMenu(note);
        displayNote(note)
    }

    async function saveLastScreen(noteId) {
        let userData = SessionStorageWrapper.getItem(ST_KEYS.USER_DATA);
        if (!userData) {
            userData = {};
        }
        userData.lastNoteId = noteId;
        SessionStorageWrapper.setItem(ST_KEYS.USER_DATA, userData);
    }

    async function displayNote(note) {
        const noteContent = document.createElement('textarea');
        noteContent.classList.add('note-textarea');
        noteContent.textContent = note.content;
        noteContent.addEventListener('keydown', function (event) {
            if (event.shiftKey && event.key === 'Enter') {
                event.preventDefault();
                note.content = this.value;
                note.changedAt = new Date();
                saveNoteByID(note)
            }
        })
        container.appendChild(noteContent);
    }

    function saveNoteByID(note) {
        if (note) {
            const notes = JSON.parse(LocalStorageWrapper.getItem(ST_KEYS.NOTES)) || [];
            const index = notes.findIndex(item => item.id === note.id);
            if (index !== -1) {
                notes[index] = note;
                LocalStorageWrapper.setItem(ST_KEYS.NOTES, JSON.stringify(notes));
            } else {
                console.error('Note with ID ' + note.id + ' not found in localStorage.');
            }
        } else {
            console.error('undefined note can\'t be saved')
        }
    }

    async function displayNoteMenu(note) {
        const menuParent = document.createElement('div');
        menuParent.className = 'notes-menu';
        menuParent.innerHTML = ''
        container.appendChild(menuParent);

        // async
        displayAppHeader(menuParent, `<h1>${note.title}</h1>`);

        const buttonsParent = document.createElement('div');
        buttonsParent.className = 'menu-buttons';
        buttonsParent.innerHTML = ''
        menuParent.appendChild(buttonsParent);

        displayReturnButton(buttonsParent);
        displayDeleteButton(buttonsParent, note);
        displayDate(buttonsParent, note.date);
    }

    async function displayDate(parent, date) {
        const notesDate = document.createElement('div');
        notesDate.className = 'note-date';

        const formattedDate = formatDate(date);
        notesDate.textContent = formattedDate;

        parent.appendChild(notesDate);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false      // 24-часовой вид
        };
        return date.toLocaleString('ru-RU', options);
    }

    async function displayReturnButton(parent) {
        const returnButton = document.createElement('button');
        returnButton.textContent = '<<';
        returnButton.className = 'return-button';
        returnButton.addEventListener('click', returnToMainScreen);
        parent.appendChild(returnButton);
    }

    async function displayDeleteButton(parent, note) {
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.className = 'delete-button';
        deleteButton.addEventListener('click', () => deleteNote(note.id));
        parent.appendChild(deleteButton);
    }

    function deleteNote(noteId) {
        const existingNotes = JSON.parse(LocalStorageWrapper.getItem(ST_KEYS.NOTES) || "[]");

        const updatedNotes = existingNotes.filter(note => note.id !== noteId);

        LocalStorageWrapper.setItem(ST_KEYS.NOTES, JSON.stringify(updatedNotes));

        returnToMainScreen();
    }

    function returnToMainScreen() {
        let userData = SessionStorageWrapper.getItem(ST_KEYS.USER_DATA);
        if (userData) {
            userData.lastNoteId = null;
            SessionStorageWrapper.setItem(ST_KEYS.USER_DATA, userData);
        }
        displayNotesScreen()
    }

    async function displayMainMenu() {
        const menuParent = document.createElement('div');
        menuParent.className = 'notes-menu';
        menuParent.innerHTML = ''
        container.appendChild(menuParent);

        // async
        displayAppHeader(menuParent, `<h1>Simple notes</h1>`);

        displaySearchBar(container);

        const buttonsParent = document.createElement('div');
        buttonsParent.className = 'menu-buttons';
        buttonsParent.innerHTML = ''
        menuParent.appendChild(buttonsParent);

        displayAddNoteButton(buttonsParent);
        displayExportButton(buttonsParent);
        displayImportButton(buttonsParent);

    }

    async function displaySearchBar(parent) {
        const searchBar = document.createElement('input');
        searchBar.type = 'text';
        searchBar.className = 'search';
        searchBar.placeholder = 'Search';
        parent.appendChild(searchBar);

        searchBar.addEventListener('input', () => {
            const searchValue = searchBar.value.toLowerCase();
            filterUpdateNotesList(searchValue);
        });
    }

    async function filterUpdateNotesList(TSQuery) {
        const notes = JSON.parse(LocalStorageWrapper.getItem(ST_KEYS.NOTES)) || [];

        const filteredNotes = notes.filter(note =>
            note.title.toLowerCase().includes(TSQuery)
        );

        filteredNotes.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));

        const notesList = document.getElementById('notes-list');

        notesList.innerHTML = '';

        filteredNotes.forEach((note, index) => {
            const noteListItem = document.createElement('div');
            noteListItem.className = 'note';
            noteListItem.classList.add('fade-truncate');
            noteListItem.addEventListener('click', () => displayNoteScreen(note.id));
            noteListItem.innerHTML = `<h2>${note.title}</h2><p>${note.content}</p>`
            notesList.appendChild(noteListItem);
        });
    }

    async function displayAppHeader(parent, htmlCode) {
        const notesHeader = document.createElement('div');
        notesHeader.className = 'notes-header';
        notesHeader.innerHTML = htmlCode
        parent.appendChild(notesHeader);
    }

    async function displayImportButton(parent) {
        const importButton = document.createElement('button');
        importButton.textContent = 'Import';
        importButton.className = 'import-button';
        importButton.addEventListener('click', importNotes);
        parent.appendChild(importButton);
    }

    async function importNotes() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = handleFileInputChange;
        input.click();
    }

    function handleFileInputChange(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        // react to event after file will be read
        reader.onload = function (event) {
            const importedNotes = event.target.result;
            try {
                const parsedNotes = JSON.parse(importedNotes);
                if (!isValidNotesFormat(parsedNotes)) {
                    alert('Error importing notes. Invalid or outdated notes format.');
                    return;
                }

                LocalStorageWrapper.setItem(ST_KEYS.NOTES, JSON.stringify(parsedNotes));
                alert('Notes imported successfully!');
            } catch (error) {
                alert('Error importing notes. Invalid JSON.');
            }
            returnToMainScreen();
        };
        reader.readAsText(file);
    }

    function isValidNotesFormat(notes) {
        if (!Array.isArray(notes)) {
            return false;
        }
        for (const note of notes) {
            if (
                typeof note.id !== 'number' ||
                typeof note.title !== 'string' ||
                typeof note.content !== 'string' ||
                isNaN(Date.parse(note.date)) ||
                isNaN(Date.parse(note.changedAt))
            ) {
                return false;
            }
        }
        return true;
    }

    async function displayExportButton(parent) {
        const exportButton = document.createElement('button');
        exportButton.textContent = 'export';
        exportButton.className = 'export-button';
        exportButton.addEventListener('click', exportNotes);
        parent.appendChild(exportButton);
    }

    async function exportNotes() {
        const notesData = LocalStorageWrapper.getItem(ST_KEYS.NOTES);

        if (!notesData) {
            alert("No notes to export.");
            return;
        }

        const notesBlob = new Blob([notesData], { type: "application/json" });
        const objectUrl = URL.createObjectURL(notesBlob);

        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = "notes.json";
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
        alert("Notes exported successfully")
    }

    async function displayAddNoteButton(parent) {
        const addNoteButton = document.createElement('button');
        addNoteButton.textContent = 'add';
        addNoteButton.className = 'add-button';
        addNoteButton.addEventListener('click', addNote);
        parent.appendChild(addNoteButton);
    }

    async function addNote() {
        const title = prompt("Enter note title:");
        if (!title.trim()) {
            alert("Note title cannot be empty.");
            return;
        }

        const existingNotes = JSON.parse(LocalStorageWrapper.getItem(ST_KEYS.NOTES) || "[]");

        if (existingNotes.some(note => note.title === title)) {
            alert("Note with this title already exists.");
            return;
        }

        let newId = 1;
        if (existingNotes.length > 0) {
            const lastNote = existingNotes[existingNotes.length - 1];
            newId = lastNote.id + 1;
        }

        const newNote = {
            id: newId,
            title: title,
            content: "",
            date: new Date(),
            changedAt: new Date()
        };

        existingNotes.push(newNote);
        await LocalStorageWrapper.setItem(ST_KEYS.NOTES, JSON.stringify(existingNotes));
        // displayNotesScreen();
        // alert("Note added successfully!");
        displayNoteScreen(newNote.id);
    }
}
