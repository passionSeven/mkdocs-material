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

import changed from "gulp-changed"
import compact from "gulp-remove-empty-lines"
import gulpif from "gulp-if"
import minhtml from "gulp-htmlmin"
import path from "path"
import replace from "gulp-replace"
import version from "gulp-rev-replace"

/* ----------------------------------------------------------------------------
 * Task: minify views
 * ------------------------------------------------------------------------- */

export default (gulp, config, args) => {
  return () => {
    const metadata = require(path.join(process.cwd(), "./package.json"))
    return gulp.src(`${config.views.src}/**/*.html`)
      .pipe(changed(config.views.build))
      .pipe(
        minhtml({
          collapseBooleanAttributes: true,
          removeComments: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          customAttrCollapse: /(content)/
        }))
      .pipe(replace("$theme-name$", metadata.name))
      .pipe(replace("$theme-version$", metadata.version))
      .pipe(compact())
      .pipe(gulpif(args.revision,
        version({ manifest: gulp.src("manifest.json") })))
      .pipe(gulp.dest(config.views.build))
  }
}
