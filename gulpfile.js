var gulp = require("gulp");
var clean = require("gulp-clean")
var print = require("gulp-print")
var watchify = require("watchify");
var fancy_log = require("fancy-log");
var electron = require('electron-connect').server.create([stopOnClose=true]);
var ts = require("gulp-typescript");
const { WatchDirectoryFlags } = require("typescript");
var tsProject = ts.createProject("tsconfig.json");
const pathModule = require('path')

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
    
    // Utils
    const getDestDir = (path) => {
        let destPath = pathModule.join([paths.dist] + path.split(pathModule.sep).slice(1, -1))
        return destPath
    }

    const getDestPath = (path) => {
        let destPath = pathModule.join([paths.dist] + path.split(pathModule.sep).slice(1))
        return destPath
    }

    const removeFile = function(path) {
        gulp.src(path, {read: false}).pipe(clean())
    }
    
    // Watch ts files
    const tsWatcher = gulp.watch([pathModule.join(paths.src, '**/*.ts'), pathModule.join(paths.src, '**/*.js')], )

    const updateTypeScriptFile = (path, stats) => {
        let destPath = getDestDir(path)
        console.log(`The compiled output will be placed at ${destPath}`)
        gulp.src(path).pipe(ts()).pipe(gulp.dest(destPath))
        console.log(`Typescript compilation completed!`)
    }

    
    // ts Hot Reload Event Handlers
    tsWatcher.on('change', (path, stats) => {
        console.log(`File ${path} was changed`)
        updateTypeScriptFile(path, stats)
        console.log(`Restarting Electron process!`)
        electron.restart("dist/app.js")
    })
    tsWatcher.on('add', (path, stats) => {
        console.log(`File ${path} was added`)
        updateTypeScriptFile(path, stats)
        console.log(`Restarting Electron process!`)
        electron.restart("dist/app.js")
    })
    tsWatcher.on('unlink', (path, stats) => {
        console.log(`File ${path} was deleted`)
        let destPath = getDestPath(path)
        let finalDestPath = pathModule.join(pathModule.dirname(destPath), pathModule.basename(destPath, pathModule.extname(destPath)) + ".js")
        console.log(`Removing ${finalDestPath}`)
        removeFile(finalDestPath)
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