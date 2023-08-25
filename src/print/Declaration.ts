import prettier from 'prettier'

import Utils from '../util'
const { fill, join } = prettier.doc.builders
const { STRING_NEEDS_QUOTES, OVERRIDE_QUOTE_CHAR } = Utils

export const printDeclaration = (node, path, print) => {
	node[STRING_NEEDS_QUOTES] = true
	node[OVERRIDE_QUOTE_CHAR] = '"'
	const start = '<!' + (node.declarationType || '').toUpperCase()
	const printedParts = path.map(print, 'parts')

	return fill([start, ' ', join(' ', printedParts), '>'])
}
