import prettier from 'prettier'

import Utils from '../util'

const { group, softline, line, indent, join } = prettier.doc.builders
const { STRING_NEEDS_QUOTES } = Utils

export const printArrayExpression = (node, path, print) => {
	node[STRING_NEEDS_QUOTES] = true
	const mappedElements = path.map(print, 'elements')
	const indentedContent = [softline, join([',', line], mappedElements)]

	return group(['[', indent(indentedContent), softline, ']'])
}
