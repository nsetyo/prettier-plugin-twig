import prettier from 'prettier'

import Utils from '../util'
const { hardline } = prettier.doc.builders
const { printChildBlock, quoteChar } = Utils

const createOpener = (node, options) => {
	return [
		node.trimLeft ? '{%-' : '{%',
		' autoescape ',
		quoteChar(options),
		node.escapeType || 'html',
		quoteChar(options),
		' ',
		node.trimRightAutoescape ? '-%}' : '%}',
	]
}

export const printAutoescapeBlock = (node, path, print, options) => {
	const parts: any[] = [createOpener(node, options)]
	parts.push(printChildBlock(node, path, print, 'expressions'))
	parts.push(
		hardline,
		node.trimLeftEndautoescape ? '{%-' : '{%',
		' endautoescape ',
		node.trimRight ? '-%}' : '%}'
	)

	return parts
}
