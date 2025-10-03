import { parse } from 'csv-parse';
import { Readable } from 'stream';

export interface LeadCsvRow {
  email?: string;
  whatsapp_number?: string;
  first_name?: string;
  last_name?: string;
  tags?: string;
  opted_in?: string;
  [key: string]: string | undefined;
}

export async function parseCsv(buffer: Buffer): Promise<LeadCsvRow[]> {
  const rows: LeadCsvRow[] = [];
  const stream = Readable.from(buffer.toString());
  const parser = stream.pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true
    })
  );

  for await (const record of parser) {
    rows.push(record as LeadCsvRow);
  }

  return rows;
}
