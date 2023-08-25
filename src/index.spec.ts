import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import * as prettier from 'prettier'

import * as TwigPlugin from './'

const INPUT = 'input.html.twig'
const EXPECTED = 'expected.html.twig'

const prettify = (code: string) =>
	prettier.format(code, {
		tabWidth: 4,
		parser: 'twig' as any,
		plugins: [TwigPlugin],
	})

describe('format', () => {
	const test_dir = join(__dirname, '../tests')
	const tests = readdirSync(test_dir)

	tests.forEach((test) =>
		it(test, async () => {
			const path = join(test_dir, test)
			const expected = readFileSync(join(path, EXPECTED)).toString()
			const input = readFileSync(join(path, INPUT)).toString()

			const expected_error = expected.match(/Error\("(?<message>.*)"\)/)
				?.groups?.message

			const format = () => prettify(input)

			if (expected_error) {
				jest.spyOn(console, 'error').mockImplementation(() => {})

				await expect(format()).rejects.toEqual(
					new Error(expected_error)
				)
			} else {
				const result = await prettify(input)

				await expect(result).toEqual(expected)
				// Check that a second prettifying is not changing the result again.
				await expect(await prettify(result)).toEqual(expected)
			}
		})
	)
})
