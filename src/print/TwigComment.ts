import Utils from '../util'

const { stripTwigCommentChars, normalizeTwigComment, countNewlines } = Utils

export const printTwigComment = (node) => {
	const originalText = node.value.value || ''
	const commentText = stripTwigCommentChars(originalText)
	const trimLeft = originalText.length >= 3 ? originalText[2] === '-' : false
	const trimRight =
		originalText.length >= 3 ? originalText.slice(-3, -2) === '-' : false

	const numNewlines = countNewlines(commentText)
	if (numNewlines === 0) {
		return normalizeTwigComment(commentText, trimLeft, trimRight)
	}

	return [trimLeft ? '{#-' : '{#', commentText, trimRight ? '-#}' : '#}']
}
