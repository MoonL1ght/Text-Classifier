let classificationMethod = 'bayes'

function chooseButtonClick() {
	let value = $('input[name="methodGroup"]:checked').val();
	chooseMethodView(value)
}

function chooseMethodView(method) {
	switch (method) {
		case 'bayes': {
			$('.bayes-view').css('display', 'block')
			$('.fpgrowth-view').css('display', 'none')
			$('.unknown').css('display', 'none')
			break
		}
		case 'fpgrowth': {
			$('.bayes-view').css('display', 'none')
			$('.fpgrowth-view').css('display', 'block')
			$('.unknown').css('display', 'none')
			break
		}
		case 'unknown': {
			$('.unknown').css('display', 'block')
			$('.bayes-view').css('display', 'none')
			$('.fpgrowth-view').css('display', 'none')
			break
		}
	}
}