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

import child from "child_process"
import util from "gulp-util"

/* ----------------------------------------------------------------------------
 * Locals
 * ------------------------------------------------------------------------- */

/* MkDocs server */
let server = null

/* ----------------------------------------------------------------------------
 * Task: serve documentation
 * ------------------------------------------------------------------------- */

export default () => {
  return () => {
    if (server)
      server.kill()

    /* Spawn MkDocs server */
    server = child.spawn("mkdocs", ["serve", "-a", "0.0.0.0:8000"])

    /* Pretty print server log output */
    server.stdout.on("data", data => {
      const lines = data.toString().split("\n")
      for (const l in lines)
        if (lines[l].length)
          util.log(lines[l])
    })

    /* Print errors to stdout */
    server.stderr.on("data", data => {
      process.stdout.write(data.toString())
    })
  }
}
