const path = require('path')
const electron = require('electron')
const {BrowserWindow} = require('electron')
const menu = electron.Menu
const app = electron.app

let authorInfoWinCreated = false

module.exports.createMenu = function() {
	const template = [
		{
			label: 'Classifier',
			submenu: [
				{role: 'minimize'},
				{role: 'close'}
			]
		},
		{
			label: 'Debug',
			submenu: [
					{
						label: 'Toggle Developer Tools',
						click: (item, focusedWindow) => {
							if (focusedWindow) {
								focusedWindow.toggleDevTools()
							}
						}
					}, {
						label: 'Reload',
						click: (item, focusedWindow) => {
							if (focusedWindow && focusedWindow.id === 1) {
								BrowserWindow.getAllWindows().forEach((win) => {
									if (win.id > 1) {
										win.close()
									}
								})
								focusedWindow.reload()
							}
						}
					}
				]
		},
		{
			label: 'Help',
			submenu: [{
				label: 'About Author',
				click: () => {
					if (!authorInfoWinCreated) {
						authorInfoWinCreated = true
						let modalWinPath = path.join(process.cwd(), '/gui/author-info/author-info.html')
						let win = new BrowserWindow({
							 icon:'./assets/icon.png',
							title: 'About Author',
							width: 350, height: 200, 
							resizable: false, frame: false})
						win.on('close', () => {
							win = null
							authorInfoWinCreated = false
						})
						win.loadURL(modalWinPath)
						win.show()
					}
				}
			}]
		}
	]
	const menubar = menu.buildFromTemplate(template)
	menu.setApplicationMenu(menubar)
}