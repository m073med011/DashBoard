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

export type Banner = {
  id: number;
  type: string;
  link: string;
  name: string;
  name_en: string;
  name_ar: string;
  description: string;
  description_en: string;
  description_ar: string;
  image: string;
  image_en: string;
  image_ar: string;
};

export type Type = {
  id: number | null;
  title: string;
  title_en: string;
  title_ar: string;
};

