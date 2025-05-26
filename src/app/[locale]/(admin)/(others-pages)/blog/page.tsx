'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';
import { getData, postData, patchData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import Image from 'next/image';
import { toast } from 'react-toastify';
type Blog = {
  id: number;
  title: string;
  description: string;
  slug: string;
  image: string;
  cover: string;
};

export default function BlogsPage() {
  const [items, setItems] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const [modalState, setModalState] = useState<{
    type: 'create' | 'edit' | 'view' | 'quick' | null;
    item?: Blog;
  }>({ type: null });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      console.error('Token not found in localStorage');
    }
  }, []);

  useEffect(() => {
    if (token) fetchItems(token);
  }, [token]);

  const fetchItems = async (authToken: string) => {
    try {
      const res = await getData('owner/blogs', {}, new AxiosHeaders({
        Authorization: `Bearer ${authToken}`,
      }));
      setItems(res.data ?? []);
    } catch (error) {
      console.error('Failed to fetch blogs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: Blog) => {
    if (!token) return;
    try {
      await deleteData(`owner/blogs/${item.id}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      fetchItems(token);
      toast.success('Blog deleted successfully');
    } catch (error) {
      console.error('Delete failed', error);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!token) return;

    const payload = new FormData();
    payload.append('title', formData.get('title') as string);
    payload.append('description', formData.get('description') as string);
    payload.append('slug', formData.get('slug') as string);

    if (formData.get('image')) {
      payload.append('image', formData.get('image') as File);
    }
    if (formData.get('cover')) {
      payload.append('cover', formData.get('cover') as File);
    }

    try {
      if (modalState.type === 'create') {
        await postData('owner/blogs', payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
      } else if (modalState.type === 'edit' && modalState.item) {
        await patchData(`owner/blogs/${modalState.item.id}`, payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
      }

      fetchItems(token);
      setModalState({ type: null });
    } catch (error) {
      console.error('Save failed', error);
    }
  };

  return (
    <div className="p-6">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Table<Blog>
          data={items}
          columns={[
            { key: 'title', label: 'Title' },
            {
              key: 'image',
              label: 'Image',
              render: (item) =>
                item.image && (
                  <Image src={item.image} alt="image" width={100} height={100} className="rounded object-cover" />
                ),
            },
            {
              key: 'cover',
              label: 'Cover',
              render: (item) =>
                item.cover && (
                  <Image src={item.cover} alt="cover" width={100} height={100} className="rounded object-cover" />
                ),
            },
            { key: 'slug', label: 'Slug' },
          ]}
          // onCreate={() => setModalState({ type: 'create' })}
          onCreatePage={() => setModalState({ type: 'create' })}
          // onEdit={(item) => setModalState({ type: 'edit', item })}
          onDelete={handleDelete}
          onView={(item) => setModalState({ type: 'view', item })}
          onQuickView={(item) => setModalState({ type: 'quick', item })}
        />
      )}

      <ModalForm
        open={!!modalState.type}
        title={
          modalState.type === 'create'
            ? 'Create Blog'
            : modalState.type === 'edit'
            ? 'Edit Blog'
            : 'View Blog'
        }
        onClose={() => setModalState({ type: null })}
      >
        {modalState.type === 'view' || modalState.type === 'quick' ? (
          <div className="space-y-2">
            <p><strong>Title:</strong> {modalState.item?.title}</p>
            <p><strong>Description:</strong> {modalState.item?.description}</p>
            <p><strong>Slug:</strong> {modalState.item?.slug}</p>
            {modalState.item?.image && (
              <Image src={modalState.item.image} alt="Blog image" width={200} height={120} />
            )}
            {modalState.item?.cover && (
              <Image src={modalState.item.cover} alt="Blog cover" width={200} height={120} />
            )}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSubmit(formData);
            }}
            className="space-y-3"
          >
            <input
              type="text"
              name="title"
              placeholder="Title"
              defaultValue={modalState.item?.title ?? ''}
              className="w-full border p-2 rounded"
              required
            />
            <textarea
              name="description"
              placeholder="Description"
              defaultValue={modalState.item?.description ?? ''}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="text"
              name="slug"
              placeholder="Slug"
              defaultValue={modalState.item?.slug ?? ''}
              className="w-full border p-2 rounded"
              required
            />
            <input type="file" name="image" accept="image/*" className="w-full border p-2 rounded" />
            <input type="file" name="cover" accept="image/*" className="w-full border p-2 rounded" />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
              Submit
            </button>
          </form>
        )}
      </ModalForm>
    </div>
  );
}
