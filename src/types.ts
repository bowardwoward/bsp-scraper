export interface IssuanceItem {
  "odata.type": string;
  "odata.id": string;
  "odata.etag": string;
  "odata.editLink": string;
  FileSystemObjectType: number;
  Id: number;
  ServerRedirectedEmbedUri: string | null;
  ServerRedirectedEmbedUrl: string;
  ContentTypeId: string;
  Title: string;
  OData__ModerationComments: string | null;
  ComplianceAssetId: string | null;
  IssuanceID: string | null;
  IssuanceType: string;
  DateIssued: string;
  CircularNumber: string;
  Control: string | null;
  Content: string;
  Status: string;
  Modified: string;
  OData__ModerationStatus: number;
  ID: number;
  Created: string;
  AuthorId: number;
  EditorId: number;
  OData__UIVersionString: string;
  Attachments: boolean;
  GUID: string;
}

export interface ApiResponse {
  value: IssuanceItem[];
  "odata.nextLink"?: string;
}

export interface ExtractedIssuance {
  id: number;
  title: string;
  circularNumber: string;
  issuanceType: string;
  dateIssued: string;
  downloadLink: string | null;
}

export interface ScraperOptions {
  baseUrl?: string;
  chunkSize?: number;
  yearStart?: number;
  yearEnd?: number;
  maxChunks?: number;
}
