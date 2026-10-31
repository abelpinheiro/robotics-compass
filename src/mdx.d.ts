// Static imports of .mdx files (e.g. the dev component gallery). Lessons are
// loaded dynamically by src/lib/content.ts, which types them itself.
declare module "*.mdx" {
  import type { ComponentType } from "react";
  import type { MDXComponents } from "mdx/types";
  const MDXContent: ComponentType<{ components?: MDXComponents }>;
  export default MDXContent;
}
