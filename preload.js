const { contextBridge, ipcRenderer } = require('electron');

// Espone API sicure al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Esempio di API che potresti usare
    // send: (channel, data) => {
    //     ipcRenderer.send(channel, data);
    // },
    // receive: (channel, func) => {
    //     ipcRenderer.on(channel, (event, ...args) => func(...args));
    // }
});

