## Unreleased

* Round exact halfway values to even in `e E f F g G`, like C (`%.0f` of `2.5` is `2`)
* `%g` and `%G` with a precision switch to exponent form by C's rule (`%.3g` of `123456.789` is `1.23e+05`)
* `%f` and `%F` write values of `1e21` and up in full instead of in exponent form
* A precision of `0` given through `*` is no longer treated as the default precision in `e E f F g G`

## 1.3.0

* Format `NaN`, infinity and `-0` like C's `printf` in the float conversions: `nan`, `-nan` (sign bit set), `inf`, `-inf` and `-0.000000`
* Add the space flag and the `#` flag (alternate form)
* Accept flags in any order; as in C, `-` overrides `0` (`%0-5s` now pads with spaces)
* Add the `a`, `A`, `E`, `F` and `G` conversions
* Publish only `dist/sprintf.min.js` and its source map
* Upgrade the dev toolchain to ESLint 10, Mocha 12 and Gulp 5; requires Node 20.19+ for development
* Replace Travis with GitHub Actions

## 1.2.2 (2025-03-11)

* Fix the `types` path to `@types/sprintf-js`

## 1.2.1 (2025-03-11)

* Add a `types` reference to `@types/sprintf-js`

## 1.2.0 (2025-03-11)

* First release of the fork as `@lvcabral/sprintf`; `main` is now `dist/sprintf.min.js`
* Support 64-bit integers in `%x` and `%X`
* Support `*` (asterisk) width and precision
* Use a default precision of 6 for `%e` and `%f`
* Improve `%g` to be closer to C, including the formatting of zero
* Remove the AngularJS filter and `bower.json`

## 1.1.3

* fix LICENSE name

## 1.1.2

* Update Travis config to test on all LTE Node versions (i.e. 6+)
* Reorganize README; add instructions re polyfills
* Refactor the code
* Upgrade dependencies
* Fix minifying issue with missing semicolons
* Configure .npmignore to reduce package size


## 1.1.1 (2017-05-29)

* This CHANGELOG
* Various optimizations for modern browsers
* Fix %g, %o, %x and %X specifiers
* Use ESLint instead of JSHint
* Add CONTRIBUTORS file
