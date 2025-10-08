import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { generateCodeFromUml, generateUmlFromPrompt, type CodeGenerationRequest } from './openaiService';

const isMac = process.platform === 'darwin';

let mainWindow: BrowserWindow | null = null;

function createMainWindow(): void {
  const preloadPath = path.join(__dirname, 'preload.js');
  const indexHtml = path.join(__dirname, '..', 'renderer', 'index.html');

  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    title: 'UML Architect',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(indexHtml).catch((error) => {
    console.error('Failed to load renderer file:', error);
  });

  if (!app.isPackaged) {
    try {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    } catch (error) {
      console.warn('Failed to open devtools:', error);
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});

ipcMain.handle('generate-uml', async (_event, prompt: string) => {
  try {
    return await generateUmlFromPrompt(prompt);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(message);
  }
});

ipcMain.handle('generate-code', async (_event, request: CodeGenerationRequest) => {
  try {
    return await generateCodeFromUml(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(message);
  }
});
