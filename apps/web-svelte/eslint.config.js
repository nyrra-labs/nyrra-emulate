import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default defineConfig(
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		},
		rules: {
			'svelte/no-navigation-without-resolve': 'off'
		}
	},
	{
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							regex: '^(?:\\.\\./)+(?:apps/web|web)/|^apps/web/',
							message:
								'Direct imports from apps/web are not allowed. Use packages/docs-upstream instead.'
						}
					]
				}
			]
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/', '.wrangler/']
	}
);
