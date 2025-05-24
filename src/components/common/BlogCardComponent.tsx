'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
// import { useRouter } from 'next/navigation';
import { Blog } from '@/types/User';
// import { deleteData } from '@/libs/axios/server';

interface Props {
  blog: Blog;
  locale: string;
  token: string;
  t: (key: string) => string;
}

const BlogCardComponent = ({ blog  }: Props) => {

  

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative w-full h-48">
        <Image
          src={blog.image}
          alt={blog.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-5">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 truncate">
          {blog.title}
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
          {blog.description}
        </p>
        <div className="flex justify-between items-center">
          <Link
            href={`/${locale}/blog/${blog.id}`}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            {t('Read More')}
          </Link>
          <Link
            href={`/${locale}/blog/edit/${blog.id}`}
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            {t('Edit')}
          </Link>
          <button
            onClick={() => {}}
            className="text-red-600 dark:text-red-400 font-medium hover:underline"
          >
            {t('Delete')}
          </button>
        </div>
      </div>
    </article>
  );
};

export default BlogCardComponent;
