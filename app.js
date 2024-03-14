async function appApplicationName(containerId, applicationName) {

    // инициализация главных переменных
    const container = document.getElementById(containerId);
    const appName = appApplicationName ? appApplicationName : "simple-notes-app"

    const ST_KEYS = {
        USER_DATA: 'user_data',
        SETTINGS: 'settings',
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

    // TODO Temp
    const tempNotes = [
        { id: 1, title: "Note 1", content: "Content of note 1", date: new Date()},
        { id: 2, title: "Note 2", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce feugiat rutrum ullamcorper. Orci varius natoque penatibus end ", date: new Date() }
    ];

    LocalStorageWrapper.setItem(ST_KEYS.NOTES, JSON.stringify(tempNotes));

    userData = SessionStorageWrapper.getItem(ST_KEYS.USER_DATA);
    if (!userData) {
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

        // Create notes list element
        const notesList = document.createElement('ul');
        notesList.classList.add('notes-list');

        // Loop through notes and create list items
        notes.forEach((note, index) => {
            const noteListItem = document.createElement('div');
            noteListItem.className = 'note';
            noteListItem.classList.add('fade-truncate');
            // noteListItem.addEventListener('click', displayNoteScreen(note.id));
            noteListItem.innerHTML = `<h2>${note.title}</h2><p>${note.content}</p>`
            notesList.appendChild(noteListItem);
        });

        container.appendChild(notesList);
    }

    async function displayNoteScreen(noteId) {
        container.innerHTML = '';

        const notes = JSON.parse(LocalStorageWrapper.getItem('notes')) || [];
      
        const note = notes.find(note => note.id === noteId);

        displayNoteMenu(note);
        // displayNote(note)
    }

    async function displayNoteMenu(note) {
        const menuParent = document.createElement('div');
        menuParent.className = 'notes-menu';
        menuParent.innerHTML = ''
        container.appendChild(menuParent);

        // note = JSON.parse(noteObj)
        // async
        displayAppHeader(menuParent, `<h1>${note.title}</h1>`);

        const buttonsParent = document.createElement('div');
        buttonsParent.className = 'menu-buttons';
        buttonsParent.innerHTML = ''
        menuParent.appendChild(buttonsParent);

        displayDate(buttonsParent, note.date);
        // displayExportButton(buttonsParent);
        // displayImportButton(buttonsParent);
    }

    async function displayDate(parent, date) {
        const notesDate = document.createElement('div');
        notesDate.className = 'note-date';
        notesDate.textContent = date
        // notesDate.innerHTML = `<p>${date}</p>`
        parent.appendChild(notesDate);
    }

    async function displayMainMenu() {
        const menuParent = document.createElement('div');
        menuParent.className = 'notes-menu';
        menuParent.innerHTML = ''
        container.appendChild(menuParent);

        // async
        displayAppHeader(menuParent, `<h1>Simple notes</h1>`);

        const buttonsParent = document.createElement('div');
        buttonsParent.className = 'menu-buttons';
        buttonsParent.innerHTML = ''
        menuParent.appendChild(buttonsParent);

        displayAddNoteButton(buttonsParent);
        displayExportButton(buttonsParent);
        displayImportButton(buttonsParent);

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
        // const notesHeader = document.querySelector('.notes-menu');
        parent.appendChild(importButton);
    }
    
    async function importNotes() {
        // Your import functionality here
        alert('TODO Importing notes...');
    }

    async function displayExportButton(parent) {
        const exportButton = document.createElement('button');
        exportButton.textContent = 'export';
        exportButton.className = 'export-button';
        exportButton.addEventListener('click', exportNotes);
        // const notesHeader = document.querySelector('.notes-menu');
        parent.appendChild(exportButton);
    }
    
    async function exportNotes() {
        // Your export functionality here
        alert('TODO Exporting notes...');
    }
    
    async function displayAddNoteButton(parent) {
        const addNoteButton = document.createElement('button');
        addNoteButton.textContent = 'add';
        addNoteButton.className = 'add-button';
        addNoteButton.addEventListener('click', addNote);
        parent.appendChild(addNoteButton);
    }
    
    async function addNote() {
        // Your export functionality here
        alert('TODO adding notes...');
    }
}
