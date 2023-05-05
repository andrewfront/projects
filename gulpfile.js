const gulp = require('gulp')
const {src,dest,series,watch} = require('gulp')
const sass = require('gulp-sass')(require('sass'));
const plumber = require('gulp-plumber');
const notify = require("gulp-notify");
const autoprefixer = require('gulp-autoprefixer');
const gulpif = require('gulp-if');
const cleanCSS = require('gulp-clean-css');
const fileinclude = require('gulp-file-include');
const typograf = require('gulp-typograf');
const del = require('del');
const webpackStream = require('webpack-stream');
const babel = require('gulp-babel');
const imagemin = require('gulp-imagemin')
const browserSync = require('browser-sync').create();
const rename = require("gulp-rename");
const srcFolder = 'src/'
const buildFolder = 'dist/'
const paths = {
    build: {
        html: buildFolder,
        css: buildFolder + './css',
        js: buildFolder + './js',
        images: buildFolder + './images',
        fonts: buildFolder + './fonts'
    },
    src: {
        html: srcFolder + '*.html',
        scss: srcFolder + 'scss/*.scss',
        js: srcFolder + 'js/*.js',
        images: srcFolder + 'images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}',
        fonts: srcFolder + 'fonts/**/*.{eot,woff,woff2,ttf,svg}',
    },
    watch: {
        html: srcFolder + '**/*.html',
        css: srcFolder + 'scss/**/*.scss',
        js: srcFolder + 'js/**/*.js',
        images: srcFolder + 'images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,xml,json}',
        fonts: srcFolder + 'fonts/**/*.{eot,woff,woff2,ttf,svg}',
    },
}
let isProd = false
function clean() {
    return del([buildFolder])
}
function html() {
    return src(paths.src.html, {
            base: srcFolder + 'html/'
        })
        .pipe(fileinclude())
        .pipe(typograf({
            locale: ['ru', 'en-US']
          }))
        .pipe(dest(paths.build.css))
        .pipe(browserSync.reload({stream: true}))
}

function styles() {
    return src(paths.src.scss, {
            base: srcFolder + 'scss/'
        })
        .pipe(plumber(
            notify.onError({
                title: "SCSS",
                message: "Error: <%= error.message %>"
            })
        ))
        .pipe(sass())
        .pipe(autoprefixer({
            cascade: false,
            grid: true,
            overrideBrowserslist: ["last 5 versions"]
        }))
        .pipe(gulpif(isProd, cleanCSS({
            level: 2
        })))
        .pipe(dest(paths.build.css, {
            sourcemaps: '.'
        }))
        .pipe(browserSync.reload({stream: true}))
}
function script() {
    return src(paths.src.js, {
        base: srcFolder + 'js/'
    })
    .pipe(plumber(
        notify.onError({
          title: "JS",
          message: "Error: <%= error.message %>"
        })
      ))
      .pipe(webpackStream({
        mode: isProd ? 'production' : 'development',
        output: {
          filename: 'main.js',
        },
        module: {
          rules: [{
            test: /\.m?js$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  ['@babel/preset-env', {
                    targets: "defaults"
                  }]
                ]
              }
            }
          }]
        },
        devtool: !isProd ? 'source-map' : false
      }))
      .on('error', function (err) {
        console.error('WEBPACK ERROR', err);
        this.emit('end');
      })
      .pipe(dest(paths.build.js))
      .pipe(browserSync.reload({stream: true}))
}
function images() {
    return src(paths.src.images, {base: srcFolder + 'images/'})
    .pipe(imagemin([
        imagemin.gifsicle({interlaced: true}),
        imagemin.mozjpeg({quality: 75, progressive: true}),
        imagemin.optipng({optimizationLevel: 5}),
        imagemin.svgo({
            plugins: [
                {removeViewBox: true},
                {cleanupIDs: false}
            ]
        })
    ]))
    .pipe(dest(paths.build.images))
    .pipe(browserSync.reload({stream: true}))
}
function fonts() {
    return src(paths.src.fonts, {base: srcFolder + 'fonts/'})
    .pipe(dest(paths.build.fonts))
    .pipe(browserSync.reload({stream: true}))
}
function watchFiles() {
    browserSync.init({
        server: {
            baseDir: './' + buildFolder
        }
    })
    gulp.watch([paths.watch.html], html)
    gulp.watch([paths.watch.css], styles)
    gulp.watch([paths.watch.js], script)
    gulp.watch([paths.watch.images], images)
    gulp.watch([paths.watch.fonts], fonts)
}
const toProd = (done) => {
    isProd = true;
    done();
  };
exports.html = html
exports.styles = styles
exports.script = script
exports.clean = clean
exports.images = images
exports.fonts = fonts
exports.watch = watch
exports.default = series(clean, html, styles, script, images, fonts, watchFiles);
exports.build = series(toProd, clean, html, styles, script, images, fonts)