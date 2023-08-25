import prettier from 'prettier'

import Utils from '../util'
const { group, join, line, indent } = prettier.doc.builders
const { STRING_NEEDS_QUOTES } = Utils

const printImportDeclaration = (node) => {
	const parts = [node.key.name]
	if (node.key.name !== node.alias.name) {
		parts.push(' as ', node.alias.name)
	}
	return parts
}

export const printFromStatement = (node, path, print) => {
	node[STRING_NEEDS_QUOTES] = true
	// Unfortunately, ImportDeclaration has different
	// formatting needs here compared to when used
	// standalone. Therefore, we collect them manually.
	const mappedImports = node.imports.map(printImportDeclaration)
	const indentedParts = indent([line, join([',', line], mappedImports)])
	return group([
		node.trimLeft ? '{%-' : '{%',
		' from ',
		path.call(print, 'source'),
		' import',
		indentedParts,
		line,
		node.trimRight ? '-%}' : '%}',
	])
}
