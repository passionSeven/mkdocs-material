/*
 * Copyright (c) 2016-2019 Martin Donath <martin.donath@squidfunk.com>
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

/* ----------------------------------------------------------------------------
 * Types
 * ------------------------------------------------------------------------- */



/* ----------------------------------------------------------------------------
 * Functions
 * ------------------------------------------------------------------------- */

/**
 * JSX factory
 *
 * @param tag - Tag name
 * @param attributes - Properties
 * @param children - Child elements
 *
 * @return Element
 */
export function h(
  tag: string,
  attributes: Record<string, string | boolean> | null,
  ...children: Array<Element | Text | string>
) {
  console.log(tag, attributes, children)
  // const el = document.createElement(tag)

  // /* Set all properties */
  // if (attributes)
  //   Array.prototype.forEach.call(Object.keys(attributes), attr => {
  //     el.setAttribute(attr, attributes[attr])
  //   })

  // /* Iterate child nodes */
  // const iterateChildNodes = nodes => {
  //   Array.prototype.forEach.call(nodes, node => {

  //     /* Directly append text content */
  //     if (typeof node === "string" ||
  //         typeof node === "number") {
  //       el.textContent += node

  //     /* Recurse, if we got an array */
  //     } else if (Array.isArray(node)) {
  //       iterateChildNodes(node)

  //     /* Append raw HTML */
  //     } else if (typeof node.__html !== "undefined") {
  //       el.innerHTML += node.__html

  //     /* Append regular nodes */
  //     } else if (node instanceof Node) {
  //       el.appendChild(node)
  //     }
  //   })
  // }

  // /* Iterate child nodes and return element */
  // iterateChildNodes(children)
  // return el
  return { tag }
}
