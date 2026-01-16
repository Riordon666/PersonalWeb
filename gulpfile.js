const gulp = require('gulp')
const minifycss = require('gulp-clean-css')
const uglify = require('gulp-uglify')
const htmlmin = require('gulp-htmlmin')
const cssnano = require('gulp-cssnano')
const htmlclean = require('gulp-htmlclean')
const del = require('del')
const babel = require('gulp-babel')
const autoprefixer = require('gulp-autoprefixer')
const connect = require('gulp-connect')
const pug = require('gulp-pug')
const less = require('gulp-less')

const config = require('./config.json')

gulp.task('clean', function () {
	return del(['./dist/css/', './dist/js/'])
})

gulp.task('css', function () {
	return gulp
	.src('./src/css/*.less')
	.pipe(less().on('error', function(err) {
		console.log(err);
		this.emit('end');
	}))
	.pipe(minifycss({ compatibility: 'ie8' }))
	.pipe(autoprefixer({ overrideBrowserslist: ['last 2 version'] }))
	.pipe(cssnano({ reduceIdents: false }))
		.pipe(gulp.dest('./dist/css'))
})

gulp.task('html', function () {
	return gulp
		.src('./dist/**/*.html')
		.pipe(htmlclean())
		.pipe(htmlmin())
		.pipe(gulp.dest('./dist'))
})

gulp.task('js', function () {
	return gulp
		.src('./src/js/*.js')
		.pipe(babel({ presets: ['@babel/preset-env'] }))
		.pipe(uglify())
		.pipe(gulp.dest('./dist/js'))
})

gulp.task('pug', function () {
	return gulp
		.src('./src/index.pug')
		.pipe(pug({ data: config }))
		.pipe(gulp.dest('./dist'))
})

gulp.task('pages', function () {
	return gulp
		.src('./src/pages/**/*.html')
		.pipe(gulp.dest('./dist'))
})

gulp.task('assets', function () {
	return gulp
		.src(['./src/assets/**/*'])
		.pipe(gulp.dest('./dist/assets'));
})

gulp.task('build', gulp.series('clean', 'assets', 'pug', 'pages', 'css', 'js', 'html'))
gulp.task('default', gulp.series('build'))


gulp.task('watch', function (done) {
	gulp.watch('./src/**/*.pug', gulp.parallel('pug'))
	gulp.watch('./src/pages/**/*.html', gulp.parallel(['pages']))
	gulp.watch('./src/css/**/*.less', gulp.parallel(['css']))
	gulp.watch('./src/js/*.js', gulp.parallel(['js']))
	connect.server({
		root: 'dist',
		livereload: true,
		port: 8080
	})
	done()
})
