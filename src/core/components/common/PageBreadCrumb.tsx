import { Link } from "react-router-dom";
import { useTranslation } from "@/core/hooks/useTranslation";

interface BreadcrumbItem {
  label: string;
  href?: string;
}
interface BreadcrumbProps {
  pageTitle?: string;
  items?: BreadcrumbItem[];
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle, items }) => {
  const { t } = useTranslation();
  // If items are provided, use them; otherwise create single breadcrumb
  const breadcrumbItems: BreadcrumbItem[] = items || [
    { label: t("common.home"), href: "/" },
    { label: pageTitle || "" }
  ];

  const currentPageTitle = items ? items[items.length - 1].label : pageTitle;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h2
        className="text-xl font-semibold text-gray-800 dark:text-white/90 cursor-default"
        x-text="pageName"
      >
        {currentPageTitle}
      </h2>
      <nav>
        <ol className="flex items-center gap-1.5">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            return (
              <li key={index} className="flex items-center gap-1.5">
                {!isLast ? (
                  <>
                    <Link
                      className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      to={item.href || "/"}
                    >
                      {item.label}
                    </Link>
                    <svg
                      className="stroke-current text-gray-400"
                      width="17"
                      height="16"
                      viewBox="0 0 17 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                ) : (
                  <span className="text-sm text-gray-800 dark:text-white/90 cursor-default">
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );

  // return (
  //   <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
  //     <h2
  //       className="text-xl font-semibold text-gray-800 dark:text-white/90"
  //       x-text="pageName"
  //     >
  //       {pageTitle}
  //     </h2>
  //     <nav>
  //       <ol className="flex items-center gap-1.5">
  //         <li>
  //           <Link
  //             className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
  //             to="/"
  //           >
  //             Home
  //             <svg
  //               className="stroke-current"
  //               width="17"
  //               height="16"
  //               viewBox="0 0 17 16"
  //               fill="none"
  //               xmlns="http://www.w3.org/2000/svg"
  //             >
  //               <path
  //                 d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
  //                 stroke=""
  //                 strokeWidth="1.2"
  //                 strokeLinecap="round"
  //                 strokeLinejoin="round"
  //               />
  //             </svg>
  //           </Link>
  //         </li>
  //         <li className="text-sm text-gray-800 dark:text-white/90">
  //           {pageTitle}
  //         </li>
  //       </ol>
  //     </nav>
  //   </div>
  // );
};

export default PageBreadcrumb;
