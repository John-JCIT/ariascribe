import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MbsQueueService } from '../MbsQueueService';
import { Queue } from 'bullmq';

// Mock BullMQ
vi.mock('bullmq');
vi.mock('@/server/instrumentation/bull/connection');

const mockQueue = {
  add: vi.fn(),
  getJob: vi.fn(),
  getWaiting: vi.fn(),
  getActive: vi.fn(),
  getCompleted: vi.fn(),
  getFailed: vi.fn(),
  clean: vi.fn(),
} as unknown as Queue;

const MockQueue = vi.mocked(Queue);
MockQueue.mockImplementation(() => mockQueue);

describe('MbsQueueService', () => {
  let service: MbsQueueService;

  beforeEach(() => {
    service = new MbsQueueService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('queueXmlIngestion', () => {
    it('should queue XML ingestion job with correct parameters', async () => {
      const mockJob = { id: 'job-123' };
      mockQueue.add.mockResolvedValue(mockJob as any);

      const data = {
        filePath: '/test/path/mbs.xml',
        fileName: 'mbs.xml',
        forceReprocess: false,
      };

      const jobId = await service.queueXmlIngestion(data);

      expect(jobId).toBe('job-123');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'mbs-ingest-xml',
        data,
        expect.objectContaining({
          priority: 0,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 10,
          removeOnFail: 50,
        })
      );
    });

    it('should queue with custom priority', async () => {
      const mockJob = { id: 'job-456' };
      mockQueue.add.mockResolvedValue(mockJob as any);

      const data = {
        filePath: '/test/path/mbs.xml',
        fileName: 'mbs.xml',
      };

      await service.queueXmlIngestion(data, 5);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'mbs-ingest-xml',
        data,
        expect.objectContaining({
          priority: 5,
        })
      );
    });
  });

  describe('queueEmbeddingGeneration', () => {
    it('should queue embedding generation job', async () => {
      const mockJob = { id: 'job-789' };
      mockQueue.add.mockResolvedValue(mockJob as any);

      const data = {
        itemIds: [1, 2, 3],
        batchSize: 50,
      };

      const jobId = await service.queueEmbeddingGeneration(data);

      expect(jobId).toBe('job-789');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'mbs-generate-embeddings',
        data,
        expect.objectContaining({
          priority: 0,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        })
      );
    });
  });

  describe('queueSearchVectorUpdate', () => {
    it('should queue search vector update job', async () => {
      const mockJob = { id: 'job-abc' };
      mockQueue.add.mockResolvedValue(mockJob as any);

      const data = { itemIds: [1, 2, 3] };

      const jobId = await service.queueSearchVectorUpdate(data);

      expect(jobId).toBe('job-abc');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'mbs-update-search-vectors',
        data,
        expect.objectContaining({
          priority: 0,
          attempts: 2,
        })
      );
    });
  });

  describe('getJobStatus', () => {
    it('should return job status when job exists', async () => {
      const mockJob = {
        id: 'job-123',
        name: 'mbs-ingest-xml',
        data: { fileName: 'test.xml' },
        progress: 50,
        returnvalue: null,
        failedReason: null,
        processedOn: Date.now(),
        finishedOn: null,
        opts: {},
      };

      mockQueue.getJob.mockResolvedValue(mockJob as any);

      const status = await service.getJobStatus('job-123');

      expect(status).toEqual({
        id: 'job-123',
        name: 'mbs-ingest-xml',
        data: { fileName: 'test.xml' },
        progress: 50,
        returnvalue: null,
        failedReason: null,
        processedOn: mockJob.processedOn,
        finishedOn: null,
        opts: {},
      });
    });

    it('should return null when job does not exist', async () => {
      mockQueue.getJob.mockResolvedValue(null);

      const status = await service.getJobStatus('non-existent');

      expect(status).toBeNull();
    });
  });

  describe('getQueueStats', () => {
    it('should return queue statistics', async () => {
      mockQueue.getWaiting.mockResolvedValue([1, 2]);
      mockQueue.getActive.mockResolvedValue([3]);
      mockQueue.getCompleted.mockResolvedValue([4, 5, 6]);
      mockQueue.getFailed.mockResolvedValue([7]);

      const stats = await service.getQueueStats();

      expect(stats).toEqual({
        waiting: 2,
        active: 1,
        completed: 3,
        failed: 1,
        total: 7,
      });
    });
  });

  describe('queueFullIngestionPipeline', () => {
    it('should queue all three pipeline jobs', async () => {
      mockQueue.add
        .mockResolvedValueOnce({ id: 'xml-job' } as any)
        .mockResolvedValueOnce({ id: 'embedding-job' } as any)
        .mockResolvedValueOnce({ id: 'vector-job' } as any);

      const result = await service.queueFullIngestionPipeline(
        '/test/path/mbs.xml',
        'mbs.xml',
        false
      );

      expect(result).toEqual({
        xmlJobId: 'xml-job',
        embeddingJobId: 'embedding-job',
        vectorJobId: 'vector-job',
      });

      expect(mockQueue.add).toHaveBeenCalledTimes(3);
      
      // Verify job priorities
      expect(mockQueue.add).toHaveBeenNthCalledWith(
        1,
        'mbs-ingest-xml',
        expect.any(Object),
        expect.objectContaining({ priority: 10 })
      );
      expect(mockQueue.add).toHaveBeenNthCalledWith(
        2,
        'mbs-generate-embeddings',
        expect.any(Object),
        expect.objectContaining({ priority: 5 })
      );
      expect(mockQueue.add).toHaveBeenNthCalledWith(
        3,
        'mbs-update-search-vectors',
        expect.any(Object),
        expect.objectContaining({ priority: 1 })
      );
    });
  });

  describe('cleanJobs', () => {
    it('should clean old completed and failed jobs', async () => {
      mockQueue.clean.mockResolvedValue(undefined);

      await service.cleanJobs();

      expect(mockQueue.clean).toHaveBeenCalledTimes(2);
      expect(mockQueue.clean).toHaveBeenCalledWith(
        24 * 60 * 60 * 1000, // 24 hours
        100,
        'completed'
      );
      expect(mockQueue.clean).toHaveBeenCalledWith(
        7 * 24 * 60 * 60 * 1000, // 7 days
        100,
        'failed'
      );
    });
  });
});