import { Node } from 'melody-types'
import prettier from 'prettier'

import Utils from '../util'
const { hardline } = prettier.doc.builders

const {
	STRING_NEEDS_QUOTES,
	indentWithHardline,
	printSingleTwigTag,
	isEmptySequence,
} = Utils

export const printGenericTwigTag = (node, path, print) => {
	node[STRING_NEEDS_QUOTES] = true
	const openingTag = printSingleTwigTag(node, path, print)
	const parts: any[] = [openingTag]
	const printedSections = path.map(print, 'sections')
	node.sections.forEach((section, i) => {
		if (Node.isGenericTwigTag(section)) {
			parts.push([hardline, printedSections[i]])
		} else {
			if (!isEmptySequence(section)) {
				// Indent
				parts.push(indentWithHardline(printedSections[i]))
			}
		}
	})
	return parts
}
