/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	testEnvironment: 'node',
	preset: 'ts-jest',
	moduleNameMapper: {},
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	transform: {},
}
