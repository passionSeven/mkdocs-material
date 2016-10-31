/*
 * Copyright (c) 2016 Martin Donath <martin.donath@squidfunk.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

import gulp from "gulp"
import notifier from "node-notifier"
import plumber from "gulp-plumber"
import util from "gulp-util"
import yargs from "yargs"

/* ----------------------------------------------------------------------------
 * Configuration and arguments
 * ------------------------------------------------------------------------- */

const config = {
  assets: {
    src: "src/assets",                 /* Source directory for assets */
    build: "material/assets"           /* Target directory for assets */
  },
  lib: "lib",                          /* Libraries */
  views: {
    src: "src",                        /* Source directory for views */
    build: "material"                  /* Target directory for views */
  }
}

const args = yargs
  .default("clean",      false)        /* Clean before build */
  .default("karma",      true)         /* Karma watchdog */
  .default("lint",       true)         /* Lint sources */
  .default("mkdocs",     true)         /* MkDocs watchdog */
  .default("optimize",   false)        /* Optimize sources */
  .default("revision",   false)        /* Revision assets */
  .default("sourcemaps", false)        /* Create sourcemaps */
  .argv

/* ----------------------------------------------------------------------------
 * Overrides and helpers
 * ------------------------------------------------------------------------- */

/*
 * Override gulp.src() for nicer error handling.
 */
const src = gulp.src
gulp.src = (...glob) => {
  return src.apply(gulp, glob)
    .pipe(
      plumber(function(error) {
        util.log(util.colors.red(
          `Error (${error.plugin}): ${error.message}`
        ))

        /* Extract file where error happened, if existent */
        const file = error.relativePath
          ? error.relativePath.split("/").pop()
          : ""

        /* Dispatch system-level notification */
        notifier.notify({
          title: `Error (${error.plugin}): ${file}`,
          message: error.messageOriginal
        })

        // eslint-disable-next-line no-invalid-this
        this.emit("end")

        /* Throw error and abort, if not in watch mode */
        if (args._[0] !== "watch")
          throw error
      }))
}

/*
 * Helper function to load a task
 */
const load = task => {
  require(`./${config.lib}/tasks/${task}`)(gulp, config, args)
}

/* ----------------------------------------------------------------------------
 * Images
 * ------------------------------------------------------------------------- */

/*
 * Copy favicon
 */
gulp.task("assets:images:build:ico",
  load("assets/images/build/ico"))

/*
 * Copy and minify vector graphics
 */
gulp.task("assets:images:build:svg",
  load("assets/images/build/svg"))

/*
 * Copy images
 */
gulp.task("assets:images:build", args.clean ? [
  "assets:images:clean"
] : [], () => {
  return gulp.start([
    "assets:images:build:ico",
    "assets:images:build:svg"
  ])
})

/*
 * Clean images generated by build
 */
gulp.task("assets:images:clean",
  load("assets/images/clean"))

/* ----------------------------------------------------------------------------
 * Javascripts
 * ------------------------------------------------------------------------- */

/*
 * Build application logic
 */
gulp.task("assets:javascripts:build:application",
  load("assets/javascripts/build/application"))

/*
 * Build custom modernizr
 */
gulp.task("assets:javascripts:build:modernizr", [
  "assets:stylesheets:build"
], load("assets/javascripts/build/modernizr"))

/*
 * Build application logic and modernizr
 */
gulp.task("assets:javascripts:build", (args.clean ? [
  "assets:javascripts:clean"
] : []).concat(args.lint ? [
  "assets:javascripts:lint"
] : []), () => {
  return gulp.start([
    "assets:javascripts:build:application",
    "assets:javascripts:build:modernizr"
  ])
})

/*
 * Clean javascripts generated by build
 */
gulp.task("assets:javascripts:clean",
  load("assets/javascripts/clean"))

/*
 * Lint javascripts
 */
gulp.task("assets:javascripts:lint",
  load("assets/javascripts/lint"))

/* ----------------------------------------------------------------------------
 * Stylesheets
 * ------------------------------------------------------------------------- */

/*
 * Build stylesheets from SASS source
 */
gulp.task("assets:stylesheets:build", (args.clean ? [
  "assets:stylesheets:clean"
] : []).concat(args.lint ? [
  "assets:stylesheets:lint"
] : []),
  load("assets/stylesheets/build"))

/*
 * Clean stylesheets generated by build
 */
gulp.task("assets:stylesheets:clean",
  load("assets/stylesheets/clean"))

/*
 * Lint SASS sources
 */
gulp.task("assets:stylesheets:lint",
  load("assets/stylesheets/lint"))

/* ----------------------------------------------------------------------------
 * Assets
 * ------------------------------------------------------------------------- */

/*
 * Build assets
 */
gulp.task("assets:build", [
  "assets:images:build",
  "assets:javascripts:build",
  "assets:stylesheets:build"
])

/*
 * Clean files generated by build
 */
gulp.task("assets:clean", [
  "assets:images:clean",
  "assets:javascripts:clean",
  "assets:stylesheets:clean"
])

/* ----------------------------------------------------------------------------
 * Views
 * ------------------------------------------------------------------------- */

/*
 * Minify views
 */
gulp.task("views:build", (args.revision ? [
  "assets:images:build",
  "assets:stylesheets:build",
  "assets:javascripts:build"
] : []).concat(args.clean ? [
  "views:clean"
] : []), load("views/build"))

/*
 * Clean views
 */
gulp.task("views:clean",
  load("views/clean"))

/* ----------------------------------------------------------------------------
 * MkDocs
 * ------------------------------------------------------------------------- */

/*
 * Build documentation
 */
gulp.task("mkdocs:build", [
  "assets:build",
  "views:build",
  "mkdocs:clean"
], load("mkdocs/build"))

/*
 * Clean documentation build
 */
gulp.task("mkdocs:clean",
  load("mkdocs/clean"))

/*
 * Restart MkDocs server
 */
gulp.task("mkdocs:serve",
  load("mkdocs/serve"))

/* ----------------------------------------------------------------------------
 * Tests
 * ------------------------------------------------------------------------- */

/*
 * Start karma test runner
 */
gulp.task("tests:unit:watch",
  load("tests/unit/watch"))

/* ----------------------------------------------------------------------------
 * Interface
 * ------------------------------------------------------------------------- */

/*
 * Build assets and documentation
 */
gulp.task("build", [
  "assets:build",
  "views:build"
].concat(args.mkdocs
  ? "mkdocs:build"
  : []))

/*
 * Clean assets and documentation
 */
gulp.task("clean", [
  "assets:clean",
  "views:clean",
  "mkdocs:clean"
])

/*
 * Watch for changes and rebuild assets on the fly
 */
gulp.task("watch", [
  "assets:build",
  "views:build"
], () => {
  process.env.WATCH = true

  /* Start MkDocs server */
  if (args.mkdocs)
    gulp.start("mkdocs:serve")

  /* Start karma test runner */
  if (args.karma)
    gulp.start("tests:unit:watch")

  /* Rebuild stylesheets */
  gulp.watch([
    `${config.assets.src}/stylesheets/**/*.scss`
  ], ["assets:stylesheets:build"])

  /* Rebuild javascripts */
  gulp.watch([
    `${config.assets.src}/javascripts/**/*.{js,jsx}`
  ], ["assets:javascripts:build:application"])

  /* Copy images */
  gulp.watch([
    `${config.assets.src}/images/**/*`
  ], ["assets:images:build"])

  /* Minify views */
  gulp.watch([
    `${config.views.src}/**/*.html`
  ], ["views:build"])
})

/*
 * Build assets by default
 */
gulp.task("default", ["build"])
