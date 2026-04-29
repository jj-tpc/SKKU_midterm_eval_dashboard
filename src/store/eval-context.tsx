'use client';
import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react';
import { reducer, initialState, type State, type Action } from './machine';

const Ctx = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null);

export function EvalProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useEval() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEval must be used inside EvalProvider');
  return ctx;
}
