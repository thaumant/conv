let gulp  = require('gulp'),
    babel = require('gulp-babel'),
    mocha = require('gulp-mocha'),
    del   = require('del')


gulp.task('clean', (cb) => { del('dist', cb) })


gulp.task('build', () =>
    gulp.src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('dist')))


gulp.task('test', () =>
    gulp.src('tests/**/*.js', {read: false})
        .pipe(mocha()))


gulp.task('watch', () =>
    gulp.watch(['src/**/*.js', 'tests/**/*.js'], ['build', 'test']))


gulp.task('default', ['clean', 'build'])
