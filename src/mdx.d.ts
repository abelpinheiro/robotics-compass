// Static imports of .mdx files (e.g. the dev component gallery). Lessons are
// loaded dynamically by src/lib/content.ts, which types them itself.
declare module "*.mdx" {
  import type { ComponentType } from "react";
  const MDXContent: ComponentType;
  export default MDXContent;
}
