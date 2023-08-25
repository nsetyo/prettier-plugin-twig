import prettier from 'prettier'

import Utils from '../util'

const { EXPRESSION_NEEDED, STRING_NEEDS_QUOTES, wrapExpressionIfNeeded } = Utils

const { group } = prettier.doc.builders

export const printMemberExpression = (node, path, print) => {
	node[EXPRESSION_NEEDED] = false
	node[STRING_NEEDS_QUOTES] = true
	const parts = [path.call(print, 'object')]
	parts.push(node.computed ? '[' : '.')
	parts.push(path.call(print, 'property'))
	if (node.computed) {
		parts.push(']')
	}
	wrapExpressionIfNeeded(path, parts, node)
	return group(parts)
}
