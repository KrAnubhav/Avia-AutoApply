import { EventEmitter } from 'events';

export const pipelineEvents = new EventEmitter();

export const emitPipelineStatus = (jobId: string, status: string, progress: number, message: string) => {
  pipelineEvents.emit(`status:${jobId}`, { status, progress, message });
};
