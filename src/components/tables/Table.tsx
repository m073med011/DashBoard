// 'use client';

// import { useState } from 'react';
// // import { Eye, Pencil, Trash, ZoomIn } from 'lucide-react';

// // Replace button text with icons:


// interface TableProps<T> {
//   data: T[];
//   columns: { key: keyof T; label: string }[];
//   onCreate: () => void;
//   onEdit: (item: T) => void;
//   onDelete: (item: T) => void;
//   onView: (item: T) => void;
//   onQuickView: (item: T) => void;
// }

// export default function Table<T extends { id: string | number }>({
//   data,
//   columns,
//   onCreate,
//   onEdit,
//   onDelete,
//   onView,
//   onQuickView,
// }: TableProps<T>) {
//   const [search, setSearch] = useState('');

//   const filteredData = data.filter(item =>
//     columns.some(col =>
//       String(item[col.key]).toLowerCase().includes(search.toLowerCase())
//     )
//   );

//   return (
//     <div className="space-y-6">
//       {/* Header Section */}
//       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
//         <input
//           type="text"
//           placeholder="Search..."
//           className="border border-gray-300 px-4 py-2 rounded-full shadow-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
//           value={search}
//           onChange={e => setSearch(e.target.value)}
//         />
//         <button
//           onClick={onCreate}
//           className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold px-6 py-2 rounded-full shadow-md transition"
//         >
//           + Create New
//         </button>
//       </div>

//       {/* Table Section */}
//       <div className="overflow-x-auto bg-white rounded-xl shadow-lg ring-1 ring-gray-200">
//         <table className="min-w-full text-sm">
//           <thead className="bg-gray-50 text-gray-700 text-sm uppercase tracking-wider">
//             <tr>
//               {columns.map(col => (
//                 <th key={String(col.key)} className="px-6 py-4 text-left whitespace-nowrap">
//                   {col.label}
//                 </th>
//               ))}
//               <th className="px-6 py-4 text-left">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredData.length === 0 ? (
//               <tr>
//                 <td
//                   colSpan={columns.length + 1}
//                   className="px-6 py-8 text-center text-gray-400 text-base"
//                 >
//                   No results found.
//                 </td>
//               </tr>
//             ) : (
//               filteredData.map((item) => (
//                 <tr
//                   key={item.id}
//                   className="hover:bg-gray-50 transition border-t border-gray-100"
//                 >
//                   {columns.map(col => (
//                     <td key={String(col.key)} className="px-6 py-4 text-gray-800">
//                       {String(item[col.key])}
//                     </td>
//                   ))}
//                  <td className="px-6 py-4">
//   <div className="flex flex-wrap gap-2">
//     <button
//       onClick={() => onView(item)}
//       className="bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium px-3 py-1.5 rounded-full text-xs shadow-sm transition"
//     >
//       View
//     </button>
//     <button
//       onClick={() => onQuickView(item)}
//       className="bg-cyan-100 text-cyan-700 hover:bg-cyan-200 font-medium px-3 py-1.5 rounded-full text-xs shadow-sm transition"
//     >
//       Quick View
//     </button>
//     <button
//       onClick={() => onEdit(item)}
//       className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-medium px-3 py-1.5 rounded-full text-xs shadow-sm transition"
//     >
//       Edit
//     </button>
//     <button
//       onClick={() => onDelete(item)}
//       className="bg-red-100 text-red-700 hover:bg-red-200 font-medium px-3 py-1.5 rounded-full text-xs shadow-sm transition"
//     >
//       Delete
//     </button>
//   </div>
// </td>

//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }


// components/tables/Table.tsx

import React from 'react';

type Column<T> = {
  key: keyof T;
  label: string;
  render?: (item: T) => React.ReactNode;
};

type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  onCreate?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  onQuickView?: (item: T) => void;
};

export default function Table<T extends { id: number }>({
  data,
  columns,
  onCreate,
  onEdit,
  onDelete,
  onView,
  onQuickView,
}: TableProps<T>) {
  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Table</h2>
        {onCreate && (
          <button onClick={onCreate} className="bg-green-600 text-white px-4 py-2 rounded">
            Create New
          </button>
        )}
      </div>
      <table className="w-full table-auto border">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="border px-4 py-2">{col.label}</th>
            ))}
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              {columns.map((col) => (
                <td key={String(col.key)} className="border px-4 py-2">
                  {col.render ? col.render(item) : String(item[col.key])}
                </td>
              ))}
              <td className="border px-4 py-2 flex gap-2">
                {onView && (
                  <button onClick={() => onView(item)} className="text-blue-500">View</button>
                )}
                {onQuickView && (
                  <button onClick={() => onQuickView(item)} className="text-purple-500">Quick</button>
                )}
                {onEdit && (
                  <button onClick={() => onEdit(item)} className="text-yellow-500">Edit</button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(item)} className="text-red-500">Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
