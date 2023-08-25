import { Printer } from 'prettier'

import { ORIGINAL_SOURCE } from './parser'
import { printAliasExpression } from './print/AliasExpression'
import { printArrayExpression } from './print/ArrayExpression'
import { printAttribute } from './print/Attribute'
import { printAutoescapeBlock } from './print/AutoescapeBlock'
import { printBinaryExpression } from './print/BinaryExpression'
import { printBlockStatement } from './print/BlockStatement'
import { printCallExpression } from './print/CallExpression'
import { printConditionalExpression } from './print/ConditionalExpression'
import { printDeclaration } from './print/Declaration'
import { printDoStatement } from './print/DoStatement'
import { printElement } from './print/Element'
import { printEmbedStatement } from './print/EmbedStatement'
import { printExpressionStatement } from './print/ExpressionStatement'
import { printExtendsStatement } from './print/ExtendsStatement'
import { printFilterBlockStatement } from './print/FilterBlockStatement'
import { printFilterExpression } from './print/FilterExpression'
import { printFlushStatement } from './print/FlushStatement'
import { printForStatement } from './print/ForStatement'
import { printFromStatement } from './print/FromStatement'
import { printGenericToken } from './print/GenericToken'
import { printGenericTwigTag } from './print/GenericTwigTag'
import { printHtmlComment } from './print/HtmlComment'
import { printIdentifier } from './print/Identifier'
import { printIfStatement } from './print/IfStatement'
import { printImportDeclaration } from './print/ImportDeclaration'
import { printIncludeStatement } from './print/IncludeStatement'
import { printMacroDeclarationStatement } from './print/MacroDeclarationStatement'
import { printMemberExpression } from './print/MemberExpression'
import { printMountStatement } from './print/MountStatement'
import { printNamedArgumentExpression } from './print/NamedArgumentExpression'
import { printObjectExpression } from './print/ObjectExpression'
import { printObjectProperty } from './print/ObjectProperty'
import { printSequenceExpression } from './print/SequenceExpression'
import { printSetStatement } from './print/SetStatement'
import { printSliceExpression } from './print/SliceExpression'
import { printSpacelessBlock } from './print/SpacelessBlock'
import { printStringLiteral } from './print/StringLiteral'
import { printTestExpression } from './print/TestExpression'
import { printTextStatement } from './print/TextStatement'
import { printTwigComment } from './print/TwigComment'
import { printUnaryExpression } from './print/UnaryExpression'
import { printUnarySubclass } from './print/UnarySubclass'
import { printUseStatement } from './print/UseStatement'
import { printVariableDeclarationStatement } from './print/VariableDeclarationStatement'
import Utils from './util'

const { isWhitespaceNode, isHtmlCommentEqualTo, isTwigCommentEqualTo } = Utils

const print_functions = {}

const isHtmlIgnoreNextComment = isHtmlCommentEqualTo('prettier-ignore')
const isHtmlIgnoreStartComment = isHtmlCommentEqualTo('prettier-ignore-start')
const isHtmlIgnoreEndComment = isHtmlCommentEqualTo('prettier-ignore-end')
const isTwigIgnoreNextComment = isTwigCommentEqualTo('prettier-ignore')
const isTwigIgnoreStartComment = isTwigCommentEqualTo('prettier-ignore-start')
const isTwigIgnoreEndComment = isTwigCommentEqualTo('prettier-ignore-end')

const isIgnoreNextComment = (s) =>
	isHtmlIgnoreNextComment(s) || isTwigIgnoreNextComment(s)
const isIgnoreRegionStartComment = (s) =>
	isHtmlIgnoreStartComment(s) || isTwigIgnoreStartComment(s)
const isIgnoreRegionEndComment = (s) =>
	isHtmlIgnoreEndComment(s) || isTwigIgnoreEndComment(s)

let originalSource = ''
let ignoreRegion = false
let ignoreNext = false

const checkForIgnoreStart = (node) => {
	// Keep current "ignoreNext" value if it's true,
	// but is not applied in this step yet
	ignoreNext =
		(ignoreNext && !shouldApplyIgnoreNext(node)) ||
		isIgnoreNextComment(node)
	ignoreRegion = ignoreRegion || isIgnoreRegionStartComment(node)
}

const checkForIgnoreEnd = (node) => {
	if (ignoreRegion && isIgnoreRegionEndComment(node)) {
		ignoreRegion = false
	}
}

const shouldApplyIgnoreNext = (node) => !isWhitespaceNode(node)

export const print: Printer<any>['print'] = (path, options, print) => {
	const node = path.getValue()
	const nodeType = node.constructor.name

	// Try to get the entire original source from AST root
	if (node[ORIGINAL_SOURCE]) {
		originalSource = node[ORIGINAL_SOURCE]
	}

	checkForIgnoreEnd(node)

	const useOriginalSource =
		(shouldApplyIgnoreNext(node) && ignoreNext) || ignoreRegion

	const hasPrintFunction = print_functions[nodeType]

	// Happy path: We have a formatting function, and the user wants the
	// node formatted
	if (!useOriginalSource && hasPrintFunction) {
		checkForIgnoreStart(node)

		return print_functions[nodeType](node, path, print, options)
	} else if (!hasPrintFunction) {
		console.warn(`No print function available for node type "${nodeType}"`)
	}

	checkForIgnoreStart(node)

	// Fallback: Use the node's loc property with the
	// originalSource property on the AST root
	if (canGetSubstringForNode(node)) {
		return getSubstringForNode(node)
	}

	return ''
}

const getSubstringForNode = (node) =>
	originalSource.substring(node.loc.start.index, node.loc.end.index)

const canGetSubstringForNode = (node) =>
	originalSource &&
	node.loc &&
	node.loc.start &&
	node.loc.end &&
	node.loc.start.index &&
	node.loc.end.index
/**
 * Prettier printing works with a so-called FastPath object, which is
 * passed into many of the following methods through a "path" argument.
 * This is basically a stack, and the way to do do recursion in Prettier
 * is through this path object.
 *
 * For example, you might expect to write something like this:
 *
 * BinaryExpression.prototype.prettyPrint = _ => {
 *     return concat([
 *         this.left.prettyPrint(),
 *         " ",
 *         this.operator,
 *         " ",
 *         this.right.prettyPrint()
 *     ]);
 * };
 *
 * Here, the prettyPrint() method of BinaryExpression calls the prettyPrint()
 * methods of the left and right operands. However, it actually has to be
 * done like this in Prettier plugins:
 *
 * BinaryExpression.prototype.prettyPrint = (path, print) => {
 *     const docs = [
 *         path.call(print, "left"),
 *         " ",
 *         this.operator,
 *         " ",
 *         path.call(print, "right")
 *     ];
 *     return concat(docs);
 * };
 *
 * The first argument to path.call() seems to always be the print function
 * that is passed in (a case of bad interface design and over-complication?),
 * at least I have not found any other instance. The arguments after that are
 * field names that are pulled from the node and put on the stack for the
 * next processing step(s) => this is how recursion is done.
 *
 */
// Return value has to be a string
const returnNodeValue = (node) => '' + node.value

print_functions['AliasExpression'] = printAliasExpression
print_functions['ArrayExpression'] = printArrayExpression
print_functions['Attribute'] = printAttribute
print_functions['AutoescapeBlock'] = printAutoescapeBlock
print_functions['BinaryConcatExpression'] = printBinaryExpression
print_functions['BinaryExpression'] = printBinaryExpression
print_functions['BinarySubclass'] = printBinaryExpression
print_functions['BlockStatement'] = printBlockStatement
print_functions['BooleanLiteral'] = returnNodeValue
print_functions['CallExpression'] = printCallExpression
print_functions['ConditionalExpression'] = printConditionalExpression
print_functions['ConstantValue'] = (node) => node.value
print_functions['Declaration'] = printDeclaration
print_functions['DoStatement'] = printDoStatement
print_functions['Element'] = printElement
print_functions['EmbedStatement'] = printEmbedStatement
print_functions['ExtendsStatement'] = printExtendsStatement
print_functions['FilterBlockStatement'] = printFilterBlockStatement
print_functions['FilterExpression'] = printFilterExpression
print_functions['FlushStatement'] = printFlushStatement
print_functions['ForStatement'] = printForStatement
print_functions['Fragment'] = (node, path, print) => path.call(print, 'value')
print_functions['FromStatement'] = printFromStatement
print_functions['GenericToken'] = printGenericToken
print_functions['GenericTwigTag'] = (node, path, print, options) => {
	const tagName = node.tagName

	if (print_functions[tagName + 'Tag']) {
		// Give the user the chance to implement a custom
		// print function for certain generic Twig tags
		return print_functions[tagName + 'Tag'](node, path, print, options)
	}
	return printGenericTwigTag(node, path, print)
}
print_functions['HtmlComment'] = printHtmlComment
print_functions['Identifier'] = printIdentifier
print_functions['IfStatement'] = printIfStatement
print_functions['ImportDeclaration'] = printImportDeclaration
print_functions['IncludeStatement'] = printIncludeStatement
print_functions['MacroDeclarationStatement'] = printMacroDeclarationStatement
print_functions['MemberExpression'] = printMemberExpression
print_functions['MountStatement'] = printMountStatement
print_functions['NamedArgumentExpression'] = printNamedArgumentExpression
print_functions['NullLiteral'] = () => 'null'
print_functions['NumericLiteral'] = returnNodeValue
print_functions['ObjectExpression'] = printObjectExpression
print_functions['ObjectProperty'] = printObjectProperty
print_functions['PrintExpressionStatement'] = printExpressionStatement
print_functions['PrintTextStatement'] = printTextStatement
print_functions['SequenceExpression'] = printSequenceExpression
print_functions['SetStatement'] = printSetStatement
print_functions['SliceExpression'] = printSliceExpression
print_functions['SpacelessBlock'] = printSpacelessBlock
print_functions['StringLiteral'] = printStringLiteral
print_functions['TestExpression'] = printTestExpression
print_functions['TwigComment'] = printTwigComment
print_functions['UnaryExpression'] = printUnaryExpression
print_functions['UnarySubclass'] = printUnarySubclass
print_functions['UseStatement'] = printUseStatement
print_functions['VariableDeclarationStatement'] =
	printVariableDeclarationStatement

// Fallbacks
print_functions['String'] = (s) => s
