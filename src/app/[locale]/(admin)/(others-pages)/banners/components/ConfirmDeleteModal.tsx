export default function ConfirmDeleteModal({
    onCancel,
    onConfirm,
  }: {
    onCancel: () => void;
    onConfirm: () => void;
  }) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-lg font-semibold mb-4">Are you sure you want to delete?</h2>
          <div className="flex justify-between">
            <button onClick={onCancel} className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
            <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Yes, Delete</button>
          </div>
        </div>
      </div>
    );
  }
  