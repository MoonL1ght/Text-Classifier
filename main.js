const electron = require('electron')

const app = electron.app

const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

let mainWindow

function createWindow() {
	mainWindow = new BrowserWindow({width: 800, height: 600, frame: false})
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, '/gui/index.html'),
		protocol: 'file:',
		slashes: true
	}))
	mainWindow.on('close', () => {
		mainWindow = null
	})
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', function() {
	if (mainWindow === null) {
		createWindow()
	}
})