export interface VideoBlockProps {
  blockType: 'video';
  id?: string | null;
  heading?: string | null;
  provider: 'youtube' | 'vimeo';
  videoId: string;
  caption?: string | null;
}
