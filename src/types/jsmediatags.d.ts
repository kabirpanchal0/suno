declare module 'jsmediatags/build2/jsmediatags' {
  export interface MediaTagPicture {
    format: string;
    type?: string;
    description?: string;
    data: number[];
  }

  export interface MediaTags {
    title?: string;
    artist?: string;
    album?: string;
    picture?: MediaTagPicture;
    [key: string]: any;
  }

  export interface MediaTagResult {
    type: string;
    version: string;
    tags: MediaTags;
  }

  export interface ReadCallbacks {
    onSuccess: (result: MediaTagResult) => void;
    onError?: (error: { type: string; info: string }) => void;
  }

  export function read(path: string, callbacks: ReadCallbacks): void;
}
