import prettier from 'prettier'

import Utils from '../util'

const { EXPRESSION_NEEDED, wrapExpressionIfNeeded } = Utils

const { group } = prettier.doc.builders

export const printIdentifier = (node, path) => {
	node[EXPRESSION_NEEDED] = false

	const parts = [node.name]

	wrapExpressionIfNeeded(path, parts, node)

	const result = parts

	return parts.length === 1 ? result : group(result)
}
