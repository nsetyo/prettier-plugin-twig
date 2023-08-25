import Utils from '../util'

const { stripHtmlCommentChars, normalizeHtmlComment, countNewlines } = Utils

export const printHtmlComment = (node, path, print) => {
	const commentText = stripHtmlCommentChars(node.value.value || '')

	const numNewlines = countNewlines(commentText)
	if (numNewlines === 0) {
		return normalizeHtmlComment(commentText)
	}

	return ['<!-- ', commentText, ' -->']
}
