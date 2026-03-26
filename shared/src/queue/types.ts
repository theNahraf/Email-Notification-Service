export interface EmailJobData {
  notificationId: string;
  email: string;
  templateId: string;
  subject?: string;
  payload: Record<string, any>;
  userId?: string;
  attempt?: number;
}

export interface DLQJobData extends EmailJobData {
  failureReason: string;
  originalQueue: string;
  failedAt: string;
  totalAttempts: number;
}

export interface QueueJobOptions {
  jobId?: string;
  delay?: number;
  priority?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
}
