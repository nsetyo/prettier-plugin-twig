import { existsSync, readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import * as prettier from 'prettier'

import * as TwigPlugin from './'

const INPUT = 'input.html.twig'
const EXPECTED = 'expected.html.twig'
const CONFIG = 'config.json'

const prettify = (code: string, options?: prettier.Options) => {
	return prettier.format(code, {
		tabWidth: 4,
		parser: 'twig' as any,
		plugins: [TwigPlugin],
		...options,
	})
}

describe('format', () => {
	const test_dir = join(__dirname, '../tests')
	const tests = readdirSync(test_dir)

	tests
		.filter((t) => t === '2-prettier-quote-props')
		.forEach((test) =>
			it(test, async () => {
				const path = join(test_dir, test)
				const expected = readFileSync(join(path, EXPECTED)).toString()
				const input = readFileSync(join(path, INPUT)).toString()

				const configPath = join(path, CONFIG)

				const configString =
					existsSync(configPath) &&
					readFileSync(configPath)?.toString()

				const config = JSON.parse(configString || '{}')

				const expected_error = expected.match(
					/Error\("(?<message>.*)"\)/
				)?.groups?.message

				const format = () => prettify(input, config)

				if (expected_error) {
					jest.spyOn(console, 'error').mockImplementation(() => {})

					await expect(format()).rejects.toEqual(
						new Error(expected_error)
					)
				} else {
					const result = await prettify(input, config)

					await expect(result).toEqual(expected)

					// Check that a second prettifying is not changing the result again.
					// const second_result = await prettify(result, config)

					// await expect(second_result).toEqual(expected)
				}
			})
		)
})
