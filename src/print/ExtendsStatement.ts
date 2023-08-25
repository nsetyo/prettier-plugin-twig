import Utils from '../util'

const { STRING_NEEDS_QUOTES } = Utils

export const printExtendsStatement = (node, path, print) => {
	node[STRING_NEEDS_QUOTES] = true
	return [
		node.trimLeft ? '{%-' : '{%',
		' extends ',
		path.call(print, 'parentName'),
		node.trimRight ? ' -%}' : ' %}',
	]
}
