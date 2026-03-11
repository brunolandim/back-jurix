export const DocumentSource = {
  CLIENT_REQUEST: 'client_request',
  LAWYER_UPLOAD: 'lawyer_upload',
} as const;

export type DocumentSource = (typeof DocumentSource)[keyof typeof DocumentSource];
