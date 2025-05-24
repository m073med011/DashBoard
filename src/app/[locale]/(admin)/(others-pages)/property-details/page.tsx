'use client';

import { useState } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';

type Item = {
  id: number;
  name: string;
  description: string;
};

export default function Page() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: 'Amenity A', description: 'First description' },
    { id: 2, name: 'Amenity B', description: 'Second description' },
  ]);

  const [modalState, setModalState] = useState<{
    type: 'create' | 'edit' | 'view' | 'quick' | null;
    item?: Item;
  }>({ type: null });

  const handleDelete = (item: Item) => {
    // TODO: Replace with API call
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  const handleSubmit = (formData: FormData) => {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (modalState.type === 'create') {
      const newItem: Item = { id: Date.now(), name, description };
      setItems(prev => [...prev, newItem]);
    } else if (modalState.type === 'edit' && modalState.item) {
      setItems(prev =>
        prev.map(i =>
          i.id === modalState.item!.id ? { ...i, name, description } : i
        )
      );
    }

    setModalState({ type: null });
  };

  return (
    <div className="p-6">
      <Table<Item>
        data={items}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description' },
        ]}
        onCreate={() => setModalState({ type: 'create' })}
        onEdit={item => setModalState({ type: 'edit', item })}
        onDelete={handleDelete}
        onView={item => setModalState({ type: 'view', item })}
        onQuickView={item => setModalState({ type: 'quick', item })}
      />

      <ModalForm
        open={!!modalState.type}
        title={
          modalState.type === 'create'
            ? 'Create Item'
            : modalState.type === 'edit'
            ? 'Edit Item'
            : 'View Item'
        }
        onClose={() => setModalState({ type: null })}
      >
        {modalState.type === 'view' || modalState.type === 'quick' ? (
          <div className="space-y-2">
            <p><strong>Name:</strong> {modalState.item?.name}</p>
            <p><strong>Description:</strong> {modalState.item?.description}</p>
          </div>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSubmit(formData);
            }}
            className="space-y-3"
          >
            <input
              type="text"
              name="name"
              placeholder="Name"
              defaultValue={modalState.item?.name}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="text"
              name="description"
              placeholder="Description"
              defaultValue={modalState.item?.description}
              className="w-full border p-2 rounded"
              required
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
              Submit
            </button>
          </form>
        )}
      </ModalForm>
    </div>
  );
}
