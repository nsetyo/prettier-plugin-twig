import prettier from 'prettier'

import Utils from '../util'
const { group, line, hardline } = prettier.doc.builders
const { FILTER_BLOCK, printChildBlock } = Utils

const printOpeningGroup = (node, path, print) => {
	const parts: any[] = [node.trimLeft ? '{%- ' : '{% ']
	const printedExpression = path.call(print, 'filterExpression')
	parts.push(printedExpression, line, node.trimRightFilter ? '-%}' : '%}')
	return group(parts)
}

export const printFilterBlockStatement = (node, path, print) => {
	node[FILTER_BLOCK] = true
	const openingGroup = printOpeningGroup(node, path, print)
	const body = printChildBlock(node, path, print, 'body')
	const closingStatement = [
		hardline,
		node.trimLeftEndfilter ? '{%-' : '{%',
		' endfilter ',
		node.trimRight ? '-%}' : '%}',
	]

	return [openingGroup, body, closingStatement]
}
