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
import { Position, Token } from '../types'
import { CharStream, EOF } from './CharStream'
import * as TokenTypes from './TokenTypes'

const State = {
	TEXT: 'TEXT',
	EXPRESSION: 'EXPRESSION',
	TAG: 'TAG',
	INTERPOLATION: 'INTERPOLATION',
	STRING_SINGLE: 'STRING_SINGLE',
	STRING_DOUBLE: 'STRING_DOUBLE',
	ELEMENT: 'ELEMENT',
	ATTRIBUTE_VALUE: 'ATTRIBUTE_VALUE',
	DECLARATION: 'DECLARATION',
}

const OPERATORS = Symbol()
const STATE = Symbol()
const STRING_START = Symbol()

const CHAR_TO_TOKEN = {
	'[': TokenTypes.LBRACE,
	']': TokenTypes.RBRACE,
	'(': TokenTypes.LPAREN,
	')': TokenTypes.RPAREN,
	'{': TokenTypes.LBRACKET,
	'}': TokenTypes.RBRACKET,
	':': TokenTypes.COLON,
	'.': TokenTypes.DOT,
	'|': TokenTypes.PIPE,
	',': TokenTypes.COMMA,
	'?': TokenTypes.QUESTION_MARK,
	'=': TokenTypes.ASSIGNMENT,
	//'<': TokenTypes.ELEMENT_START,
	//'>': TokenTypes.ELEMENT_END,
	'/': TokenTypes.SLASH,
}

export default class Lexer {
	input: CharStream
	options: Record<string, any>

	constructor(input: CharStream, { preserveSourceLiterally = false } = {}) {
		this[STATE] = [State.TEXT]
		this[OPERATORS] = []
		this[STRING_START] = null

		this.input = input
		this.options = {
			preserveSourceLiterally:
				preserveSourceLiterally === true ? true : false,
		}
	}

	applyExtension(ext) {
		if (ext.unaryOperators) {
			this.addOperators(...ext.unaryOperators.map((op) => op.text))
		}
		if (ext.binaryOperators) {
			this.addOperators(...ext.binaryOperators.map((op) => op.text))
		}
	}

	reset() {
		this.input.reset()

		this[STATE] = [State.TEXT]
	}

	get source() {
		return this.input.source
	}

	addOperators(...ops) {
		this[OPERATORS].push(...ops)
		this[OPERATORS].sort((a, b) => (a.length > b.length ? -1 : 1))
	}

	get state() {
		return this[STATE][this[STATE].length - 1]
	}

	pushState(state) {
		this[STATE].push(state)
	}

	popState() {
		this[STATE].length--
	}

	createToken(type: string, pos: Position): Token {
		const input = this.input
		const endPos = input.mark()
		const end = endPos.index || -1

		return {
			end,
			endPos,
			length: end - pos.index,
			pos,
			source: input.input,
			text: input.input.substr(pos.index, end - pos.index),
			type,
			toString: function () {
				return this.text
			},
		}
	}

	next(): Token {
		const input = this.input

		let pos: Position
		let c: string | typeof EOF

		while ((c = input.la(0)) !== EOF) {
			pos = input.mark()
			if (
				this.state !== State.TEXT &&
				this.state !== State.STRING_DOUBLE &&
				this.state !== State.STRING_SINGLE &&
				this.state !== State.ATTRIBUTE_VALUE &&
				isWhitespace(c)
			) {
				input.next()
				while ((c = input.la(0)) !== EOF && isWhitespace(c)) {
					input.next()
				}
				return this.createToken(TokenTypes.WHITESPACE, pos)
			}
			if (c === '{' && input.la(1) === '#') {
				input.next()
				input.next()
				if (input.la(0) === '-') {
					input.next()
				}
				while ((c = input.la(0)) !== EOF) {
					if (
						(c === '#' && input.la(1) === '}') ||
						(c === '-' &&
							input.la(1) === '#' &&
							input.la(2) === '}')
					) {
						if (c === '-') {
							input.next()
						}
						input.next()
						input.next()
						return this.createToken(TokenTypes.COMMENT, pos)
					}
					input.next()
				}
			}

			if (this.state === State.TEXT) {
				let entityToken

				if (c === '<') {
					if (
						input.la(1) === '{' ||
						isAlpha(input.lac(1)) ||
						input.la(1) === '/'
					) {
						input.next()
						this.pushState(State.ELEMENT)
						return this.createToken(TokenTypes.ELEMENT_START, pos)
					} else if (
						input.la(1) === '!' &&
						input.la(2) === '-' &&
						input.la(3) === '-'
					) {
						// match HTML comment
						input.next() // <
						input.next() // !
						input.next() // -
						input.next() // -
						while ((c = input.la(0)) !== EOF) {
							if (c === '-' && input.la(1) === '-') {
								input.next()
								input.next()
								if (!((c = input.next()) === '>')) {
									this.error(
										'Unexpected end for HTML comment',
										input.mark(),
										`Expected comment to end with '>' but found '${String(
											c
										)}' instead.`
									)
								}
								break
							}
							input.next()
						}
						return this.createToken(TokenTypes.HTML_COMMENT, pos)
					} else if (
						input.la(1) === '!' &&
						(isAlpha(input.lac(2)) || isWhitespace(input.la(2)))
					) {
						input.next()
						input.next()
						this.pushState(State.DECLARATION)
						return this.createToken(
							TokenTypes.DECLARATION_START,
							pos
						)
					} else {
						return this.matchText(pos)
					}
				} else if (c === '{') {
					return this.matchExpressionToken(pos)
				} else if (c === '&' && (entityToken = this.matchEntity(pos))) {
					return entityToken
				} else {
					return this.matchText(pos)
				}
			} else if (this.state === State.EXPRESSION) {
				if (
					(c === '}' && input.la(1) === '}') ||
					(c === '-' && input.la(1) === '}' && input.la(2) === '}')
				) {
					if (c === '-') {
						input.next()
					}
					input.next()
					input.next()
					this.popState()
					return this.createToken(TokenTypes.EXPRESSION_END, pos)
				}
				return this.matchExpression(pos)
			} else if (this.state === State.TAG) {
				if (
					(c === '%' && input.la(1) === '}') ||
					(c === '-' && input.la(1) === '%' && input.la(2) === '}')
				) {
					if (c === '-') {
						input.next()
					}
					input.next()
					input.next()
					this.popState()
					return this.createToken(TokenTypes.TAG_END, pos)
				}
				return this.matchExpression(pos)
			} else if (
				this.state === State.STRING_SINGLE ||
				this.state === State.STRING_DOUBLE
			) {
				return this.matchString(pos, true)
			} else if (this.state === State.INTERPOLATION) {
				if (c === '}') {
					input.next()
					this.popState() // pop interpolation
					return this.createToken(TokenTypes.INTERPOLATION_END, pos)
				}
				return this.matchExpression(pos)
			} else if (this.state === State.ELEMENT) {
				switch (c) {
					case '/':
						input.next()
						return this.createToken(TokenTypes.SLASH, pos)
					case '{':
						return this.matchExpressionToken(pos)
					case '>':
						input.next()
						this.popState()
						return this.createToken(TokenTypes.ELEMENT_END, pos)
					case '"':
						input.next()
						this.pushState(State.ATTRIBUTE_VALUE)
						return this.createToken(TokenTypes.STRING_START, pos)
					case '=':
						input.next()
						return this.createToken(TokenTypes.ASSIGNMENT, pos)
					default:
						return this.matchSymbol(pos)
				}
			} else if (this.state === State.ATTRIBUTE_VALUE) {
				if (c === '"') {
					input.next()
					this.popState()
					return this.createToken(TokenTypes.STRING_END, pos)
				} else {
					return this.matchAttributeValue(pos)
				}
			} else if (this.state === State.DECLARATION) {
				switch (c) {
					case '>':
						input.next()
						this.popState()
						return this.createToken(TokenTypes.ELEMENT_END, pos)
					case '"':
						input.next()
						this.pushState(State.STRING_DOUBLE)
						return this.createToken(TokenTypes.STRING_START, pos)
					case '{':
						return this.matchExpressionToken(pos)
					default:
						return this.matchSymbol(pos)
				}
			} else {
				return this.error(`Invalid state ${this.state}`, pos)
			}
		}
		return TokenTypes.EOF_TOKEN
	}

	matchExpressionToken(pos) {
		const input = this.input
		switch (input.la(1)) {
			case '{':
				input.next()
				input.next()
				this.pushState(State.EXPRESSION)
				if (input.la(0) === '-') {
					input.next()
				}
				return this.createToken(TokenTypes.EXPRESSION_START, pos)
			case '%':
				input.next()
				input.next()
				this.pushState(State.TAG)
				if (input.la(0) === '-') {
					input.next()
				}
				return this.createToken(TokenTypes.TAG_START, pos)
			case '#':
				input.next()
				input.next()
				if (input.la(0) === '-') {
					input.next()
				}
				return this.matchComment(pos)
			default:
				return this.matchText(pos)
		}
	}

	matchExpression(pos: Position) {
		const input = this.input

		const c = input.la(0) as string

		switch (c) {
			case "'":
				this.pushState(State.STRING_SINGLE)
				input.next()
				return this.createToken(TokenTypes.STRING_START, pos)
			case '"':
				this.pushState(State.STRING_DOUBLE)
				input.next()
				return this.createToken(TokenTypes.STRING_START, pos)
			default: {
				if (isDigit(input.lac(0))) {
					input.next()
					return this.matchNumber(pos)
				}
				if (
					(c === 't' && input.match('true')) ||
					(c === 'T' && input.match('TRUE'))
				) {
					return this.createToken(TokenTypes.TRUE, pos)
				}
				if (
					(c === 'f' && input.match('false')) ||
					(c === 'F' && input.match('FALSE'))
				) {
					return this.createToken(TokenTypes.FALSE, pos)
				}
				if (
					(c === 'n' &&
						(input.match('null') || input.match('none'))) ||
					(c === 'N' && (input.match('NULL') || input.match('NONE')))
				) {
					return this.createToken(TokenTypes.NULL, pos)
				}
				const { longestMatchingOperator, longestMatchEndPos } =
					this.findLongestMatchingOperator()

				const cc = input.lac(0)

				if (cc === 95 /* _ */ || isAlpha(cc) || isDigit(cc)) {
					// okay... this could be either a symbol or an operator
					input.next()
					const sym = this.matchSymbol(pos)
					if (sym.text.length <= longestMatchingOperator.length) {
						// the operator was longer so let's use that
						input.rewind(longestMatchEndPos)

						return this.createToken(TokenTypes.OPERATOR, pos)
					}
					// found a symbol
					return sym
				} else if (cc === 61 && input.lac(1) === 62) {
					input.next()
					input.next()

					return this.createToken(TokenTypes.ARROW_TYPE, pos)
				} else if (longestMatchingOperator) {
					input.rewind(longestMatchEndPos)

					return this.createToken(TokenTypes.OPERATOR, pos)
					// eslint-disable-next-line no-prototype-builtins
				} else if (CHAR_TO_TOKEN.hasOwnProperty(c)) {
					input.next()

					return this.createToken(CHAR_TO_TOKEN[c], pos)
				} else if (c === '\xa0') {
					return this.error(
						'Unsupported token: Non-breaking space',
						pos
					)
				} else {
					return this.error(`Unknown token ${c}`, pos)
				}
			}
		}
	}

	findLongestMatchingOperator() {
		const input = this.input
		const start = input.mark()

		let longestMatchingOperator = ''
		let longestMatchEndPos: Position = {} as Position

		const ops = this[OPERATORS]

		const len = ops.length

		for (let i = 0; i < len; i++) {
			const op: string = ops[i]

			if (op.length > longestMatchingOperator.length && input.match(op)) {
				const cc = input.lac(0)

				// prevent mixing up operators with symbols (e.g. matching
				// 'not in' in 'not invalid').
				if (op.indexOf(' ') === -1 || !(isAlpha(cc) || isDigit(cc))) {
					longestMatchingOperator = op
					longestMatchEndPos = input.mark()
				}

				input.rewind(start)
			}
		}
		input.rewind(start)

		return { longestMatchingOperator, longestMatchEndPos }
	}

	error(message, pos, advice = '') {
		const errorToken: any = this.createToken(TokenTypes.ERROR, pos)
		errorToken.message = message
		errorToken.advice = advice
		return errorToken
	}

	matchEntity(pos) {
		const input = this.input
		input.next() // &
		if (input.la(0) === '#') {
			input.next() // #
			if (input.la(0) === 'x') {
				// hexadecimal numeric character reference
				input.next() // x
				let c = input.la(0) as string
				while (
					('a' <= c && c <= 'f') ||
					('A' <= c && c <= 'F') ||
					isDigit(input.lac(0))
				) {
					input.next()
					c = input.la(0) as string
				}
				if (input.la(0) === ';') {
					input.next()
				} else {
					input.rewind(pos)
					return null
				}
			} else if (isDigit(input.lac(0))) {
				// decimal numeric character reference
				// consume decimal numbers
				do {
					input.next()
				} while (isDigit(input.lac(0)))
				// check for final ";"
				if (input.la(0) === ';') {
					input.next()
				} else {
					input.rewind(pos)
					return null
				}
			} else {
				input.rewind(pos)
				return null
			}
		} else {
			// match named character reference
			while (isAlpha(input.lac(0))) {
				input.next()
			}
			if (input.la(0) === ';') {
				input.next()
			} else {
				input.rewind(pos)
				return null
			}
		}
		return this.createToken(TokenTypes.ENTITY, pos)
	}

	matchSymbol(pos) {
		const input = this.input
		const inElement = this.state === State.ELEMENT
		let c

		while (
			(c = input.lac(0)) &&
			(c === 95 ||
				isAlpha(c) ||
				isDigit(c) ||
				(inElement && (c === 45 || c === 58)))
		) {
			input.next()
		}
		const end = input.mark()
		if (pos.index === end.index) {
			return this.error(
				'Expected an Identifier',
				pos,
				inElement
					? `Expected a valid attribute name, but instead found "${
							input.la(0) as string
					  }", which is not part of a valid attribute name.`
					: `Expected letter, digit or underscore but found ${
							input.la(0) as string
					  } instead.`
			)
		}
		return this.createToken(TokenTypes.SYMBOL, pos)
	}

	matchString(pos, allowInterpolation = true) {
		const input = this.input,
			start = this.state === State.STRING_SINGLE ? "'" : '"'
		let c
		// string starts with an interpolation
		if (allowInterpolation && input.la(0) === '#' && input.la(1) === '{') {
			this.pushState(State.INTERPOLATION)
			input.next()
			input.next()
			return this.createToken(TokenTypes.INTERPOLATION_START, pos)
		}
		if (input.la(0) === start) {
			input.next()
			this.popState()
			return this.createToken(TokenTypes.STRING_END, pos)
		}
		while ((c = input.la(0)) !== start && c !== EOF) {
			if (c === '\\' && input.la(1) === start) {
				// escape sequence for string start
				input.next()
				input.next()
			} else if (allowInterpolation && c === '#' && input.la(1) === '{') {
				// found interpolation start, string part matched
				// next iteration will match the interpolation
				break
			} else {
				input.next()
			}
		}
		const result = this.createToken(TokenTypes.STRING, pos)
		// Replace double backslash before escaped quotes
		if (!this.options.preserveSourceLiterally) {
			result.text = result.text.replace(
				new RegExp('(?:\\\\)(' + start + ')', 'g'),
				'$1'
			)
		}
		return result
	}

	matchAttributeValue(pos) {
		const input = this.input
		const start = this.state === State.STRING_SINGLE ? "'" : '"'
		let c

		if (input.la(0) === '{') {
			return this.matchExpressionToken(pos)
		}
		while ((c = input.la(0)) !== start && c !== EOF) {
			if (c === '\\' && input.la(1) === start) {
				input.next()
				input.next()
			} else if (c === '{') {
				// interpolation start
				break
			} else if (c === start) {
				break
			} else {
				input.next()
			}
		}
		const result = this.createToken(TokenTypes.STRING, pos)
		// Replace double backslash before escaped quotes
		if (!this.options.preserveSourceLiterally) {
			result.text = result.text.replace(
				new RegExp('(?:\\\\)(' + start + ')', 'g'),
				'$1'
			)
		}
		return result
	}

	matchNumber(pos) {
		const input = this.input
		let c

		while ((c = input.lac(0)) !== EOF) {
			if (!isDigit(c)) {
				break
			}
			input.next()
		}
		if (input.la(0) === '.' && isDigit(input.lac(1))) {
			input.next()
			while ((c = input.lac(0)) !== EOF) {
				if (!isDigit(c)) {
					break
				}
				input.next()
			}
		}
		return this.createToken(TokenTypes.NUMBER, pos)
	}

	matchText(pos) {
		const input = this.input
		let c
		while ((c = input.la(0)) && c !== EOF) {
			if (c === '{') {
				const c2 = input.la(1)
				if (c2 === '{' || c2 === '#' || c2 === '%') {
					break
				}
			} else if (c === '<') {
				const nextChar = input.la(1)
				if (
					nextChar === '/' || // closing tag
					nextChar === '!' || // HTML comment
					isAlpha(input.lac(1)) // opening tag
				) {
					break
				} else if (input.la(1) === '{') {
					const c2 = input.la(1)
					if (c2 === '{' || c2 === '#' || c2 === '%') {
						break
					}
				}
			}
			input.next()
		}
		return this.createToken(TokenTypes.TEXT, pos)
	}

	matchComment(pos) {
		const input = this.input
		let c

		while ((c = input.next()) !== EOF) {
			if (c === '#' && input.la(0) === '}') {
				input.next() // consume '}'
				break
			}
		}
		return this.createToken(TokenTypes.COMMENT, pos)
	}
}

function isWhitespace(c: string | typeof EOF) {
	return c !== EOF && (c === '\n' || c === ' ' || c === '\t')
}

function isAlpha(c: number | typeof EOF) {
	return c !== EOF && ((65 <= c && c <= 90) || (97 <= c && c <= 122))
}

function isDigit(c: number | typeof EOF) {
	return c !== EOF && 48 <= c && c <= 57
}
