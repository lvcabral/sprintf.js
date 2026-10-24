# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`@lvcabral/sprintf` is a fork of [alexei/sprintf.js](https://github.com/alexei/sprintf.js), published to npm. The fork adds 64-bit hex formatting, `*` width/precision, default float precision (6) for `e`/`f`/`g`, `%g` behavior closer to C, the space and `#` flags, flags in any order (parsed once per format by `parse_flags`), the `a A E F G` conversions, and C-style `nan`/`inf`/`-0` output for the float conversions. Its main consumer is [brs-engine](https://github.com/lvcabral/brs-engine), which needs output that matches C's `printf` on a Roku device. Where C libraries differ (such as `%a` for subnormals), the library follows glibc. Keep those behaviors in mind when changing formatting logic.

## Commands

- `npm install`: install dev dependencies
- `npm test`: runs `npm run lint` first (the `pretest` hook), then `mocha test/*.js`
- `npm run lint` / `npm run lint:fix`: ESLint 10 over the repo, configured in `eslint.config.js` (flat config; `dist/` and `node_modules/` are ignored)
- Single test file: `npx mocha test/test_validation.js`
- Single test case: `npx mocha test/*.js -g "<part of the it() description>"`
- Build the minified bundle: `npm run build` (runs `npm test`, then `gulp dist`, which uglifies `src/*.js` into `dist/sprintf.min.js` + source map with a version banner taken from `package.json`)
- Benchmarks: `npm run benchmark` (runs `benchmark/benchmark.js` with Benchmark.js)
- Publish: `npm publish` (the `prepublishOnly` hook runs the build first)

The dev toolchain (ESLint 10, Mocha 12, Gulp 5) needs Node 20.19+. The Gulp build only minifies; Gulp 5 writes the source map itself through the `sourcemaps` options of `gulp.src`/`gulp.dest`.

## Architecture

All library code lives in one file, `src/sprintf.js`, an IIFE that exports `sprintf` and `vsprintf` to CommonJS `exports`, `window`, and AMD `define`.

- `sprintf_parse(fmt)` tokenizes a format string into a parse tree: literal strings plus placeholder objects (`param_no`, `keys`, `sign`, `pad_char`, `align`, `width`, `precision`, `type`) built from the `re.placeholder` regex. Results are memoized in `sprintf_cache`, keyed by the format string.
- `sprintf_format(parse_tree, argv)` walks the tree, resolves each argument (named keys with `.`/`[n]` access, explicit `n$` positions, `*` width/precision consumed from `argv`, or implicit cursor order), calls function arguments to compute values, converts by type in a `switch`, then applies sign and padding.
- `format_float` writes `e`/`f`/`g` exactly like C. `toFixed`/`toExponential` are used when they are exact; exact ties (`is_tie`), which JavaScript rounds up but C rounds to even, and `%f` of values from `1e21` take a slower `BigInt` path (`exact_decimal`, `round_half_even`). `hex_float` writes `a`/`A`.
- `vsprintf` just spreads an array into `sprintf`.
- Mixing named and positional placeholders throws (tracked through the `arg_names` bitmask).

Because parse trees are cached and shared, any code that writes to a placeholder object (as the `*` handling does with `ph.width`/`ph.precision`) persists across calls that use the same format string.

### Published artifact

`package.json` `main` points to `dist/sprintf.min.js`, not `src/`. Tests import `src/sprintf.js` directly, so changes in `src/` reach npm consumers only through the rebuilt `dist/`. `dist/` is checked into git. The `files` allowlist in `package.json` limits the npm package to the bundle and its source map (plus the README, LICENSE and package.json, which npm always includes); `src/` is not published.

`types` points to `../../@types/sprintf-js/index.d.ts`, so it resolves to the `@types/sprintf-js` package installed beside this one in the consumer's `node_modules`. This repo ships no type declarations of its own.

## Code style (enforced by ESLint)

- 4-space indent, `SwitchCase: 1`
- No semicolons
- `quote-props: as-needed`
- ES5-style code in `src/` (`var`, no arrow functions). `BigInt` is used only in the 64-bit hex path.
- Library errors use a `[sprintf]` message prefix: `SyntaxError` for parse errors, `TypeError` for non-numeric arguments to numeric specifiers.
