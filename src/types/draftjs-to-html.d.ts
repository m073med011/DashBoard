// types/draftjs-to-html.d.ts

declare module 'draftjs-to-html' {
    import { RawDraftContentState } from 'draft-js';
  
    /**
     * Converts a RawDraftContentState object to an HTML string.
     * @param contentState The raw content state from Draft.js
     * @returns A string of HTML
     */
    export default function draftToHtml(
      contentState: RawDraftContentState
    ): string;
  }
  