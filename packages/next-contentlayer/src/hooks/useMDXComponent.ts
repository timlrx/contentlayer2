import { getMDXComponent as getMDXComponentOriginal } from '@contentlayer2/core/client'
import * as React from 'react'
import * as _jsx_dev_runtime from 'react/jsx-dev-runtime'
import * as _jsx_runtime from 'react/jsx-runtime'
import * as ReactDOM from 'react-dom'

// Pass in the React module into the evaluated code instead of having the evaluated code import React
// See https://github.com/timlrx/contentlayer2/issues/66
const defaultRuntime = {
  React,
  ReactDOM,
  _jsx_runtime: process.env.NODE_ENV === 'production' ? _jsx_runtime : _jsx_dev_runtime,
}

/**
 * Get an MDX component from compiled MDX code
 *
 * @param code - The string of code you got from bundleMDX
 * @param globals - Any variables your MDX needs to have accessible when it runs
 * @returns A React component that renders the MDX content
 */
export const getMDXComponent = (code: string, globals: Record<string, unknown> = {}) => {
  const options = {
    ...defaultRuntime,
    ...globals,
  }

  return getMDXComponentOriginal(code, options)
}

export const useMDXComponent = (code: string, globals: Record<string, unknown> = {}) => {
  return React.useMemo(() => getMDXComponent(code, globals), [code, globals])
}
