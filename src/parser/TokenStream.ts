/**
 * Copyright 2017 trivago N.V.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import trimEnd from 'lodash/trimEnd'
import trimStart from 'lodash/trimStart'
import codeFrame from 'melody-code-frame'

import { Position, Token } from '../types'
import Lexer from './Lexer'
import {
	COMMENT,
	EOF_TOKEN,
	ERROR,
	ERROR_TABLE,
	EXPRESSION_END,
	EXPRESSION_START,
	HTML_COMMENT,
	STRING,
	TAG_END,
	TAG_START,
	TEXT,
	WHITESPACE,
} from './TokenTypes'

const TOKENS = Symbol()
const LENGTH = Symbol()

export default class TokenStream {
	input: Lexer
	index: number;

	[TOKENS]: Token[]

	constructor(lexer: Lexer, options) {
		this.input = lexer
		this.index = 0

		const mergedOptions = {
			applyWhitespaceTrimming: true,
			ignoreComments: true,
			ignoreHtmlComments: true,
			ignoreWhitespace: true,
			...options,
		}

		this[TOKENS] = getAllTokens(lexer, mergedOptions)
		this[LENGTH] = this[TOKENS].length

		if (this[TOKENS].length && this[TOKENS].at(-1)?.type === ERROR) {
			const errorToken = this[TOKENS].at(-1) as Token

			const endPosIndex = errorToken?.endPos?.index || 0
			const posIndex = errorToken?.pos.index || 1

			this.error(
				errorToken.message || '',
				errorToken.pos,
				errorToken.advice || '',
				endPosIndex - posIndex
			)
		}
	}

	la(offset: number): Token {
		const index = this.index + offset

		return index < this[LENGTH] ? this[TOKENS][index] : EOF_TOKEN
	}

	lat(offset: number) {
		return this.la(offset).type
	}

	test(type: string, text?: string) {
		const token = this.la(0)

		return token.type === type && (!text || token.text === text)
	}

	next(): Token {
		if (this.index === this[LENGTH]) {
			return EOF_TOKEN
		}
		const token = this[TOKENS][this.index]

		this.index++

		return token
	}

	nextIf(type: string, text?: string) {
		return this.test(type, text) ? this.next() : false
	}

	expect(type: string, text?: string): Token | never {
		const token = this.la(0)

		if (token.type === type && (!text || token.text === text)) {
			return this.next()
		}

		return this.error(
			'Invalid Token',
			token.pos,
			`Expected ${ERROR_TABLE[type] || type || text} but found ${
				ERROR_TABLE[token.type] || token.type || token.text
			} instead.`,
			token.length
		)
	}

	error(
		message: string,
		pos: Position,
		advice: string,
		length = 1,
		metadata = {}
	): never {
		let errorMessage = `ERROR: ${message}\n`

		errorMessage += codeFrame({
			rawLines: this.input.source,
			lineNumber: pos.line,
			colNumber: pos.column,
			length,
			tokens: getAllTokens(this.input, {
				ignoreWhitespace: false,
				ignoreComments: false,
				ignoreHtmlComments: false,
			}),
		})

		if (advice) {
			errorMessage += '\n\n' + advice
		}
		const result = new Error(errorMessage)

		Object.assign(result, metadata)

		throw result
	}
}

function getAllTokens(lexer: Lexer, options): Token[] {
	const tokens: Token[] = []

	let token: Token
	let acceptWhitespaceControl = false
	let trimNext = false

	while ((token = lexer.next()) !== EOF_TOKEN) {
		const shouldTrimNext = trimNext

		trimNext = false

		if (acceptWhitespaceControl) {
			switch (token.type) {
				case EXPRESSION_START:
				case TAG_START:
					if (token.text[token.text.length - 1] === '-') {
						tokens[tokens.length - 1].text = trimEnd(
							tokens[tokens.length - 1].text
						)
					}
					break
				case EXPRESSION_END:
				case TAG_END:
					if (token.text[0] === '-') {
						trimNext = true
					}
					break
				case COMMENT: {
					const ltoken = tokens.at(-1)

					if (ltoken && ltoken.type === TEXT) {
						ltoken.text = trimEnd(ltoken.text)
					}

					trimNext = true
					break
				}
			}
		}

		if (shouldTrimNext && (token.type === TEXT || token.type === STRING)) {
			token.text = trimStart(token.text)
		}

		if (
			(token.type !== COMMENT || !options.ignoreComments) &&
			(token.type !== WHITESPACE || !options.ignoreWhitespace) &&
			(token.type !== HTML_COMMENT || !options.ignoreHtmlComments)
		) {
			tokens[tokens.length] = token
		}

		acceptWhitespaceControl = options.applyWhitespaceTrimming

		if (token.type === ERROR) {
			return tokens
		}
	}

	return tokens
}
