var gulp = require("gulp");
var clean = require("gulp-clean")
var print = require("gulp-print")

var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");


var paths = {
    pages: "./src/*.html",
    styles: "./src/*.css",
    js: "./src/*.js",
    src: "./src/",
    dist: "./dist/"

}

function cleanup(done){
    gulp.src(paths.dist + "*", {read: false}).pipe(clean());
    done()
}

function copy(done){
    gulp.src(paths.pages).pipe(gulp.dest(paths.dist))
    gulp.src(paths.styles).pipe(gulp.dest(paths.dist))
    gulp.src(paths.js).pipe(gulp.dest(paths.dist))
    done()
}

function compileTS(done){
    tsProject.src().pipe(tsProject()).js.pipe(gulp.dest("dist"))
    done()
}
function build(done){
    gulp.series(
        copy, 
        compileTS
    )
    done()
}

// gulp.task("default", function () {
//   return tsProject.src().pipe(tsProject()).js.pipe(gulp.dest("dist"));
// });

exports.build = build;
exports.copy = copy;
exports.clean_and_build = gulp.series(cleanup, build);
