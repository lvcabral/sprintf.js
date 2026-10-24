/* global describe, it */

'use strict'

var assert = require('assert'),
    sprintfjs = require('../src/sprintf.js'),
    sprintf = sprintfjs.sprintf

describe('sprintfjs', function() {
    var pi = 3.141592653589793

    it('should return formatted strings for simple placeholders', function() {
        assert.equal('%', sprintf('%%'))
        assert.equal('10', sprintf('%b', 2))
        assert.equal('A', sprintf('%c', 65))
        assert.equal('2', sprintf('%d', 2))
        assert.equal('2', sprintf('%i', 2))
        assert.equal('2', sprintf('%d', '2'))
        assert.equal('2', sprintf('%i', '2'))
        assert.equal('{"foo":"bar"}', sprintf('%j', {foo: 'bar'}))
        assert.equal('["foo","bar"]', sprintf('%j', ['foo', 'bar']))
        assert.equal('2.000000e+00', sprintf('%e', 2))
        assert.equal('2', sprintf('%u', 2))
        assert.equal('4294967294', sprintf('%u', -2))
        assert.equal('2.200000', sprintf('%f', 2.2))
        assert.equal('3.14159', sprintf('%g', pi))
        assert.equal('0', sprintf('%g', 0.0))
        assert.equal('10', sprintf('%o', 8))
        assert.equal('37777777770', sprintf('%o', -8))
        assert.equal('%s', sprintf('%s', '%s'))
        assert.equal('ff', sprintf('%x', 255))
        assert.equal('ffffff01', sprintf('%x', -255))
        assert.equal('FF', sprintf('%X', 255))
        assert.equal('FFFFFF01', sprintf('%X', -255))
        assert.equal('2308249009', sprintf('%X', 150460469257))
        assert.equal('Polly wants a cracker', sprintf('%2$s %3$s a %1$s', 'cracker', 'Polly', 'wants'))
        assert.equal('Hello world!', sprintf('Hello %(who)s!', {who: 'world'}))
        assert.equal('true', sprintf('%t', true))
        assert.equal('t', sprintf('%.1t', true))
        assert.equal('true', sprintf('%t', 'true'))
        assert.equal('true', sprintf('%t', 1))
        assert.equal('false', sprintf('%t', false))
        assert.equal('f', sprintf('%.1t', false))
        assert.equal('false', sprintf('%t', ''))
        assert.equal('false', sprintf('%t', 0))

        assert.equal('undefined', sprintf('%T', undefined))
        assert.equal('null', sprintf('%T', null))
        assert.equal('boolean', sprintf('%T', true))
        assert.equal('number', sprintf('%T', 42))
        assert.equal('string', sprintf('%T', 'This is a string'))
        assert.equal('function', sprintf('%T', Math.log))
        assert.equal('array', sprintf('%T', [1, 2, 3]))
        assert.equal('object', sprintf('%T', {foo: 'bar'}))
        assert.equal('regexp', sprintf('%T', /<('[^']*'|'[^']*'|[^''>])*>/))

        assert.equal('true', sprintf('%v', true))
        assert.equal('42', sprintf('%v', 42))
        assert.equal('This is a string', sprintf('%v', 'This is a string'))
        assert.equal('1,2,3', sprintf('%v', [1, 2, 3]))
        assert.equal('[object Object]', sprintf('%v', {foo: 'bar'}))
        assert.equal('/<("[^"]*"|\'[^\']*\'|[^\'">])*>/', sprintf('%v', /<("[^"]*"|'[^']*'|[^'">])*>/))
    })

    it('should return formatted strings for complex placeholders', function() {
        // sign
        assert.equal('2', sprintf('%d', 2))
        assert.equal('-2', sprintf('%d', -2))
        assert.equal('+2', sprintf('%+d', 2))
        assert.equal('-2', sprintf('%+d', -2))
        assert.equal('2', sprintf('%i', 2))
        assert.equal('-2', sprintf('%i', -2))
        assert.equal('+2', sprintf('%+i', 2))
        assert.equal('-2', sprintf('%+i', -2))
        assert.equal('2.200000', sprintf('%f', 2.2))
        assert.equal('-2.200000', sprintf('%f', -2.2))
        assert.equal('+2.200000', sprintf('%+f', 2.2))
        assert.equal('-2.200000', sprintf('%+f', -2.2))
        assert.equal('-2.3', sprintf('%+.1f', -2.34))
        assert.equal('-0.0', sprintf('%+.1f', -0.01))
        assert.equal('3.14159', sprintf('%.6g', pi))
        assert.equal('3.14', sprintf('%.3g', pi))
        assert.equal('3', sprintf('%.1g', pi))
        assert.equal('-000000123', sprintf('%+010d', -123))
        assert.equal('______-123', sprintf("%+'_10d", -123))
        assert.equal('-234.340000 123.200000', sprintf('%f %f', -234.34, 123.2))

        // padding
        assert.equal('-0002', sprintf('%05d', -2))
        assert.equal('-0002', sprintf('%05i', -2))
        assert.equal('    <', sprintf('%5s', '<'))
        assert.equal('0000<', sprintf('%05s', '<'))
        assert.equal('____<', sprintf("%'_5s", '<'))
        assert.equal('>    ', sprintf('%-5s', '>'))
        assert.equal('>0000', sprintf('%0-5s', '>'))
        assert.equal('>____', sprintf("%'_-5s", '>'))
        assert.equal('xxxxxx', sprintf('%5s', 'xxxxxx'))
        assert.equal('    <', sprintf('%*s', 5, '<'))
        assert.equal('>    ', sprintf('%-*s',5, '>'))
        assert.equal('1234', sprintf('%02u', 1234))
        assert.equal(' -10.235', sprintf('%8.3f', -10.23456))
        assert.equal('-12.340000 xxx', sprintf('%f %s', -12.34, 'xxx'))
        assert.equal('{\n  "foo": "bar"\n}', sprintf('%2j', {foo: 'bar'}))
        assert.equal('[\n  "foo",\n  "bar"\n]', sprintf('%2j', ['foo', 'bar']))

        // precision
        assert.equal('2.3', sprintf('%.1f', 2.345))
        assert.equal('3.1416', sprintf('%.*f', 4, pi))
        assert.equal('xxxxx', sprintf('%5.5s', 'xxxxxx'))
        assert.equal('    x', sprintf('%5.1s', 'xxxxxx'))

    })

    it('should format NaN, infinity and -0 like C printf', function() {
        // NaN and infinity: lowercase, sign from the sign bit, precision and 0 flag ignored
        assert.equal('nan', sprintf('%f', NaN))
        assert.equal('nan', sprintf('%e', NaN))
        assert.equal('nan', sprintf('%g', NaN))
        assert.equal('-nan', sprintf('%g', -NaN))
        assert.equal('+nan', sprintf('%+f', NaN))
        assert.equal('  nan', sprintf('%5.2f', NaN))
        assert.equal('  nan', sprintf('%05.2f', NaN))
        assert.equal('-nan  ', sprintf('%-6f', -NaN))
        assert.equal('inf', sprintf('%e', Infinity))
        assert.equal('-inf', sprintf('%f', -Infinity))
        assert.equal('+inf', sprintf('%+f', Infinity))
        assert.equal('    -inf', sprintf('%08.3e', -Infinity))

        // -0 keeps its sign, with 0 padding after it
        assert.equal('-0.000000', sprintf('%f', -0))
        assert.equal('-0.000000e+00', sprintf('%e', -0))
        assert.equal('-0', sprintf('%g', -0))
        assert.equal('-0.00', sprintf('%5.2f', -0))
        assert.equal('-00.00', sprintf('%06.2f', -0))
        assert.equal('-0.0', sprintf('%+.1f', -0))
        assert.equal('+0.0', sprintf('%+.1f', 0))
        assert.equal('-0.000000', sprintf('%f', '-0'))
        assert.equal('0', sprintf('%d', -0))
        assert.equal('NAN', sprintf('%F', NaN))
        assert.equal('-INF', sprintf('%E', -Infinity))
        assert.equal('-nan', sprintf('%a', -NaN))
        assert.equal(' inf', sprintf('% g', Infinity))
        assert.equal('-0x0p+0', sprintf('%a', -0))
    })

    it('should return formatted strings for the space flag', function() {
        assert.equal(' 5', sprintf('% d', 5))
        assert.equal('-5', sprintf('% d', -5))
        assert.equal(' 0005', sprintf('% 05d', 5))
        assert.equal(' 2.500000', sprintf('% f', 2.5))
        assert.equal(' 0x1p+1', sprintf('% a', 2))
        assert.equal('5', sprintf('% u', 5))
        assert.equal('ff', sprintf('% x', 255))
        assert.equal('a', sprintf('% s', 'a'))
    })

    it('should return formatted strings for uppercase float conversions', function() {
        assert.equal('2.500000E+00', sprintf('%E', 2.5))
        assert.equal('-1.23E-04', sprintf('%.2E', -0.000123))
        assert.equal('2.500000', sprintf('%F', 2.5))
        assert.equal('3.14159', sprintf('%G', pi))
        assert.equal('1E-05', sprintf('%G', 0.00001))
    })

    it('should return formatted strings for hexadecimal floats', function() {
        assert.equal('0x0p+0', sprintf('%a', 0))
        assert.equal('0x1p+0', sprintf('%a', 1))
        assert.equal('-0x1p+0', sprintf('%a', -1))
        assert.equal('0x1p-1', sprintf('%a', 0.5))
        assert.equal('0x1.ffp+7', sprintf('%a', 255.5))
        assert.equal('0x1.921fb54442d18p+1', sprintf('%a', pi))
        assert.equal('0x1.999999999999ap-4', sprintf('%a', 0.1))
        assert.equal('0x1.fffffffffffffp+1023', sprintf('%a', Number.MAX_VALUE))
        assert.equal('0X1.FFP+7', sprintf('%A', 255.5))

        // precision rounds half to even, without renormalizing a carry into the leading digit
        assert.equal('0x1.000p+0', sprintf('%.3a', 1))
        assert.equal('0x1.92p+1', sprintf('%.2a', pi))
        assert.equal('0x2.0p+0', sprintf('%.1a', 1.99))
        assert.equal('0x2p+0', sprintf('%.0a', 1.5))
        assert.equal('0x1p+1', sprintf('%.0a', 2.5))
        assert.equal('0x1.921fb54442d1800p+1', sprintf('%.15a', pi))

        // subnormals keep a leading 0, as in glibc
        assert.equal('0x0.0000000000001p-1022', sprintf('%a', Number.MIN_VALUE))

        // flags, width and 0 padding after the prefix
        assert.equal('+0x1p+0', sprintf('%+a', 1))
        assert.equal('0x0001p+0', sprintf('%09a', 1))
        assert.equal('-0x001p+0', sprintf('%09a', -1))
        assert.equal('   0x1p+0', sprintf('%9a', 1))
        assert.equal('0x1p+0   ', sprintf('%-9a', 1))
    })

    it('should return formatted strings for callbacks', function() {
        assert.equal('foobar', sprintf('%s', function() { return 'foobar' }))
    })
})
