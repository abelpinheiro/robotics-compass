import type { MDXComponents } from 'mdx/types'
import { MdxLink } from '@/components/lesson/MdxLink'

// Global MDX component overrides live here. Lesson-specific styling and the
// section/Callout/Viz components are wired up in Phase 2 with the design system.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // internal links get the reader's /<locale>/ prefix
    a: MdxLink,
    ...components,
  }
}
