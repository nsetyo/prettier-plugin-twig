import * as n from 'melody-types'
import prettier, { AstPath, Doc } from 'prettier'

import Utils from '../util'
import { isValidIdentifierName } from '../util/PublicFunctions'
import { STRING_NEEDS_QUOTES } from '../util/PublicSymbols'

const { group, line, indent, join } = prettier.doc.builders

const { EXPRESSION_NEEDED, wrapExpressionIfNeeded } = Utils

export const printObjectExpression = (
	node: n.Node,
	path: AstPath,
	print,
	options: prettier.Options
) => {
	if (node.properties.length === 0) {
		return '{}'
	}

	node[EXPRESSION_NEEDED] = false

	const contains_invalid_Key = node.properties.some((prop) => {
		const value = n.Node.isStringLiteral(prop.key)
			? prop.key.value
			: prop.key.name

		return !isValidIdentifierName(value)
	})

	if (options.quoteProps === 'consistent' && contains_invalid_Key) {
		node.properties = node.properties.map((p) => {
			if (p.key.node_type === 'Identifier') {
				p.key = Object.assign(new n.StringLiteral(p.key.name), {
					loc: p.key.loc,
					node_type: 'StringLiteral',
				})
			}
			p[STRING_NEEDS_QUOTES] = true

			return p
		})
	}

	const mappedElements = path.map(print, 'properties') as Doc[]

	const indentedContent = [line, join([',', line], mappedElements)]

	const parts = ['{', indent(indentedContent), line, '}']

	wrapExpressionIfNeeded(path, parts, node)

	return group(parts)
}
