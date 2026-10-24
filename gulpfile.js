'use strict'

var pkg         = require('./package.json'),
    gulp        = require('gulp'),
    uglify      = require('gulp-uglify'),
    rename      = require('gulp-rename'),
    header      = require('gulp-header'),
    banner      = '/*! <%= pkg.name %> v<%= pkg.version %> | Copyright (c) 2007-present, <%= pkg.author %> | <%= pkg.license %> */\n'

function dist() {
    return gulp
        .src('src/*.js', {sourcemaps: true})
        .pipe(uglify())
        .pipe(rename({suffix: '.min'}))
        .pipe(header(banner, {pkg: pkg}))
        .pipe(gulp.dest('dist', {sourcemaps: '.'}))
}

exports.dist = dist
exports.default = dist
