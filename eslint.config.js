'use strict'

var js = require('@eslint/js'),
    globals = require('globals')

module.exports = [
    {
        ignores: ['dist/', 'node_modules/']
    },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: 'commonjs',
            globals: globals.node
        },
        rules: {
            indent: ['error', 4, {SwitchCase: 1}],
            'quote-props': ['error', 'as-needed'],
            'no-cond-assign': 0,
            'no-console': 0,
            'no-control-regex': 0,
            'no-undef': 'error',
            'no-unused-vars': 'error',
            semi: ['error', 'never']
        }
    }
]
