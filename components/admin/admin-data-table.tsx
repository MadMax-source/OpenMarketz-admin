import type { ReactNode } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export interface AdminColumn<T> {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  className?: string
  headerClassName?: string
}

interface AdminDataTableProps<T> {
  caption: string
  columns: AdminColumn<T>[]
  rows: T[]
  getRowId: (row: T) => string
  renderMobileCard?: (row: T) => ReactNode
}

export function AdminDataTable<T>({ caption, columns, rows, getRowId, renderMobileCard }: AdminDataTableProps<T>) {
  return (
    <>
      <div className={cn("overflow-hidden rounded-xl border bg-card", renderMobileCard && "hidden md:block")}>
        <Table>
          <TableCaption className="sr-only">{caption}</TableCaption>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {columns.map((column) => (
                <TableHead key={column.id} scope="col" className={cn("h-10 px-4", column.headerClassName)}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={getRowId(row)}>
                {columns.map((column) => (
                  <TableCell key={column.id} className={cn("px-4 py-3", column.className)}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {renderMobileCard && (
        <ul className="flex flex-col gap-3 md:hidden" aria-label={caption}>
          {rows.map((row) => (
            <li key={getRowId(row)}>{renderMobileCard(row)}</li>
          ))}
        </ul>
      )}
    </>
  )
}
