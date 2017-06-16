const ipc = require('electron').ipcRenderer

let currentMethod = 'bayes'
let bayesCategories = []

function main() {
	ipc.send('load-method', 'bayes')
}

function chooseButtonClick() {
	let value = $('input[name="methodGroup"]:checked').val();
	chooseMethodView(value)
}

function chooseFileButtonClick() {
	ipc.send('open-file')
}

function chooseMethodView(method) {
	switch (method) {
		case 'bayes': {
			if (currentMethod != 'bayes') {
				$('.correct-cats').html('')
				$('#bayes-missclassif').css('display', 'none')
				$('#bayes-category').text('')
				$('#bayes-file-field').text('File not choosen, choose file to classify')
				ipc.send('load-method', 'bayes')
				$('.bayes-view').css('display', 'block')
				$('.fpgrowth-view').css('display', 'none')
				$('.unknown').css('display', 'none')
				currentMethod = 'bayes'
			}
			break
		}
		case 'fpgrowth': {
			if (currentMethod != 'fpgrowth') {
				ipc.send('load-method', 'fpgrowth')
				$('.bayes-view').css('display', 'none')
				$('.fpgrowth-view').css('display', 'block')
				$('.unknown').css('display', 'none')
				currentMethod = 'fpgrowth'
			}
			break
		}
		case 'unknown': {
			if (currentMethod != 'unknown') {
				$('.unknown').css('display', 'block')
				$('.bayes-view').css('display', 'none')
				$('.fpgrowth-view').css('display', 'none')
				currentMethod = 'unknown'
			}
			break
		}
	}
}

function bayesClassify() {
	$('#bayes-classif').blur()
	ipc.send('classify-file')
}

function bayesMissClassify() {
	$('#bayes-missclassif').blur()
}

function bayesClassifyMsg() {
	$('#bayes-missclassif').css('display', 'none')
	$('#bayes-category').text('')
}

function bayesUpdateCategory(category) {
	ipc.send('bayes-update', category)
}

ipc.on('bayes-ready', (event, msg) => {
	$('.correct-cats').html('')
	$('#bayes-choosefb')[0].disabled = false
	bayesCategories = msg
})

ipc.on('bayes-selected-file', (event, msg) => {
	$('#bayes-choosefb').blur()
	$('#bayes-file-field').text(msg)
	$('.correct-cats').html('')
})

ipc.on('bayes-notselected-file', () => {
	$('.correct-cats').html('')
	$('#bayes-category').text('')
	$('#bayes-missclassif').css('display', 'none')
	$('#bayes-choosefb').blur()
	$('#bayes-file-field').text('File not choosen, choose file to classify')
})

ipc.on('bayes-result', (event, msg) => {
	$('#bayes-missclassif').css('display', 'block')
	$('.correct-cats')
	$('#bayes-category').text('File category: ' + msg)
	for (let i = 0; i < bayesCategories.length; i++) {
		if (bayesCategories[i] != msg) {
			let name = bayesCategories[i].toString()
			$('.correct-cats').html('<button type="button" class="button small" data-close id="'
				+ name + '_id" aria-label="Close reveal">'
				+ name + '</button>')
			$('#' + name + '_id').click(function() {
				bayesUpdateCategory(name)
			})
		}
	}
})