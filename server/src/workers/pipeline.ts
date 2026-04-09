import { Worker, Job } from 'bullmq';
import { pipelineService } from '../services/pipeline';
import dotenv from 'dotenv';

dotenv.config();

const pipelineWorker = new Worker(
  'pipeline',
  async (job: Job) => {
    const { jobId, userId, url, archetype } = job.data;
    console.log(`Worker processing job ${job.id}: ${url}`);
    await pipelineService.processUrl(jobId, userId, url, archetype);
  },
  {
    connection: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
  }
);

pipelineWorker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed!`);
});

pipelineWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} has failed with ${err.message}`);
});

console.log('Pipeline worker started...');

export default pipelineWorker;
