import { extension as core_ext } from 'melody-extension-core'
import { ParserOptions } from 'prettier'

import { CharStream } from './CharStream'
import Lexer from './Lexer'
import Parser from './Parser'
import TokenStream from './TokenStream'

export const ORIGINAL_SOURCE = Symbol('ORIGINAL_SOURCE')

const createConfiguredLexer = (code, ...extensions) => {
	const lexer = new Lexer(new CharStream(code))

	for (const ext of extensions) {
		if (ext.unaryOperators) {
			lexer.addOperators(...ext.unaryOperators.map((op) => op.text))
		}
		if (ext.binaryOperators) {
			lexer.addOperators(...ext.binaryOperators.map((op) => op.text))
		}
	}
	return lexer
}

const applyParserExtensions = (parser: Parser, ...extensions) => {
	for (const extension of extensions) {
		if (extension.tags) {
			for (const tag of extension.tags) {
				parser.addTag(tag)
			}
		}
		if (extension.unaryOperators) {
			for (const op of extension.unaryOperators) {
				parser.addUnaryOperator(op)
			}
		}
		if (extension.binaryOperators) {
			for (const op of extension.binaryOperators) {
				parser.addBinaryOperator(op)
			}
		}
		if (extension.tests) {
			for (const test of extension.tests) {
				parser.addTest(test)
			}
		}
	}
}

export const parse = (text: string, parsers, opt: ParserOptions<any>): any => {
	const lexer = createConfiguredLexer(text, core_ext)

	const token_stream = new TokenStream(lexer, {
		ignoreWhitespace: true,
		ignoreComments: false,
		ignoreHtmlComments: false,
		applyWhitespaceTrimming: false,
	})

	const parser = new Parser(token_stream, {
		ignoreComments: false,
		ignoreHtmlComments: false,
		ignoreDeclarations: false,
		decodeEntities: false,
		// allowUnknownTags: true,
	})

	applyParserExtensions(parser, core_ext)

	return Object.assign(parser.parse(), { [ORIGINAL_SOURCE]: text })
}

export const hasPragma = (/* text */) => {
	return false
}

export const locStart = (/* node */) => {
	return -1
}

export const locEnd = (/* node */) => {
	return -1
}
