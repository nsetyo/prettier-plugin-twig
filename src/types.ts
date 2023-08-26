export type Extension = {
	tags: any[]
	unaryOperators: any[]
	binaryOperators: any[]
	tests: any[]
	visitors: []
	filterMap: any
	functionMap: any
}

export type Position = { line: number; column: number; index: number }

export type Token = {
	end: number
	length: number
	pos: Position
	source: string | null
	text: string
	type: any
	toString: () => string
	endPos?: Position
}
