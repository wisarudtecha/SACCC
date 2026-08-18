// /src/components/widgets/TableWidget.tsx
import
  React
  // ,
  // {
  //   useState,
  //   useEffect
  // }
from "react";
import type { DashboardWidget } from "@/core/types/dashboard";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/core/components/ui/table";
// import Badge from "@/core/components/ui/badge/Badge";
import Button from "@/core/components/ui/button/Button";
// import { Table as TableIcon } from "lucide-react";

export const TableWidget: React.FC<{ widget: DashboardWidget }> = ({ widget }) => {
  // const [data, setData] = useState([
  //   { id: '#001', title: 'Login Issue', status: 'Open', priority: 'High', assignee: 'John Doe' },
  //   { id: '#002', title: 'Bug Report', status: 'In Progress', priority: 'Medium', assignee: 'Jane Smith' },
  //   { id: '#003', title: 'Feature Request', status: 'Resolved', priority: 'Low', assignee: 'Bob Wilson' },
  //   { id: '#004', title: 'Performance Issue', status: 'Open', priority: 'High', assignee: 'Alice Brown' }
  // ]);

  // Updated: [07-07-2025] v0.1.1
  const data = [
    { id: '#001', product: 'MacBook Pro 13"', category: 'Laptop', price: '$2399.00', status: 'Delivered', variant: '2 Variants' },
    { id: '#002', product: 'Apple Watch Ultra', category: 'Watch', price: '$879.00', status: 'Pending', variant: '1 Variant' },
    { id: '#003', product: 'iPhone 15 Pro Max', category: 'SmartPhone', price: '$1569.00', status: 'Delivered', variant: '2 Variants' },
    { id: '#004', product: 'iPad Pro 3rd Gen', category: 'Electronics', price: '$1699.00', status: 'Cancelled', variant: '2 Variants' },
    { id: '#005', product: 'AirPods Pro 2nd Gen', category: 'Accessories', price: '$249.00', status: 'Delivered', variant: '1 Variant' }
  ];

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setData(prev => prev.map(item => ({
  //       ...item,
  //       status: Math.random() > 0.8 ? 
  //         ['Open', 'In Progress', 'Resolved'][Math.floor(Math.random() * 3)] : 
  //         item.status
  //     })));
  //   }, widget.config.refreshInterval || 30000);
  //   return () => clearInterval(interval);
  // }, [widget.config.refreshInterval]);

  // const getStatusBadge = (status: string) => {
  //   const colors = {
  //     'Open': 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100',
  //     'In Progress': 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100',
  //     'Resolved': 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100'
  //   };
  //   return colors[status as keyof typeof colors] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100';
  // };

  // Updated: [07-07-2025] v0.1.1
  const getStatusBadge = (status: string) => {
    const colors = {
      'Delivered': 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100',
      'Pending': 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100',
      'Cancelled': 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100';
  };

  return (
    // Updated: [07-07-2025] v0.1.1
    <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{widget.title}</h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="xs"
          >
            Filter
          </Button>
          <Button
            variant="primary"
            size="xs"
          >
            See all
          </Button>
        </div>
      </div>
      <div className="overflow-hidden">
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow className="border-b border-gray-200 dark:border-gray-700">
              <TableCell isHeader className="text-left py-2 text-gray-600 dark:text-gray-300 font-medium">Products</TableCell>
              <TableCell isHeader className="text-left py-2 text-gray-600 dark:text-gray-300 font-medium">Category</TableCell>
              <TableCell isHeader className="text-left py-2 text-gray-600 dark:text-gray-300 font-medium">Price</TableCell>
              <TableCell isHeader className="text-left py-2 text-gray-600 dark:text-gray-300 font-medium">Status</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 4).map((item, index) => (
              <TableRow key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800">
                <TableCell className="py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                      <span className="text-xs">{item.product.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.product}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.variant}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-gray-600 dark:text-gray-300">{item.category}</TableCell>
                <TableCell className="py-3 font-medium text-gray-900 dark:text-white">{item.price}</TableCell>
                <TableCell className="py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>

    // <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
    //   <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
    //     <div>
    //       <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
    //         {widget.title}
    //       </h3>
    //     </div>
    //     <div className="flex items-center gap-3">
    //       <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
    //         <svg
    //           className="stroke-current fill-white dark:fill-gray-800"
    //           width="20"
    //           height="20"
    //           viewBox="0 0 20 20"
    //           fill="none"
    //           xmlns="http://www.w3.org/2000/svg"
    //         >
    //           <path
    //             d="M2.29004 5.90393H17.7067"
    //             stroke=""
    //             strokeWidth="1.5"
    //             strokeLinecap="round"
    //             strokeLinejoin="round"
    //           />
    //           <path
    //             d="M17.7075 14.0961H2.29085"
    //             stroke=""
    //             strokeWidth="1.5"
    //             strokeLinecap="round"
    //             strokeLinejoin="round"
    //           />
    //           <path
    //             d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
    //             fill=""
    //             stroke=""
    //             strokeWidth="1.5"
    //           />
    //           <path
    //             d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
    //             fill=""
    //             stroke=""
    //             strokeWidth="1.5"
    //           />
    //         </svg>
    //         Filter
    //       </button>
    //       <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
    //         See all
    //       </button>
    //     </div>
    //   </div>
    //   <div className="max-w-full overflow-x-auto">
    //     <Table>
    //       {/* Table Header */}
    //       <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
    //         <TableRow>
    //           <TableCell
    //             isHeader
    //             className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
    //           >
    //             ID
    //           </TableCell>
    //           <TableCell
    //             isHeader
    //             className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
    //           >
    //             Title
    //           </TableCell>
    //           <TableCell
    //             isHeader
    //             className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
    //           >
    //             Status
    //           </TableCell>
    //         </TableRow>
    //       </TableHeader>
    //       {/* Table Body */}
    //       <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
    //         {data.slice(0, 4).map((item, index) => (
    //           <TableRow key={index} className="">
    //             <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
    //               {item.id}
    //             </TableCell>
    //             <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
    //               {item.title}
    //             </TableCell>
    //             <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
    //               <Badge
    //                 size="sm"
    //                 color={
    //                   item.status === "Resolved"
    //                     ? "success"
    //                     : item.status === "In Progress"
    //                     ? "warning"
    //                     : "error"
    //                 }
    //               >
    //                 {item.status}
    //               </Badge>
    //             </TableCell>
    //           </TableRow>
    //         ))}
    //       </TableBody>
    //     </Table>
    //   </div>
    // </div>

    // <div className="h-full bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
    //   <div className="flex items-center justify-between mb-4">
    //     <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{widget.title}</h3>
    //     <TableIcon className="h-4 w-4 text-purple-500 dark:text-purple-400" />
    //   </div>
    //   <div className="overflow-hidden">
    //     <Table className="w-full text-sm">
    //       <TableHeader>
    //         <TableRow className="border-b border-gray-200 dark:border-gray-700">
    //           <TableCell isHeader className="text-left py-2 text-gray-600 dark:text-gray-300 font-medium">ID</TableCell>
    //           <TableCell isHeader className="text-left py-2 text-gray-600 dark:text-gray-300 font-medium">Title</TableCell>
    //           <TableCell isHeader className="text-left py-2 text-gray-600 dark:text-gray-300 font-medium">Status</TableCell>
    //         </TableRow>
    //       </TableHeader>
    //       <TableBody>
    //         {data.slice(0, 4).map((item, index) => (
    //           <TableRow key={index} className="border-b border-gray-100 hover:bg-gray-200 dark:border-gray-800 dark:hover:bg-gray-900">
    //             <TableCell className="py-2 font-mono text-xs dark:text-white">{item.id}</TableCell>
    //             <TableCell className="py-2 truncate dark:text-white">{item.title}</TableCell>
    //             <TableCell className="py-2">
    //               <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
    //                 {item.status}
    //               </span>
    //             </TableCell>
    //           </TableRow>
    //         ))}
    //       </TableBody>
    //     </Table>
    //   </div>
    // </div>
  );
};
