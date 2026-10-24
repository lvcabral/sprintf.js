/* global window, define */

!function() {
    'use strict'

    var re = {
        not_string: /[^s]/,
        not_bool: /[^t]/,
        not_type: /[^T]/,
        not_primitive: /[^v]/,
        number: /[diaAeEfFgG]/,
        float: /[aAeEfFgG]/,
        hex_float: /[aA]/,
        exponent: /[eEgG]/,
        upper_float: /[AEFG]/,
        numeric_arg: /[bcdiaAeEfFgGuxX]/,
        json: /[j]/,
        not_json: /[^j]/,
        text: /^[^\x25]+/,
        modulo: /^\x25{2}/,
        placeholder: /^\x25(?:([1-9]\d*)\$|\(([^)]+)\))?((?:[-+ 0#]|'[^$])*)(\d+|\*)?(?:\.(\d+|\*))?([a-gijostuvxAEFGTX])/,
        key: /^([a-z_][a-z_\d]*)/i,
        key_access: /^\.([a-z_][a-z_\d]*)/i,
        index_access: /^\[(\d+)\]/,
        sign: /^[+-]/,
        trailing_period_zero: /\.0$/,
        trailing_zeroes: /(\.\d*?[1-9])0+$|\.0+$/,
        alt_prefix: /[bxX]/,
        leading_digits: /^(-?\d+)/,
        period_zero_exp: /\.0*e/,
        zero_before_exp: /(\..*[^0])0*e/,
        exp_pos_digits: /e\+(\d)$/,
        exp_neg_digits: /e-(\d)$/,
        exp_trailing: /e([+-])(\d)$/
    }

    function sprintf(key) {
        // `arguments` is not an array, but should be fine for this call
        return sprintf_format(sprintf_parse(key), arguments)
    }

    function vsprintf(fmt, argv) {
        return sprintf.apply(null, [fmt].concat(argv || []))
    }

    var float_view = new DataView(new ArrayBuffer(8))

    // true when the sign bit is set, which also tells -0 and -NaN apart
    function has_sign_bit(value) {
        float_view.setFloat64(0, value)
        return (float_view.getUint8(0) & 0x80) !== 0
    }

    // C's %a without the sign and 0x prefix: a hexadecimal significand and a binary exponent, like 1.8p+1.
    // As in glibc, subnormals keep a leading 0 and rounding up to 2 is not renormalized.
    function hex_float(value, precision) {
        var high, exponent, significand, scale, rounded, remainder, lead, digits
        float_view.setFloat64(0, value)
        high = float_view.getUint32(0)
        exponent = (high >>> 20) & 0x7ff
        significand = (high & 0xfffff) * 0x100000000 + float_view.getUint32(4) // 52 bits, exact in a double
        if (exponent === 0) { // zero or subnormal
            exponent = significand ? -1022 : 0
        }
        else {
            significand += 0x10000000000000 // the implicit leading 1
            exponent -= 1023
        }
        if (precision !== undefined && precision < 13) { // round half to even
            scale = Math.pow(16, 13 - precision)
            rounded = Math.floor(significand / scale)
            remainder = significand - rounded * scale
            if (remainder > scale / 2 || (remainder === scale / 2 && rounded % 2)) {
                rounded++
            }
            significand = rounded * scale
        }
        lead = Math.floor(significand / 0x10000000000000)
        digits = (significand - lead * 0x10000000000000).toString(16).padStart(13, '0')
        digits = precision === undefined ? digits.replace(/0+$/, '') : digits.substring(0, precision) + '0'.repeat(Math.max(precision - 13, 0))
        return lead + (digits ? '.' + digits : '') + 'p' + (exponent < 0 ? '-' : '+') + Math.abs(exponent)
    }

    function sprintf_format(parse_tree, argv) {
        var MAXINT = 0x80000000
        var DEF_PRECISION = 6
        var cursor = 1, tree_length = parse_tree.length, arg, output = '', i, k, ph, pad, pad_character, pad_length, is_positive, is_special, sign, hex, high, f, digits
        for (i = 0; i < tree_length; i++) {
            if (typeof parse_tree[i] === 'string') {
                output += parse_tree[i]
            }
            else if (typeof parse_tree[i] === 'object') {
                ph = parse_tree[i] // convenience purposes only
                if (ph.keys) { // keyword argument
                    arg = argv[cursor]
                    for (k = 0; k < ph.keys.length; k++) {
                        if (arg == undefined) {
                            throw new Error(sprintf('[sprintf] Cannot access property "%s" of undefined value "%s"', ph.keys[k], ph.keys[k-1]))
                        }
                        arg = arg[ph.keys[k]]
                    }
                }
                else if (ph.param_no) { // positional argument (explicit)
                    arg = argv[ph.param_no]
                }
                else if (ph.width === '*') { // asterisk replacement (width)
                    ph.width = parseInt(argv[cursor++], 10)
                    arg = argv[cursor++]
                }
                else if (ph.precision === '*') { // asterisk replacement (precision)
                    ph.precision = parseInt(argv[cursor++], 10)
                    arg = argv[cursor++]
                }
                else { // positional argument (implicit)
                    arg = argv[cursor++]
                }

                if (re.not_type.test(ph.type) && re.not_primitive.test(ph.type) && arg instanceof Function) {
                    arg = arg()
                }

                if (re.numeric_arg.test(ph.type) && (typeof arg !== 'number' && isNaN(arg))) {
                    throw new TypeError(sprintf('[sprintf] expecting number but found %T', arg))
                }

                is_special = false
                if (re.float.test(ph.type)) {
                    // like C printf: -0 keeps its sign, NaN and infinity print as nan and inf
                    f = typeof arg === 'number' ? arg : parseFloat(arg)
                    is_positive = !has_sign_bit(f)
                    is_special = !isFinite(f)
                }
                else if (re.number.test(ph.type)) {
                    is_positive = arg >= 0
                }

                switch (ph.type) {
                    case 'b':
                        arg = parseInt(arg, 10).toString(2)
                        break
                    case 'c':
                        arg = String.fromCharCode(parseInt(arg, 10))
                        break
                    case 'd':
                    case 'i':
                        arg = parseInt(arg, 10)
                        break
                    case 'j':
                        arg = JSON.stringify(arg, null, ph.width ? parseInt(ph.width) : 0)
                        break
                    case 'a':
                    case 'A':
                        arg = hex_float(f, ph.precision !== undefined ? parseInt(ph.precision, 10) : undefined)
                        break
                    case 'e':
                    case 'E':
                        arg = ph.precision ? parseFloat(arg).toExponential(ph.precision) : parseFloat(arg).toExponential(DEF_PRECISION)
                        break
                    case 'f':
                    case 'F':
                        arg = ph.precision ? parseFloat(arg).toFixed(ph.precision) : parseFloat(arg).toFixed(DEF_PRECISION)
                        break
                    case 'g':
                    case 'G':
                        f = parseFloat(arg)
                        if (f === 0) {
                            arg = ph.alt ? f.toPrecision(ph.precision ? Math.max(ph.precision, 1) : DEF_PRECISION) : '0'
                        }
                        else if (Math.abs(f) < 0.0001) {
                            digits = ph.precision ? ph.precision : DEF_PRECISION
                            digits = digits > 0 ? digits - 1 : 0
                            arg = f.toExponential(digits)
                        }
                        else if (ph.precision && ph.precision < 1 && !ph.alt) {
                            arg = f.toFixed(0)
                        }
                        else if (ph.precision) {
                            arg = ph.alt ? f.toPrecision(Math.max(ph.precision, 1)) : String(Number(arg.toPrecision(ph.precision)))
                        }
                        else {
                            arg = f.toPrecision(DEF_PRECISION)
                        }
                        if (!ph.alt) { // the # flag keeps the trailing zeros
                            arg = arg.replace(re.zero_before_exp, '$1e')
                            arg = arg.replace(re.period_zero_exp, 'e')
                            arg = arg.replace(re.trailing_zeroes, '$1')
                        }
                        break
                    case 'o':
                        arg = (parseInt(arg, 10) >>> 0).toString(8)
                        if (ph.alt && arg.charAt(0) !== '0') {
                            arg = '0' + arg
                        }
                        break
                    case 's':
                        arg = String(arg)
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                        break
                    case 't':
                        arg = String(!!arg)
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                        break
                    case 'T':
                        arg = Object.prototype.toString.call(arg).slice(8, -1).toLowerCase()
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                        break
                    case 'u':
                        arg = parseInt(arg, 10) >>> 0
                        break
                    case 'v':
                        arg = arg.valueOf()
                        arg = (ph.precision ? arg.substring(0, ph.precision) : arg)
                        break
                    case 'x':
                    case 'X':
                        hex = (parseInt(arg, 10) >>> 0).toString(16)
                        if (arg && arg.high) {
                            hex = (parseInt(arg.high, 10) >>> 0).toString(16) + hex.padStart(8, '0')
                        } else if (parseInt(arg, 10) > MAXINT - 1 || parseInt(arg, 10) < -MAXINT) {
                            high = BigInt.asUintN(32, BigInt(arg) >> BigInt(32)).toString(16)
                            hex = parseInt(high, 16) !== 0 ? high + hex.padStart(8, '0') : hex
                        }
                        arg = ph.type === 'X' ? hex.toUpperCase() : hex
                        break
                }
                if (is_special) { // the precision does not apply
                    arg = isNaN(f) ? 'nan' : 'inf'
                }
                else if (re.exponent.test(ph.type)) {
                    arg = arg.replace(re.exp_pos_digits, 'e+$1')
                    arg = arg.replace(re.exp_neg_digits, 'e-$1')
                    arg = arg.replace(re.exp_trailing, 'e$10$2')
                }
                if (ph.alt && re.float.test(ph.type) && !is_special && arg.indexOf('.') === -1) { // # always writes the decimal point
                    arg = arg.replace(re.leading_digits, '$1.')
                }
                if (re.upper_float.test(ph.type)) {
                    arg = arg.toUpperCase()
                }
                if (re.json.test(ph.type)) {
                    output += arg
                }
                else {
                    if (re.number.test(ph.type) && (!is_positive || ph.sign)) {
                        sign = is_positive ? ph.sign : '-' // the + flag or the space flag
                        arg = arg.toString().replace(re.sign, '')
                    }
                    else {
                        sign = ''
                    }
                    if (re.hex_float.test(ph.type) && !is_special) { // 0 padding goes after the prefix
                        sign += ph.type === 'A' ? '0X' : '0x'
                    }
                    else if (ph.alt && re.alt_prefix.test(ph.type) && arg !== '0') {
                        sign += ph.type === 'X' ? '0X' : '0' + ph.type
                    }
                    // like C, the - flag overrides the 0 flag
                    pad_character = ph.pad_char ? ph.pad_char === '0' ? (is_special || ph.align ? ' ' : '0') : ph.pad_char.charAt(1) : ' '
                    pad_length = ph.width - (sign + arg).length
                    pad = ph.width ? (pad_length > 0 ? pad_character.repeat(pad_length) : '') : ''
                    output += ph.align ? sign + arg + pad : (pad_character === '0' ? sign + pad + arg : pad + sign + arg)
                }
            }
        }
        return output
    }

    var sprintf_cache = Object.create(null)

    // reads C flags in any order, plus a custom padding character written as 'c
    function parse_flags(flags, ph) {
        for (var j = 0; j < flags.length; j++) {
            switch (flags.charAt(j)) {
                case '+':
                    ph.sign = '+'
                    break
                case ' ':
                    ph.sign = ph.sign || ' ' // the + flag wins
                    break
                case '0':
                    ph.pad_char = ph.pad_char || '0' // a custom padding character wins
                    break
                case '\'':
                    ph.pad_char = flags.substring(j, j + 2)
                    j++
                    break
                case '-':
                    ph.align = '-'
                    break
                case '#':
                    ph.alt = '#'
                    break
            }
        }
        return ph
    }

    function sprintf_parse(fmt) {
        if (sprintf_cache[fmt]) {
            return sprintf_cache[fmt]
        }

        var _fmt = fmt, match, parse_tree = [], arg_names = 0
        while (_fmt) {
            if ((match = re.text.exec(_fmt)) !== null) {
                parse_tree.push(match[0])
            }
            else if ((match = re.modulo.exec(_fmt)) !== null) {
                parse_tree.push('%')
            }
            else if ((match = re.placeholder.exec(_fmt)) !== null) {
                if (match[2]) {
                    arg_names |= 1
                    var field_list = [], replacement_field = match[2], field_match
                    if ((field_match = re.key.exec(replacement_field)) !== null) {
                        field_list.push(field_match[1])
                        while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                            if ((field_match = re.key_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1])
                            }
                            else if ((field_match = re.index_access.exec(replacement_field)) !== null) {
                                field_list.push(field_match[1])
                            }
                            else {
                                throw new SyntaxError('[sprintf] failed to parse named argument key')
                            }
                        }
                    }
                    else {
                        throw new SyntaxError('[sprintf] failed to parse named argument key')
                    }
                    match[2] = field_list
                }
                else {
                    arg_names |= 2
                }
                if (arg_names === 3) {
                    throw new Error('[sprintf] mixing positional and named placeholders is not (yet) supported')
                }

                parse_tree.push(parse_flags(match[3], {
                    placeholder: match[0],
                    param_no:    match[1],
                    keys:        match[2],
                    width:       match[4],
                    precision:   match[5],
                    type:        match[6]
                }))
            }
            else {
                throw new SyntaxError('[sprintf] unexpected placeholder')
            }
            _fmt = _fmt.substring(match[0].length)
        }
        return sprintf_cache[fmt] = parse_tree
    }

    /**
     * export to either browser or node.js
     */
    /* eslint-disable quote-props */
    if (typeof exports !== 'undefined') {
        exports['sprintf'] = sprintf
        exports['vsprintf'] = vsprintf
    }
    if (typeof window !== 'undefined') {
        window['sprintf'] = sprintf
        window['vsprintf'] = vsprintf

        if (typeof define === 'function' && define['amd']) {
            define(function() {
                return {
                    'sprintf': sprintf,
                    'vsprintf': vsprintf
                }
            })
        }
    }
    /* eslint-enable quote-props */
}(); // eslint-disable-line
