/*
 * Copyright (c) 2016-2021 Martin Donath <martin.donath@squidfunk.com>
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

import * as fs from "fs/promises"
import { minify as minhtml } from "html-minifier"
import * as path from "path"
import { concat, defer, merge, of, zip } from "rxjs"
import {
  concatMap,
  map,
  reduce,
  switchMap
} from "rxjs/operators"
import {
  extendDefaultPlugins,
  optimize
} from "svgo"

import { IconSearchIndex } from "_/components"

import { base, resolve } from "./_"
import { copyAll } from "./copy"
import {
  transformScript,
  transformStyle
} from "./transform"

/* ----------------------------------------------------------------------------
 * Helper types
 * ------------------------------------------------------------------------- */

/**
 * Twemoji icon
 */
interface TwemojiIcon {
  unicode: string                      /* Unicode code point */
}

/* ----------------------------------------------------------------------------
 * Helper functions
 * ------------------------------------------------------------------------- */

/**
 * Replace file extension
 *
 * @param file - File
 * @param extension - New extension
 *
 * @returns File with new extension
 */
function ext(file: string, extension: string): string {
  return file.replace(path.extname(file), extension)
}

/**
 * Optimize SVG data
 *
 * This function will just pass-through non-SVG data, which makes the pipeline
 * much simpler, as we can reuse it for the license texts.
 *
 * @param data - SVG data
 *
 * @returns Minified SVG data
 */
function minsvg(data: string): string {
  const result = optimize(data, {
    plugins: extendDefaultPlugins([
      { name: "removeDimensions", active: true },
      { name: "removeViewBox", active: false }
    ])
  })
  return result.data || data
}

/* ----------------------------------------------------------------------------
 * Program
 * ------------------------------------------------------------------------- */

/* Copy all assets */
const assets$ = concat(

  /* Copy Material Design icons */
  ...["*.svg", "../LICENSE"]
    .map(pattern => copyAll(pattern, {
      from: "node_modules/@mdi/svg/svg",
      to: `${base}/.icons/material`,
      ...process.argv.includes("--optimize") && {
        transform: async data => minsvg(data)
      }
    })),

  /* Copy GitHub octicons */
  ...["*.svg", "../../LICENSE"]
    .map(pattern => copyAll(pattern, {
      from: "node_modules/@primer/octicons/build/svg",
      to: `${base}/.icons/octicons`,
      ...process.argv.includes("--optimize") && {
        transform: async data => minsvg(data)
      }
    })),

  /* Copy FontAwesome icons */
  ...["**/*.svg", "../LICENSE.txt"]
    .map(pattern => copyAll(pattern, {
      from: "node_modules/@fortawesome/fontawesome-free/svgs",
      to: `${base}/.icons/fontawesome`,
      ...process.argv.includes("--optimize") && {
        transform: async data => minsvg(data)
      }
    })),

  /* Copy Lunr.js search stemmers and segmenter */
  ...["min/*.js", "tinyseg.js"]
    .map(pattern => copyAll(pattern, {
      from: "node_modules/lunr-languages",
      to: `${base}/assets/javascripts/lunr`
    })),

  /* Copy images and configurations */
  ...[".icons/*.svg", "assets/images/*", "**/*.{py,yml}"]
    .map(pattern => copyAll(pattern, {
      from: "src",
      to: base
    }))
)

/* ------------------------------------------------------------------------- */

/* Transform styles */
const stylesheets$ = resolve("**/[!_]*.scss", { cwd: "src" })
  .pipe(
    concatMap(file => zip(
      of(ext(file, ".css")),
      transformStyle({
        from: `src/${file}`,
        to: ext(`${base}/${file}`, ".css")
      }))
    )
  )

/* Transform scripts */
const javascripts$ = resolve("**/{bundle,search}.ts", { cwd: "src" })
  .pipe(
    concatMap(file => zip(
      of(ext(file, ".js")),
      transformScript({
        from: `src/${file}`,
        to: ext(`${base}/${file}`, ".js")
      }))
    )
  )

/* Compute manifest */
const manifest$ = merge(
  stylesheets$,
  javascripts$
)
  .pipe(
    reduce((manifest, [key, value]) => manifest.set(
      key,
      value.replace(`${base}/`, "")
    ), new Map<string, string>())
  )

/* Transform templates */
const templates$ = manifest$
  .pipe(
    switchMap(manifest => copyAll("**/*.html", {
      from: "src",
      to: base,
      watch: process.argv.includes("--watch"),
      transform: async data => {
        const metadata = require("../../package.json")
        const banner =
          "{#-\n" +
          "  This file was automatically generated - do not edit\n" +
          "-#}\n"

        /* If necessary, apply manifest */
        if (process.argv.includes("--optimize"))
          for (const [key, value] of manifest)
            data = data.replace(
              new RegExp(`('|")${key}\\1`, "g"),
              `$1${value}$1`
            )

        /* Normalize line feeds and minify HTML */
        const html = data.replace(/\r\n/gm, "\n")
        return banner + minhtml(html, {
          collapseBooleanAttributes: true,
          includeAutoGeneratedTags: false,
          minifyCSS: true,
          minifyJS: true,
          removeComments: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true
        })

          /* Remove empty lines without collapsing everything */
          .replace(/^\s*[\r\n]/gm, "")

          /* Write theme version into template */
          .replace("$md-name$", metadata.name)
          .replace("$md-version$", metadata.version)
      }
    }))
  )

/* ------------------------------------------------------------------------- */

/* Compute icon mappings */
const icons$ = defer(() => resolve("**/*.svg", { cwd: "material/.icons" }))
  .pipe(
    reduce((index, file) => index.set(
      file.replace(/\.svg$/, "").replace(/\//g, "-"),
      file
    ), new Map<string, string>())
  )

/* Compute emoji mappings (based on Twemoji) */
const emojis$ = defer(() => resolve("venv/**/twemoji_db.py"))
  .pipe(
    switchMap(file => fs.readFile(file, "utf8")),
    map(data => {
      const [, payload] = data.match(/^emoji = ({.*})$.alias/ms)!
      return Object.entries<TwemojiIcon>(JSON.parse(payload))
        .reduce((index, [name, { unicode }]) => index.set(
          name.replace(/(^:|:$)/g, ""),
          `${unicode}.svg`
        ), new Map<string, string>())
    })
  )

/* Build search index for icons and emojis */
const index$ = zip(icons$, emojis$)
  .pipe(
    map(([icons, emojis]) => {
      const cdn = "https://raw.githubusercontent.com"
      return {
        icons: {
          base: `${cdn}/squidfunk/mkdocs-material/master/material/.icons/`,
          data: Object.fromEntries(icons)
        },
        emojis: {
          base: `${cdn}/twitter/twemoji/master/assets/svg/`,
          data: Object.fromEntries(emojis)
        }
      } as IconSearchIndex
    }),
    switchMap(data => fs.writeFile(
      `${base}/overrides/assets/javascripts/icon_search_index.json`,
      JSON.stringify(data)
    ))
  )

/* ------------------------------------------------------------------------- */

/* Put everything together */
concat(
  assets$,
  merge(
    templates$,
    index$
  )
)
  .subscribe()
  // .subscribe(console.log)
