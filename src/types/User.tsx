// User type
export type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  phone?: string;
  second_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  createdAt?: string;
  updatedAt?: string;
};

export interface Blog {
  id: number;
  title: string;
  description: string;
  slug: string;
  image: string;
  cover: string;
  meta_title: string;
  keywords: string | null;
  meta_description: string;
  meta_keywords: string;
}


