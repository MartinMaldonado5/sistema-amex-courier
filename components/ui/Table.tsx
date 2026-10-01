import React from 'react';

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className = '', containerClassName = '', children, ...props }, ref) => (
    <div className={`w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs ${containerClassName}`}>
      <table ref={ref} className={`w-full caption-bottom text-xs text-left border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  )
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className = '', ...props }, ref) => (
  <thead ref={ref} className={`bg-slate-50 border-b border-slate-200 text-slate-700 font-bold ${className}`} {...props} />
));
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className = '', ...props }, ref) => (
  <tbody ref={ref} className={`divide-y divide-slate-100 ${className}`} {...props} />
));
TableBody.displayName = 'TableBody';

export const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className = '', ...props }, ref) => (
  <tfoot ref={ref} className={`bg-slate-50 font-medium text-slate-600 border-t border-slate-200 ${className}`} {...props} />
));
TableFooter.displayName = 'TableFooter';

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className = '', ...props }, ref) => (
  <tr
    ref={ref}
    className={`transition-colors hover:bg-slate-50/80 data-[state=selected]:bg-slate-100 ${className}`}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className = '', ...props }, ref) => (
  <th
    ref={ref}
    className={`h-10 px-3 text-left align-middle font-bold text-slate-600 [&:has([role=checkbox])]:pr-0 ${className}`}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className = '', ...props }, ref) => (
  <td
    ref={ref}
    className={`p-3 align-middle text-slate-800 [&:has([role=checkbox])]:pr-0 ${className}`}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

export default Table;
