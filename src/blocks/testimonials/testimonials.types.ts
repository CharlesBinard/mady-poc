export interface TestimonialItem {
  quote: string;
  author: string;
  role?: string | null;
  company?: string | null;
  id?: string | null;
}

export interface TestimonialsBlockProps {
  blockType: 'testimonials';
  id?: string | null;
  heading?: string | null;
  items: TestimonialItem[];
}
