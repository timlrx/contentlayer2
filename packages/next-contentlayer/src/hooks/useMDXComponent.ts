import type { MDXComponents } from 'mdx/types'
import * as React from 'react'

import { useReactContext } from './ReactContext'

export interface MDXContentProps {
  [props: string]: unknown
  components?: MDXComponents
}

export const getMDXComponent = (code: string, globals: Record<string, unknown> = {}): React.ComponentType<MDXContentProps> => {
  const scope = {
    ...globals
  }
  const fn = new Function(...Object.keys(scope), code)
  return fn(...Object.values(scope))
}

export const useMDXComponent = (code: string, globals: Record<string, unknown> = {}): React.ComponentType<MDXContentProps> => {
  const reactContext = useReactContext()
  return React.useMemo(() => {
    const scope = {
      React: reactContext.React,
      ReactDOM: reactContext.ReactDOM,
      _jsx_runtime: reactContext._jsx_runtime,
      ...globals
    }
    const fn = new Function(...Object.keys(scope), code)
    return fn(...Object.values(scope))
  }, [code, globals, reactContext])
}
