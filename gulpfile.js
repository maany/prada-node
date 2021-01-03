var gulp = require("gulp");
var clean = require("gulp-clean")
var print = require("gulp-print")
var watchify = require("watchify");
var fancy_log = require("fancy-log");
var electron = require('electron-connect').server.create([stopOnClose=true]);
var ts = require("gulp-typescript");
const { WatchDirectoryFlags } = require("typescript");
var tsProject = ts.createProject("tsconfig.json");


var paths = {
    pages: "./src/*.html",
    styles: "./src/*.css",
    js: "./src/*.js",
    src: "./src/",
    dist: "./dist/"

}

function clean_resources(done){
    gulp.src(paths.dist + "*", {read: false}).pipe(clean());
    done()
}

function copy_resources(done){
    gulp.src(paths.pages).pipe(gulp.dest(paths.dist))
    gulp.src(paths.styles).pipe(gulp.dest(paths.dist))
    gulp.src(paths.js).pipe(gulp.dest(paths.dist))
    gulp.src(paths.src + "**/*").pipe(gulp.dest(paths.dist))
    done()
}

function compile_typescript(done){
    tsProject.src().pipe(tsProject()).js.pipe(gulp.dest("dist"))
    done()
}


function develop(done){
    // Start browser process
    electron.start("dist/app.js");
    // Watch ts files
    const tsWatcher = gulp.watch(paths.src + '**/*.ts')
    tsWatcher.on('change', (path, stats) => {
        console.log(`File ${path} was changed`)
        
    })
    tsWatcher.on('add', (path, stats) => {
        console.log(`File ${path} was added`)
    })
    tsWatcher.on('unlink', (path, stats) => {
        console.log(`File ${path} was deleted`)
    })
    // Watch js files

    // Restart browser process
    //gulp.watch(paths.src + 'main.ts', electron.restart());
 
    // Reload renderer process
    //gulp.watch([paths.src + 'renderer.js', paths.src + '*.html'], electron.reload);
    done()
}

exports.copy = copy_resources;
exports.clean = clean_resources
exports.build = gulp.parallel(copy_resources, compile_typescript)
exports.develop = develop