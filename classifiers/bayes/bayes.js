'use strict'

const fs = require('fs')
const path = require('path')
const ipc = require('electron').ipcMain
const dialog = require('electron').dialog
const TextParser = require(path.resolve(__dirname, '../text-parser.js')).TextParser

let classifier = null
let renderer = null
let fileToClassif = null

module.exports.load = function(sender) {
	ipc.on('open-file', (event) => {
		dialog.showOpenDialog({properties:['openFile']}, (file) => {
			if (file && file[0]) {
				fileToClassif = file[0]
				event.sender.send('bayes-selected-file', file[0])
			} else {
				fileToClassif = null
				event.sender.send('bayes-notselected-file')
			}
		})
	})

	ipc.on('classify-file', (event) => {
		if (fileToClassif) {
			classifier.classifyFile(fileToClassif)
		}
	})

	ipc.on('bayes-update', (event, msg) => {
		classifier.update(TextParser.parseFile(fileToClassif), msg)
	})

	renderer = sender
	let learnDirPath = path.resolve(__dirname, './learn-data')
	classifier = new BayesClassifier({
		learnDir: learnDirPath
	})
}

module.exports.unload = function() {
	
	classifier = null
	renderer = null
	fileToClassif = null
}

class BayesClassifier {
	constructor(params) {
		this._categories = {}
		this._probNums = {}
		this._probDenoms = {}
		this._vocabSet = new Set()
		this._totalNumberOfTrDocs = 0.0
		this._learnDir = params.learnDir
		this._promise = null
		this._load()
	}

	classifyFile(file) {
		if (this._promise) {
			this._promise.then(() => {
				try {
					let result = this._classify(TextParser.parseFile(file))
					renderer.send('bayes-result', result)
				} catch (err) {
					const options = {
						type: 'info',
						title: 'Warning',
						message: 'Wrong file type!',
						buttons: ['Ok']
					}
					dialog.showOpenDialog(options)
				}
			}, (error) => {
				throw error
			})
		} else {
			try {
				let result = this._classify(TextParser.parseFile(file))
				renderer.send('bayes-result', result)
			} catch (err) {
				const options = {
					type: 'info',
					title: 'Warning',
					message: 'Wrong file type!',
					buttons: ['Ok']
				}
				dialog.showOpenDialog(options)
			}
		}
	}

	classifyMessage(msg) {
		if (this._promise) {
			this._promise.then(() => {
				let result = this._classify(TextParser.parseMessage(msg))
				renderer.send('bayes-result', result)
			}, (error) => {
				throw error
			})
		} else {
			let result = this._classify(TextParser.parseMessage(msg))
			renderer.send('bayes-result', result)
		}
	}

	update(words, category) {
		this._train(words, category)
		this._save()
	}

	_classify(words) {
		let vector = this._createWordsVecFromDoc(words)
		let maxProb = -Number.MAX_VALUE
		let docCategory = ''
		for (let category in this._categories) {
			let categoryVec = BayesClassifierMath
									.logDevideVecByNum(this._probNums[category], 
														this._probDenoms[category])
			let prob = BayesClassifierMath
							.multiplyTwoVectors(vector, categoryVec)
							.reduce(function(a, b) { return a + b; }, 0)
			prob += Math.log(this._categories[category] / this._totalNumberOfTrDocs)
			if (prob > maxProb) {
				maxProb = prob
				docCategory = category
			}
		}
		return docCategory
	}

	_save() {
		let db = {
			totalNumberOfTrDocs: this._totalNumberOfTrDocs,
			categories: this._categories,
			probNums: this._probNums,
			probDenoms: this._probDenoms,
			vocabSet: Array.from(this._vocabSet)
		}
		fs.writeFile(path.resolve(__dirname, './bayes-db.json'), JSON.stringify(db), (error) => {
			if (error) {
				throw error
			}
		})
	}

	_load() {
		this._promise = new Promise((resolve, reject) => {
			try {
				let dbPath = path.resolve(__dirname, './bayes-db.json')
				let stat = fs.statSync(dbPath)
				fs.readFile(dbPath, (error, db) => {
					if (error) {
						reject(error)
					}
					db = JSON.parse(db)
					this._totalNumberOfTrDocs = db['totalNumberOfTrDocs']
					this._categories = db['categories']
					this._probNums = db['probNums']
					this._probDenoms = db['probDenoms']
					this._vocabSet = new Set(db['vocabSet'])
					renderer.send('bayes-ready',  Object.keys(this._categories))
					resolve()
				})
			} catch (error) {
				if (error.code == 'ENOENT') {
					this._trainFromLearnData(this._learnDir)
					renderer.send('bayes-ready', Object.keys(this._categories))
					resolve()
				}
			}	
		})
	}

	_train(words, category) {
		this._updateVocabSet(words)
		let vector = this._createWordsVecFromDoc(words)
		this._totalNumberOfTrDocs ++
		this._categories[category] ++
		for (let cat in this._categories) {
			if (this._probNums[cat].length < this._vocabSet.size) {
				let lengthOffset = this._vocabSet.size - this._probNums[cat].length
				for (let i = 0; i < lengthOffset; i++) {
					this._probNums[cat].push(1)
				}
			}
		}
		this._probNums[category] = BayesClassifierMath
									.addTwoVectors(this._probNums[category], vector)
		this._probDenoms[category] += vector.reduce(function(a, b) { return a + b; }, 0);
	}

	_trainFromLearnData(learnDir) {
		try {
			learnDir = path.resolve(__dirname, learnDir)
			let learnSettings = JSON.parse(fs.readFileSync(learnDir + '/learn-info.json'))
			Object.keys(learnSettings).forEach( (category, i) => {
				this._categories[category] = 0.0
				this._probNums[category] = []
				this._probDenoms[category] = 2.0
			})
			for (let category in learnSettings) {
				let dirPath = path.resolve(learnDir, learnSettings[category])
				let dirs = fs.readdirSync(dirPath)
				for (let i = 0; i < dirs.length; i++) {
					let file = dirPath + '/' + dirs[i]
					let stat = fs.statSync(file)
					if (stat.isFile) {
						let words = TextParser.parseFile(file)
						this._train(words, category)
					}
				}
			}
			this._save()
		} catch (error) {
			throw error
		}
	}

	_createWordsVecFromDoc(doc) {
		let vocabList = Array.from(this._vocabSet)
		let vec = new Array(vocabList.length).fill(0)
		for (let i = 0; i < doc.length; i++) {
			if (vocabList.indexOf(doc[i]) != -1) {
				vec[vocabList.indexOf(doc[i])] += 1
			}
		}
		return vec
	}

	_updateVocabSet(words) {
		for (let i = 0; i < words.length; i++) {
			this._vocabSet.add(words[i])
		}
	}
}

class BayesClassifierMath {
	static addTwoVectors(v1, v2) {
		if (v1.length != v2.length) {
			throw new Error('error in adding vectors')
		}
		let result = []
		for (let i = 0; i < v1.length; i++) {
			result.push(v1[i] + v2[i])
		}
		return result
	}

	static multiplyTwoVectors(v1, v2) {
		if (v1.length != v2.length) {
			throw new Error('error in multiplying vectors')
		}
		let result = []
		for (let i = 0; i < v1.length; i++) {
			result.push(v1[i] * v2[i])
		}
		return result
	}

	static logDevideVecByNum(v, num) {
		let vector = []
		for (let i = 0; i < v.length; i++) {
			vector.push(Math.log(v[i] / num))
		}
		return vector
	}
}