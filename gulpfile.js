/*global require*/
"use strict";

var gulp = require('gulp'),
    path = require('path'),
    data = require('gulp-data'),
	twig = require('gulp-twig'), // Decided to use twig, because already familiar with it
    prefix = require('gulp-autoprefixer'),
    sass = require('gulp-sass'),
    concat = require('gulp-concat'),
    sourcemaps = require('gulp-sourcemaps'),
	browserSync = require('browser-sync'),
	fs = require('fs');

/*
 * Directories here
 */
var paths = {
  build: './build/',
  sass: './scss/',
  css: './build/assets/css/',
  data: './client/data/'
};

/**
 * Compile .twig files and pass in data from json file
 * matching file name. index.twig - index.twig.json
 */
gulp.task('twig', function () {
//   return gulp.src(['./client/templates/*.twig','./client/data/head.twig'])
  return gulp.src(['./client/templates/*.twig'])
  	// Load template pages json data
    .pipe(data(function (file) {
		return JSON.parse(fs.readFileSync(paths.data + path.basename(file.path) + '.json'));		
	}))
	.on('error', function (err) {
      process.stderr.write(err.message + '\n');
      this.emit('end');
    })
    .pipe(twig())
    .on('error', function (err) {
      process.stderr.write(err.message + '\n');
      this.emit('end');
    })
	.pipe(gulp.dest(paths.build))
	.pipe(browserSync.reload({
		stream: true
	}));
});

/**
 * Recompile .twig files and live reload the browser
 */
gulp.task('rebuild', ['twig'], function () {
  // BrowserSync Reload
  browserSync.reload();
});

/**
 * Wait for twig, js and sass tasks, then launch the browser-sync Server
 */
gulp.task('browser-sync', ['sass', 'twig', 'js'], function () {
  browserSync({
    server: {
      baseDir: paths.build
    },
    notify: false,
    browser:"google chrome"
  });
});

/**
 * Compile .scss files into build css directory With autoprefixer no
 * need for vendor prefixes then live reload the browser.
 */
gulp.task('sass', function () {
  return gulp.src(paths.sass + 'vendors/main.scss')
  	.pipe(sourcemaps.init())
    .pipe(sass({
      includePaths: [paths.sass + 'vendors/'],
      outputStyle: 'expanded'
	}))
	.pipe(sourcemaps.write())
	.on('error', function (err) {
		sass.logError
		this.emit('end');
	})
    .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], {
      cascade: true
    }))
    .pipe(gulp.dest(paths.css))
    .pipe(browserSync.reload({
      stream: true
    }));
});

/**
 * Compile .js files into build js directory With app.min.js
 */
gulp.task('js', function(){
    return gulp.src('build/assets/js/script.js')
        .pipe(sourcemaps.init())
        .pipe(concat('script.min.js'))
		.pipe(sourcemaps.write())		
		.pipe(gulp.dest('build/assets/js'))
		.on('error', function (err) {
            console.log(err.toString());
            this.emit('end');
        }).pipe(browserSync.reload({
			stream: true
		}));
});

/**
 * Watch scss files for changes & recompile
 * Watch .twig files run twig-rebuild then reload BrowserSync
 */
gulp.task('watch', function () {
	gulp.watch(paths.build + 'assets/js/script.js', ['js', browserSync.reload]);
  	gulp.watch(paths.sass + 'vendors/main.scss', ['sass', browserSync.reload]);
  	gulp.watch(['client/templates/**/*.twig','client/data/*.twig.json'], {cwd:'./'}, ['rebuild']);
});

// Build task compile sass and twig.
gulp.task('build', ['sass', 'twig']);

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the project site, launch BrowserSync then watch
 * files for changes
 */
gulp.task('default', ['browser-sync', 'watch']);