export interface FaqItem {
  question: string;
  answer: string;
  id?: string | null;
}

export interface FaqBlockProps {
  blockType: 'faq';
  id?: string | null;
  heading: string;
  intro?: string | null;
  items: FaqItem[];
}
