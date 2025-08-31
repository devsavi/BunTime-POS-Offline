const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  console.log('Creating window...');
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Enable DevTools
  mainWindow.webContents.openDevTools();

  // Log the available paths
  console.log('App paths:');
  console.log('__dirname:', __dirname);
  console.log('process.resourcesPath:', process.resourcesPath);
  console.log('app.getAppPath():', app.getAppPath());

  // Get the correct path to index.html
  let indexPath;
  const possiblePaths = [
    path.join(__dirname, '../dist/index.html'),
    path.join(process.resourcesPath, 'app/dist/index.html'),
    path.join(process.resourcesPath, 'dist/index.html'),
    path.join(app.getAppPath(), 'dist/index.html')
  ];

  console.log('Checking possible index.html locations:');
  for (const testPath of possiblePaths) {
    console.log(`Checking ${testPath}:`, fs.existsSync(testPath));
    if (fs.existsSync(testPath)) {
      indexPath = testPath;
      break;
    }
  }

  if (!indexPath) {
    console.error('Could not find index.html in any location!');
    return;
  }

  console.log('Loading from path:', indexPath);

  // Load the index.html
  mainWindow.loadFile(indexPath)
    .then(() => {
      console.log('File loaded successfully');
    })
    .catch((err) => {
      console.error('Error loading file:', err);
    });

  // Log when the page starts loading
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('Page started loading');
  });

  // Log when the page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
  });

  // Log any load failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // Log console messages from the renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log('Renderer Console:', message);
  });

  // Open DevTools in both dev and prod for debugging
  mainWindow.webContents.openDevTools();

  // Log any loading failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // Log when page is finished loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });

}

// Create window when app is ready
app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Handle any errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
