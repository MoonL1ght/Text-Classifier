'use strict'

const fs = require('fs')
const natural = require('natural')
const tokenizer = new natural.WordTokenizer()

natural.PorterStemmer.attach()
natural.PorterStemmerRu.attach()

class TextParser {
	static parseFile(filePath) {
		try {
			let data = fs.readFileSync(filePath)
			return data.toString('utf8').tokenizeAndStem()
		} catch (err) {
			throw err
		}
	}

	static parseMessage(msg) {
		return msg.tokenizeAndStem()
	}
}

module.exports.TextParser = TextParser