import type { MDXComponents } from 'mdx/types'
import { MdxLink } from '@/components/lesson/MdxLink'
import { H2, H3 } from '@/components/lesson/headings'
import { MotivatingQuestion } from '@/components/lesson/MotivatingQuestion'
import { Proof, ProofStep, Why } from '@/components/lesson/Proof'

// Global MDX components: available in every lesson without an import.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // internal links get the reader's /<locale>/ prefix
    a: MdxLink,
    // section headings get ids, so links can point at a section
    h2: H2,
    h3: H3,
    // lesson template v2
    MotivatingQuestion,
    Proof,
    ProofStep,
    Why,
    ...components,
  }
}
