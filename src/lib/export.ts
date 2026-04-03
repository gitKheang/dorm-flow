export type ExportFormat = "csv" | "pdf";

export interface ExportColumn<Row> {
  key: string;
  label: string;
  accessor: (row: Row) => string | number | boolean | null | undefined;
}

function formatExportValue(
  value: string | number | boolean | null | undefined,
): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function escapeCsvValue(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function toCsv<Row>(rows: Row[], columns: ExportColumn<Row>[]) {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(",");
  const body = rows.map((row) =>
    columns
      .map((column) =>
        escapeCsvValue(formatExportValue(column.accessor(row))),
      )
      .join(","),
  );

  return [header, ...body].join("\n");
}

export function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportRowsToCsv<Row>(
  filename: string,
  rows: Row[],
  columns: ExportColumn<Row>[],
) {
  downloadCsv(filename, toCsv(rows, columns));
}

export function openPrintableExport<Row>(params: {
  title: string;
  subtitle?: string;
  rows: Row[];
  columns: ExportColumn<Row>[];
}) {
  const popup = window.open("", "_blank", "noopener,noreferrer,width=1100,height=800");
  if (!popup) {
    throw new Error("Allow pop-ups to print the PDF export.");
  }

  const tableHead = params.columns
    .map(
      (column) =>
        `<th style="padding:10px 12px;border:1px solid #d7dce2;text-align:left;background:#f5f7fa;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">${escapeHtml(column.label)}</th>`,
    )
    .join("");
  const tableRows = params.rows
    .map((row) => {
      const cells = params.columns
        .map((column) => {
          const value = formatExportValue(column.accessor(row));
          return `<td style="padding:10px 12px;border:1px solid #e5e7eb;font-size:13px;vertical-align:top;">${escapeHtml(
            value,
          )}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  popup.document.write(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(params.title)}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 32px;
        color: #111827;
      }
      h1 {
        margin: 0;
        font-size: 24px;
      }
      p {
        margin: 8px 0 0;
        color: #4b5563;
        font-size: 13px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 24px;
      }
      @media print {
        body {
          margin: 20px;
        }
      }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(params.title)}</h1>
    ${
      params.subtitle
        ? `<p>${escapeHtml(params.subtitle)}</p>`
        : ""
    }
    <table>
      <thead>
        <tr>${tableHead}</tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    <script>
      window.addEventListener("load", () => {
        window.print();
      });
    </script>
  </body>
</html>`);
  popup.document.close();
}
