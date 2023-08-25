/**
 * These symbols are visible to outside users of
 * the package. For example, they might be useful
 * for plugins.
 */

/**
 * Set this to true on an AST node that might be the
 * parent of a StringLiteral node. The StringLiteral
 * will be enclosed in quotes when this attribute is
 * set to true on the parent.
 */
export const STRING_NEEDS_QUOTES = Symbol('STRING_NEEDS_QUOTES')

/**
 * Set to " or '
 * Allows a node type to determine the quote char string
 * literals must use.
 */
export const OVERRIDE_QUOTE_CHAR = Symbol('OVERRIDE_QUOTE_CHAR')

/**
 * This signals to child nodes that an expression environment
 * {{ ... }} has not yet been opened, so they might have
 * to open one. Example: An Element node, in its attributes
 * array, can directly contain a FilterExpression. Usually,
 * a FilterExpression does not open an {{...}} environment,
 * but here, it has to.
 */
export const EXPRESSION_NEEDED = Symbol('EXPRESSION_NEEDED')

/**
 * Signals to child nodes that they are part of a string,
 * which means that expressions have to be interpolated.
 * Example:
 * "Part #{ partNr } of #{ partCount }"
 */
export const INSIDE_OF_STRING = Symbol('INSIDE_OF_STRING')

/**
 * Signals to FilterStatement nodes that they are part of
 * a filter block
 */
export const FILTER_BLOCK = Symbol('FILTER_BLOCK')

/**
 * Signals to text nodes that they should preserve leading
 * whitespace (whitespace at the beginning)
 */
export const PRESERVE_LEADING_WHITESPACE = Symbol('PRESERVE_LEADING_WHITESPACE')

/**
 * Signals to text nodes that they should preserve trailing
 * whitespace (whitespace at the end)
 */
export const PRESERVE_TRAILING_WHITESPACE = Symbol(
	'PRESERVE_TRAILING_WHITESPACE'
)

/**
 * Signals to text statements that only newlines should be
 * preserved when hitting a whitespace-only node
 */
export const NEWLINES_ONLY = Symbol('NEWLINES_ONLY')

/**
 * This defaults to TRUE. Only if it is explicitly set to FALSE,
 * a logical expression will not create a wrapping group on the
 * top level
 */
export const GROUP_TOP_LEVEL_LOGICAL = Symbol('GROUP_TOP_LEVEL_LOGICAL')

/**
 * Used to mark the root of a logical expression. Can be important
 * for grouping and parenthesis placement.
 */
export const IS_ROOT_LOGICAL_EXPRESSION = Symbol('IS_ROOT_LOGICAL_EXPRESSION')
