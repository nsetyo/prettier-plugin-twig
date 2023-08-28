import { extension as core_ext } from 'melody-extension-core'
import { ParserOptions } from 'prettier'

import { ORIGINAL_SOURCE } from '../symbols'
import { Extension } from '../types'
import { CharStream } from './CharStream'
import Lexer from './Lexer'
import Parser from './Parser'
import TokenStream from './TokenStream'

const createConfiguredLexer = (code: string, ...extensions: Extension[]) => {
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

const applyParserExtensions = (parser: Parser, ...extensions: Extension[]) => {
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

export const parse = (text: string, opt: ParserOptions<any>): any => {
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
	})

	applyParserExtensions(parser, core_ext)

	return Object.assign(parser.parse(), { [ORIGINAL_SOURCE]: text })
}

export const hasPragma = () => {
	return false
}

export const locStart = () => {
	return -1
}

export const locEnd = () => {
	return -1
}
