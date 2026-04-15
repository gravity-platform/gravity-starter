export interface SendObjectConfig {
  data: any;
  objectId?: string;
}

export interface SendObjectOutput {
  __outputs: {
    id: string;
    data: any;
  };
}
