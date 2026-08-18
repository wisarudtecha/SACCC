import ComponentCard from "@/core/components/common/ComponentCard";
import PageBreadcrumb from "@/core/components/common/PageBreadCrumb";
import PageMeta from "@/core/components/common/PageMeta";
import Button from "@/core/components/ui/button/Button";
import { BoxIcon } from "@/core/icons";
import { capitalizeWords } from "@/core/utils/stringFormatters";

export default function ButtonsCustomize() {
  const variantClasses: Array<
    | "primary"
    | "success"
    | "error"
    | "warning"
    | "info"
    | "light"
    | "dark"
    | "outline"
    | "outline-primary"
    | "outline-success"
    | "outline-error"
    | "outline-warning"
    | "outline-info"
    | "ghost"
    | "ghost-primary"
    | "ghost-success"
    | "ghost-error"
    | "ghost-warning"
    | "ghost-info"
  > = [
    "primary",
    "success",
    "error",
    "warning",
    "info",
    "light",
    "dark",
    "outline",
    "outline-primary",
    "outline-success",
    "outline-error",
    "outline-warning",
    "outline-info",
    "ghost",
    "ghost-primary",
    "ghost-success",
    "ghost-error",
    "ghost-warning",
    "ghost-info"
  ];
  const sizeClasses: Array<
    | "xs"
    | "sm"
    | "md"
    | "lg"
  > = [
    "xs",
    "sm",
    "md",
    "lg"
  ];

  // const capitalizeWords = (str: string) => {
  //   return str.replace(/\b\w/g, (char: string) => char.toUpperCase());
  // }

  const componentCard: React.ReactNode[] = [];
  let button: React.ReactNode[] = [];
  for (let index = 0; index <= 2; index++) {
    variantClasses.forEach(variant => {
      button = [];
      sizeClasses.forEach(size => {
        if (index === 1) {
          button.push(<Button size={size} variant={variant} startIcon={<BoxIcon className="size-5" />}>{variant}</Button>);
        }
        else if (index === 2) {
          button.push(<Button size={size} variant={variant} endIcon={<BoxIcon className="size-5" />}>{variant}</Button>);
        }
        else {
          button.push(<Button size={size} variant={variant}>{variant}</Button>);
        }
      });
      const iconPos = `${index === 1 ? "with Left Icon" : index === 2 ? "with Right Icon" : ""}`;
      componentCard.push(
        <ComponentCard title={`${capitalizeWords(variant)} Button ${iconPos}`}>
          <div className="flex items-center gap-5">{button}</div>
        </ComponentCard>
      );
    });
  }

  return (
    <div>
      <PageMeta
        title="React.js Buttons Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Buttons Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Buttons" />
      <div className="space-y-5 sm:space-y-6">
        {componentCard}
      </div>
    </div>
  );
}
