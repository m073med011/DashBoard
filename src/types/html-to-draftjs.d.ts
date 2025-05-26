declare module 'html-to-draftjs' {
    import { ContentBlock, DraftEntityType } from 'draft-js';
  
    export interface DraftEntityData {
      type: DraftEntityType;
      mutability: 'MUTABLE' | 'IMMUTABLE' | 'SEGMENTED';
      data: Record<string, unknown>;
    }
  
    export interface DraftModel {
      contentBlocks: ContentBlock[];
      entityMap: { [key: string]: DraftEntityData };
    }
  
    export default function htmlToDraft(html: string): DraftModel;
  }
  