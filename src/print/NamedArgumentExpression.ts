import Utils from '../util'
const { STRING_NEEDS_QUOTES } = Utils

export const printNamedArgumentExpression = (node, path, print) => {
	node[STRING_NEEDS_QUOTES] = true

	const printedName = path.call(print, 'name')
	const printedValue = path.call(print, 'value')

	return [printedName, ' = ', printedValue]
}
