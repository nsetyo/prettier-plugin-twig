import { Node } from 'melody-types'
import { AstPath } from 'prettier'

import Utils from '../util'
const { isValidIdentifierName, STRING_NEEDS_QUOTES } = Utils

export const printObjectProperty = (
	node: Node,
	path: AstPath,
	print,
	options
) => {
	node[STRING_NEEDS_QUOTES] =
		node[STRING_NEEDS_QUOTES] ||
		(!node.computed &&
			Node.isStringLiteral(node.key) &&
			!isValidIdentifierName(node.key.value))

	const shouldPrintKeyAsString = node.key.wasImplicitConcatenation
	const needsParentheses = node.computed && !shouldPrintKeyAsString
	const parts: any[] = []

	if (needsParentheses) {
		parts.push('(')
	}
	parts.push(path.call(print, 'key'))

	if (needsParentheses) {
		parts.push(')')
	}
	parts.push(': ')

	node[STRING_NEEDS_QUOTES] = true

	parts.push(path.call(print, 'value'))

	return parts
}
