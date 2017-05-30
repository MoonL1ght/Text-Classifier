const path = require('path')
const url = require('url')

const electron = require('electron')
const menubar = require('./menubar.js')

const app = electron.app
const BrowserWindow = electron.BrowserWindow

let mainWindow

function createWindow() {
	mainWindow = new BrowserWindow({width: 800, height: 600,
		resizable: false, icon:'./assets/icon.png'})
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, '/gui/index.html'),
		protocol: 'file:',
		slashes: true
	}))
	mainWindow.on('close', () => {
		mainWindow = null
	})
	menubar.createMenu()
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
