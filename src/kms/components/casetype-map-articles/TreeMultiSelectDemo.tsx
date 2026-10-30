import React, { useState } from 'react';
import { TreeMultiSelect } from './TreeMultiSelect';
 
export const TreeMultiSelectDemo: React.FC = () => {
  // Example 1: Controlled component with default selection
  const [selectedIds1, setSelectedIds1] = useState<string[]>([
    'tshirt',
    'mobile',
    'chair',
  ]);

  // Example 2: Controlled with many items (tag wrap & overflow test)
  const [selectedIds2, setSelectedIds2] = useState<string[]>([
    'tshirt',
    'shirt-formal',
    'pants',
    'shoes',
    'mobile',
    'tablet',
    'laptop',
    'chair',
    'table',
    'cabinet',
  ]);

  // Example 3: Disabled state
  const [selectedIds3] = useState<string[]>(['mobile', 'tablet']);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          🌲 TreeMultiSelect Component Demo
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Hierarchical Multi-Select Dropdown with search, breadcrumb tags, and indeterminate parent selection.
        </p>
      </div>

      {/* Demo Section 1: Standard Controlled Component */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            1. Controlled Multi-Select (Default: 3 items)
          </h2>
          <button
            type="button"
            onClick={() => setSelectedIds1([])}
            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium transition"
          >
            Reset Selection
          </button>
        </div>

        <div className="max-w-md">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            เลือกหมวดหมู่สินค้า
          </label>
          <TreeMultiSelect
            value={selectedIds1}
            onChange={setSelectedIds1}
            searchable
          />
        </div>

        {/* Selected IDs output display */}
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono">
          <div className="text-gray-400 mb-1 font-sans font-semibold">
            Selected IDs (Leaf Nodes only, count: {selectedIds1.length}):
          </div>
          <pre>{JSON.stringify(selectedIds1, null, 2)}</pre>
        </div>
      </div>

      {/* Demo Section 2: Uncontrolled with Default Value */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-800">
          2. Uncontrolled Component (with defaultValue for Edit page)
        </h2>

        <div className="max-w-md">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            หมวดหมู่ (Uncontrolled)
          </label>
          <TreeMultiSelect
            data={[]}
            defaultValue={['tshirt', 'shirt-formal']}
            onChange={(ids) => console.log('Uncontrolled onChange:', ids)}
          />
        </div>
      </div>

      {/* Demo Section 3: Many items with Tag wrapping */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">
            3. Many Selected Items (Tag Wrapping & +N more badge)
          </h2>
          <button
            type="button"
            onClick={() =>
              setSelectedIds2([
                'tshirt',
                'shirt-formal',
                'pants',
                'shoes',
                'mobile',
                'tablet',
                'laptop',
                'chair',
                'table',
                'cabinet',
                'lamp',
                'clock',
              ])
            }
            className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md font-medium transition"
          >
            Select All
          </button>
        </div>

        <div className="max-w-md">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Max Tag Count = 4
          </label>
          <TreeMultiSelect
            data={[]}
            value={selectedIds2}
            onChange={setSelectedIds2}
            searchable
          />
        </div>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono">
          <div className="text-gray-400 mb-1 font-sans font-semibold">
            Selected IDs (count: {selectedIds2.length}):
          </div>
          <pre>{JSON.stringify(selectedIds2, null, 2)}</pre>
        </div>
      </div>

      {/* Demo Section 4: Disabled State */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-800">
          4. Disabled State
        </h2>

        <div className="max-w-md">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Disabled Multi-Select
          </label>
          <TreeMultiSelect
            data={[]}
            value={selectedIds3}
            disabled
          />
        </div>
      </div>

      {/* Documentation & Behavior Description */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 text-xs text-blue-950 space-y-3">
        <h3 className="text-sm font-bold text-blue-900">
          💡 Parent / Child Behavior & Return Value
        </h3>
        <ul className="list-disc list-inside space-y-1 text-blue-900/90 leading-relaxed">
          <li>
            <strong>Return Value (onChange):</strong> จะ return เฉพาะ <code>Leaf Node IDs</code> เช่น <code>[&quot;tshirt&quot;, &quot;mobile&quot;]</code> เสมอ เพื่อให้ง่ายต่อการบันทึกลง Database หรือใช้งานกับ Filter API
          </li>
          <li>
            <strong>Parent Selection:</strong> เมื่อกดเลือก Parent ระบบจะเลือก Leaf Nodes ทั้งหมดภายใต้ Parent นั้นอัตโนมัติ
          </li>
          <li>
            <strong>Parent Deselection:</strong> เมื่อกดยกเลิก Parent ระบบจะยกเลิกการเลือก Leaf Nodes ทั้งหมดภายใต้นั้น
          </li>
          <li>
            <strong>Indeterminate State:</strong> ถ้าเลือก Child เพียงบางตัว Checkbox ของ Parent จะแสดงเป็นขีดกลาง (indeterminate)
          </li>
          <li>
            <strong>Search Auto-Expand:</strong> เมื่อพิมพ์คำค้นหา Parent ของรายการที่ตรงกับคำค้นหาจะคลี่ออก (Auto-expand) ให้เห็นโครงสร้างอัตโนมัติ
          </li>
        </ul>
      </div>
    </div>
  );
};
