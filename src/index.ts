import { Parser, Printer, SupportLanguage, SupportOptions } from 'prettier'

import { hasPragma, locEnd, locStart, parse } from './parser'
import { print } from './printer'

export const languages: SupportLanguage[] = [
	{
		name: 'twig',
		parsers: ['twig'],
		group: 'Twig',
		tmScope: 'html.twig',
		aceMode: 'html',
		extensions: ['.html.twig', '.twig'],
		vscodeLanguageIds: ['twig'],
	},
]

export const parsers: { [parserName: string]: Parser<any> } = {
	twig: {
		astFormat: 'twig',
		parse,
		hasPragma,
		locStart,
		locEnd,
	},
}

export const printers: { [astFormat: string]: Printer<any> } = {
	twig: { print },
}

export const options: SupportOptions = {}
