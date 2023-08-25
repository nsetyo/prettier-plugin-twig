import { Node } from 'melody-types'
import prettier, { AstPath } from 'prettier'

import Utils from '../util'
const { line, join, hardline } = prettier.doc.builders
const {
	isWhitespaceOnly,
	countNewlines,
	createTextGroups,
	PRESERVE_LEADING_WHITESPACE,
	PRESERVE_TRAILING_WHITESPACE,
	NEWLINES_ONLY,
} = Utils

const newlinesOnly = (s, preserveWhitespace = true) => {
	const numNewlines = countNewlines(s)
	if (numNewlines === 0) {
		return preserveWhitespace ? line : ''
	} else if (numNewlines === 1) {
		return hardline
	}
	return [hardline, hardline]
}

export const printTextStatement = (node: Node, path: AstPath, print) => {
	// Check for special values that might have been
	// computed during preprocessing
	const preserveLeadingWs = node[PRESERVE_LEADING_WHITESPACE] === true

	const preserveTrailingWs = node[PRESERVE_TRAILING_WHITESPACE] === true

	const rawString = path.call(print, 'value')

	if (isWhitespaceOnly(rawString) && node[NEWLINES_ONLY]) {
		return newlinesOnly(rawString)
	}

	const textGroups = createTextGroups(
		rawString,
		preserveLeadingWs,
		preserveTrailingWs
	)

	return join([hardline, hardline], textGroups)
}
