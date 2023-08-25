import prettier from 'prettier'

import Utils from '../util'

const { group } = prettier.doc.builders
const { EXPRESSION_NEEDED, STRING_NEEDS_QUOTES, wrapExpressionIfNeeded } = Utils

export const printUnaryExpression = (node, path, print) => {
	node[EXPRESSION_NEEDED] = false
	node[STRING_NEEDS_QUOTES] = true
	const parts = [node.operator, path.call(print, 'argument')]
	wrapExpressionIfNeeded(path, parts, node)
	return group(parts)
}
