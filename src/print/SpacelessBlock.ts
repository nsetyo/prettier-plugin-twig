import prettier from 'prettier'

import Utils from '../util'
const { hardline, group } = prettier.doc.builders
const { printChildBlock } = Utils

export const printSpacelessBlock = (node, path, print) => {
	const parts: any[] = [
		node.trimLeft ? '{%-' : '{%',
		' spaceless ',
		node.trimRightSpaceless ? '-%}' : '%}',
	]
	parts.push(printChildBlock(node, path, print, 'body'))
	parts.push(hardline)
	parts.push(
		node.trimLeftEndspaceless ? '{%-' : '{%',
		' endspaceless ',
		node.trimRight ? '-%}' : '%}'
	)
	const result = group(parts)
	return result
}
