/*global require*/
"use strict";

var gulp = require('gulp'),
    path = require('path'),
    data = require('gulp-data'),
    twig = require('gulp-twig'), // Decided to use twig, because already familiar with it
    prefix = require('gulp-autoprefixer'),
    sass = require('gulp-sass'),    
	  plumber = require('gulp-plumber'),
    concat = require('gulp-concat'),
    sourcemaps = require('gulp-sourcemaps'),
    browserSync = require('browser-sync'),
    fs = require('fs');

/*
 * Directories here
 */
var paths = {
  build: './build/',
  scss: './scss/',
  data: './client/data/',
  js: './client/js/'
};

/**
 * Compile .twig files and pass in data from json file
 * matching file name. index.twig - index.twig.json
 */
gulp.task('twig', function () {
  return gulp.src(['./client/templates/*.twig'])
  // Stay live and reload on error
	.pipe(plumber({
		handleError: function (err) {
			console.log(err);
			this.emit('end');
		}
	}))
  // Load template pages json data
  .pipe(data(function (file) {
		return JSON.parse(fs.readFileSync(paths.data + path.basename(file.path) + '.json'));		
	}))
  .pipe(
    twig().on('error', function (err) {
        process.stderr.write(err.message + '\n');
        this.emit('end');
    })
  )
	.pipe(gulp.dest(paths.build));
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
    return gulp.src(paths.scss + 'vendors/main.scss')
        .pipe(sourcemaps.init())
        // Stay live and reload on error
        .pipe(plumber({
            handleError: function (err) {
                console.log(err);
                this.emit('end');
            }
        }))
        .pipe(
            sass({
                includePaths: [paths.scss + 'vendors/'],
                outputStyle: 'compressed'
            }).on('error', function (err) {
                console.log(err.message);
                // sass.logError
                this.emit('end');
            })
        )
        .pipe(prefix(['last 15 versions','> 1%','ie 8','ie 7','iOS >= 9','Safari >= 9','Android >= 4.4','Opera >= 30'], {
            cascade: true
        }))	
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.build + '/assets/css/'));
  });

/**
 * Compile script.js files into build assets js directory concat to script.min.js
 */
gulp.task('js', function(){
    return gulp.src(paths.js + 'script.js')
        .pipe(sourcemaps.init())
        .pipe(concat('script.min.js'))
        .on('error', function (err) {
            console.log(err.toString());
            this.emit('end');
        })
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.build +'assets/js'));
});

/**
 * Watch scss files for changes & recompile
 * Watch .twig files run twig-rebuild then reload BrowserSync
 */
gulp.task('watch', function () {
    // Script JS
    gulp.watch(paths.js + 'script.js', ['js', browserSync.reload]);
    // SCSS files or main.scss
    gulp.watch(paths.scss + '**/*.scss', ['sass', browserSync.reload]);
    // Assets Watch and copy to build in some file changes
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