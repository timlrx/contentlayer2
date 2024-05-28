// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- ts-expect-error would error if consumers have setup their tsconfig correctly. It's just this tsconfig that's incorrect.
// @ts-ignore - tsconfig. is not set up yet for `exports`
import { getMDXComponent } from '@contentlayer2/core/client'
// NOTE use ESM/CommonJS compat import here until resolved: https://github.com/facebook/react/issues/11503
import React from 'react'

export { getMDXComponent }

export const useMDXComponent = (code: string, globals: Record<string, unknown> = {}) => {
  return React.useMemo(() => getMDXComponent(code, globals), [code, globals])
}
