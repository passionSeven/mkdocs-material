/*
 * Copyright (c) 2016-2017 Martin Donath <martin.donath@squidfunk.com>
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

import config from "../config.json"
import path from "path"

/* ----------------------------------------------------------------------------
 * Functions
 * ------------------------------------------------------------------------- */

/**
 * Resolve relevant breakpoints matching expression
 *
 * The breakpoints are assumed to be specified by their names set in the
 * configuration file, prefixed with an "@" character.
 *
 * There are three selection modes:
 *
 * 1. -@bp: The specified breakpoint and all preceding
 * 2.  @bp: Only the specified breakpoint
 * 3. +@bp: The specified breakpoint and all following
 *
 * @param {Array.<object>} breakpoints - Breakpoints
 * @param {string} expr - Expression
 * @return {Array.<object>} Selected breakpoints
 */
const resolve = (breakpoints, expr) => {
  if (typeof expr === "undefined")
    return breakpoints

  /* Split expression and find the offset of the specified breakpoint */
  const [mode, name] = expr.split("@")
  const index = breakpoints.findIndex(
    breakpoint => breakpoint.name === name)

  /* Determine whether to go up or down */
  const from = mode !== "-" ? index : 0
  const to   = mode !== "+" ? index + 1 : breakpoints.length

  /* Return relevant breakpoints */
  return breakpoints.slice(from, to)
}

/**
 * Generate a Gemini test suite for the component
 *
 * @param {string} dirname - Directory of the test suite
 * @param {Array.<object>} components - Component specifications                // TODO: document syntax and specificagtion
 */
const generate = (dirname, components) => {
  const base = path.relative(`${__dirname}/../suites`, dirname)

  /* Generate a suite for every component */
  for (const name of Object.keys(components)) {
    const component = components[name]

    /* Create suite */
    gemini.suite(name, suite => {
      if (component.dir || component.url)
        suite.setUrl(path.join(
          base, component.dir ? component.dir : "",
          "_",  component.url ? component.url  : ""))

      /* The capture selector is assumed to exist */
      suite.setCaptureElements(component.capture)

      /* Generate a subsuite for every state */
      const states = component.states || [{ name: "", wait: 0 }]
      for (const state of states) {
        const test = subsuite => {

          /* Resolve and apply relevant breakpoints */
          const breakpoints = resolve(config.breakpoints, component.break)
          for (const breakpoint of breakpoints) {
            subsuite.capture(`@${breakpoint.name}`, actions => {

              /* Set window size according to breakpoint */
              actions.setWindowSize(
                breakpoint.size.width, breakpoint.size.height)

              /* Add the name as a CSS class to the captured element */
              if (state.name)
                actions.executeJS(new Function(`
                  document.querySelector(
                    "${component.capture}"
                  ).classList.add("${state.name}")
                `))

              /* Execute function inside an IIFE */
              if (state.exec)
                actions.executeJS(new Function(`(${state.exec})()`))

              /* Wait the specified time before taking a screenshot */
              if (state.wait)
                actions.wait(state.wait)
            })
          }
        }

        /* No state sub-suite if the name is empty */
        if (state.name.length > 0)
          gemini.suite(state.name, subsuite => test(subsuite))
        else
          test(suite)
      }

      /* Generate sub-suites */
      generate(dirname, component.suite || {})
    })
  }
}

/* ----------------------------------------------------------------------------
 * Exports
 * ------------------------------------------------------------------------- */

export default {
  generate
}
