import { Node } from 'melody-types'

import Utils from '../util'

const { EXPRESSION_NEEDED, STRING_NEEDS_QUOTES } = Utils

const mayCorrectWhitespace = (attrName) =>
	['id', 'class', 'type'].indexOf(attrName) > -1

const sanitizeWhitespace = (s) => s.replace(/\s+/g, ' ').trim()

const printConcatenatedString = (valueNode, path, print, ...initialPath) => {
	const printedFragments: any[] = []
	let currentNode = valueNode
	const currentPath = initialPath
	while (Node.isBinaryConcatExpression(currentNode)) {
		printedFragments.unshift(path.call(print, ...currentPath, 'right'))
		currentPath.push('left')
		currentNode = currentNode.left
	}
	printedFragments.unshift(path.call(print, ...currentPath))
	return printedFragments
}

export const printAttribute = (node, path, print) => {
	node[EXPRESSION_NEEDED] = false
	const docs = [path.call(print, 'name')]
	node[EXPRESSION_NEEDED] = true
	node[STRING_NEEDS_QUOTES] = false
	if (node.value) {
		docs.push('="')
		if (
			Node.isBinaryConcatExpression(node.value) &&
			node.value.wasImplicitConcatenation
		) {
			// Special handling for concatenated string values
			docs.push(printConcatenatedString(node.value, path, print, 'value'))
		} else {
			const isStringValue = Node.isStringLiteral(node.value)
			if (mayCorrectWhitespace(node.name.name) && isStringValue) {
				node.value.value = sanitizeWhitespace(node.value.value)
			}
			docs.push(path.call(print, 'value'))
		}
		docs.push('"')
	}

	return docs
}