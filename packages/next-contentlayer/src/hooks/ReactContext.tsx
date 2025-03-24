import * as React from 'react'
import type * as JsxRuntime from 'react/jsx-runtime'
import type * as ReactDOM from 'react-dom'

export interface ReactContextValue {
  React: typeof React
  ReactDOM: typeof ReactDOM
  _jsx_runtime: typeof JsxRuntime
}

export const ReactContext = React.createContext<ReactContextValue | null>(null)

export interface ReactProviderProps {
  children: React.ReactNode
  value: ReactContextValue
}

export function ReactProvider({ children, value }: ReactProviderProps) {
  return <ReactContext.Provider value={value}>{children}</ReactContext.Provider>
}

export function useReactContext(): ReactContextValue {
  const context = React.useContext(ReactContext)
  if (!context) {
    throw new Error('useReactContext must be used within a ReactProvider')
  }
  return context
} 