var gulp = require("gulp");
var clean = require("gulp-clean")
var electron = require('electron-connect').server.create({
    stopOnClose: true,
    logLevel: 2    
});
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
    
    const removeDistFile = function(path){
        let destPath = getDestPath(path)
        console.log(`Removing ${destPath}`)
        removeFile(destPath)
    }

    const copySrcToDist = function(path){
        let destDir = getDestDir(path)
        console.log(`Copying File ${path} to ${destDir}`)
        gulp.src(path).pipe(gulp.dest(destDir))
    }
    // Watch ts files
    const tsWatcher = gulp.watch([pathModule.join(paths.src, '**/*.ts')])

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
    const jsWatcher = gulp.watch([pathModule.join(paths.src, '**/*.js')])
    // js Hot Reload Event Handlers
    jsWatcher.on('change', (path, stats) => {
        console.log(`File ${path} was changed`)
        copySrcToDist(path)
        console.log(`Restarting Electron process!`)
        electron.restart("dist/app.js")
    })

    jsWatcher.on('add', (path, stats) => {
        console.log(`File ${path} was added`)
        copySrcToDist(path)
        console.log(`Restarting Electron process!`)
        electron.restart("dist/app.js")
    })
    jsWatcher.on('unlink', (path, stats) => {
        console.log(`File ${path} was deleted`)
        removeDistFile(path)
        console.log(`Restarting Electron process!`)
        electron.restart("dist/app.js")
    })
 
    // Reload renderer process
    const staticWatcher = gulp.watch([
        paths.src + '**/*.css', 
        paths.src + '**/*.html', 
        paths.src + '**/*.jpg',
    ]);
    staticWatcher.on('change', (path, stats) => {
        console.log(`File ${path} was changed`)
        let destDir = getDestDir(path)
        console.log(`Copying File ${path} to ${destDir}`)
        gulp.src(path).pipe(gulp.dest(destDir))
        console.log(`Reloading Electron process!`)
        reload_renderer(done)
    })

    staticWatcher.on('add', (path, stats) => {
        console.log(`File ${path} was added`)
        let destDir = getDestDir(path)
        console.log(`Copying File ${path} to ${destDir}`)
        gulp.src(path).pipe(gulp.dest(destDir))
        console.log(`Reloading Electron process!`)
        reload_renderer(done)
    })
    staticWatcher.on('unlink', (path, stats) => {
        console.log(`File ${path} was deleted`)
        removeDistFile(path)
        console.log(`Reloading Electron process!`)
        reload_renderer(done)
    })
    done()
}
var callback = function(electronProcState) {
    console.log('electron process state: ' + electronProcState);
    if (electronProcState == 'stopped') {
      process.exit();
    }
  };
  
function restart_browser(done) {
    electron.restart(callback);
    done();
}
  
function reload_renderer(done) {
    // Reload renderer process
    electron.reload(callback);
    setTimeout(function () {
      electron.broadcast('reload');
      done();
    })
}
exports.copy = copy_resources;
exports.clean = clean_resources
exports.build = gulp.parallel(copy_resources, compile_typescript)
exports.develop = develop