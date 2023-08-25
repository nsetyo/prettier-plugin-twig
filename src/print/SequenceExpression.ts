import { Node } from 'melody-types'
import prettier, { AstPath } from 'prettier'

import Utils from '../util'
import {
	isRootNode,
	printChildGroups,
	removeSurroundingWhitespace,
} from '../util/PublicFunctions'

const { hardline } = prettier.doc.builders
const { STRING_NEEDS_QUOTES } = Utils

export const printSequenceExpression = (node: Node, path: AstPath, print) => {
	node[STRING_NEEDS_QUOTES] = false

	node.expressions = removeSurroundingWhitespace(node.expressions)

	const items = printChildGroups(node, path, print, 'expressions')

	if (isRootNode(path)) {
		return [...items, hardline]
	}

	return items
}
