let gulp  = require('gulp'),
    babel = require('gulp-babel'),
    mocha = require('gulp-mocha'),
    smaps = require('gulp-sourcemaps')


gulp.task('build', () =>
    gulp.src('src/**/*.js')
        .pipe(smaps.init())
        .pipe(babel())
        .pipe(smaps.write("."))
        .pipe(gulp.dest('dist')))


gulp.task('test', () =>
    gulp.src('tests/**/*.js', {read: false})
        .pipe(mocha()))


gulp.task('watch', () =>
    gulp.watch(['src/**/*.js', 'tests/**/*.js'], ['build', 'test']))


gulp.task('default', ['build', 'test'])
