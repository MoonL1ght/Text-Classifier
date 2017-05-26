const electron = require('electron')
const menu = electron.Menu
const app = electron.app

module.exports.createMenu = function() {
	const template = [
		{
			label: "Text Classificator",
			submenu: [
				{role: 'minimize'},
				{role: 'close'}
			]
		},
		{
			label: "Debug",
			submenu: [{
					label: 'Toggle Developer Tools',
					click: (item, focusedWindow) => {
						if (focusedWindow) {
							focusedWindow.toggleDevTools()
						}
					}
				}]
		}
	]
	const menubar = menu.buildFromTemplate(template)
	menu.setApplicationMenu(menubar)
}