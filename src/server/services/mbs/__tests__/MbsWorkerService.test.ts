import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@/generated/prisma';
import { MbsWorkerService } from '../MbsWorkerService';
import fs from 'fs/promises';
import { createHash } from 'crypto';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('openai');

const mockFs = vi.mocked(fs);

// Mock Prisma
const mockPrisma = {
  mbsIngestionLog: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  mbsItem: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  $executeRaw: vi.fn(),
  $executeRawUnsafe: vi.fn(),
} as unknown as PrismaClient;

// Mock OpenAI
const mockOpenAI = {
  embeddings: {
    create: vi.fn(),
  },
};

vi.mock('openai', () => ({
  default: vi.fn(() => mockOpenAI),
}));

describe('MbsWorkerService', () => {
  let service: MbsWorkerService;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    service = new MbsWorkerService(mockPrisma, mockApiKey);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('ingestXmlFile', () => {
    const mockFilePath = '/test/path/mbs.xml';
    const mockFileName = 'mbs.xml';
    const mockXmlContent = `<?xml version="1.0"?>
      <MBS>
        <Items>
          <Item>
            <ItemNum>23</ItemNum>
            <Descriptor>Professional attendance by a general practitioner</Descriptor>
            <Category>1</Category>
            <ProviderType>G</ProviderType>
            <ScheduleFee>39.75</ScheduleFee>
            <Benefit75>29.80</Benefit75>
          </Item>
          <Item>
            <ItemNum>36</ItemNum>
            <Descriptor>Professional attendance by a general practitioner - longer consultation</Descriptor>
            <Category>1</Category>
            <ProviderType>G</ProviderType>
            <ScheduleFee>79.30</ScheduleFee>
            <Benefit75>59.50</Benefit75>
          </Item>
        </Items>
      </MBS>`;

    beforeEach(() => {
      mockFs.stat.mockResolvedValue({ size: 1000 } as any);
      mockFs.readFile.mockResolvedValue(mockXmlContent);
    });

    it('should successfully ingest XML file with valid data', async () => {
      const fileHash = createHash('sha256').update(mockXmlContent).digest('hex');
      
      // Mock no existing log
      mockPrisma.mbsIngestionLog.findFirst.mockResolvedValue(null);
      
      // Mock log creation
      mockPrisma.mbsIngestionLog.create.mockResolvedValue({
        id: 1,
        fileHash,
        fileName: mockFileName,
        status: 'processing',
      } as any);

      // Mock successful upserts
      mockPrisma.mbsItem.upsert.mockResolvedValue({
        id: 1,
        itemNumber: 23,
        createdAt: new Date(),
        lastUpdated: new Date(),
      } as any);

      // Mock log update
      mockPrisma.mbsIngestionLog.update.mockResolvedValue({} as any);

      const result = await service.ingestXmlFile(mockFilePath, mockFileName);

      expect(result.success).toBe(true);
      expect(result.itemsProcessed).toBe(2);
      expect(result.itemsInserted).toBe(2);
      expect(result.itemsUpdated).toBe(0);
      expect(result.itemsFailed).toBe(0);

      // Verify log creation and update
      expect(mockPrisma.mbsIngestionLog.create).toHaveBeenCalledWith({
        data: {
          fileName: mockFileName,
          fileHash,
          fileSizeBytes: BigInt(1000),
          status: 'processing',
          processorVersion: '1.0.0',
        }
      });

      expect(mockPrisma.mbsIngestionLog.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          completedAt: expect.any(Date),
          status: 'completed',
          itemsProcessed: 2,
          itemsInserted: 2,
          itemsUpdated: 0,
          itemsFailed: 0,
          processingTimeMs: expect.any(Number),
        }
      });
    });

    it('should skip processing if file already processed', async () => {
      const fileHash = createHash('sha256').update(mockXmlContent).digest('hex');
      
      // Mock existing completed log
      mockPrisma.mbsIngestionLog.findFirst.mockResolvedValue({
        id: 1,
        fileHash,
        status: 'completed',
        itemsProcessed: 2,
        itemsInserted: 2,
        itemsUpdated: 0,
        itemsFailed: 0,
        processingTimeMs: 1000,
      } as any);

      const result = await service.ingestXmlFile(mockFilePath, mockFileName);

      expect(result.success).toBe(true);
      expect(result.itemsProcessed).toBe(2);
      
      // Should not create new log or process items
      expect(mockPrisma.mbsIngestionLog.create).not.toHaveBeenCalled();
      expect(mockPrisma.mbsItem.upsert).not.toHaveBeenCalled();
    });

    it('should force reprocess when requested', async () => {
      const fileHash = createHash('sha256').update(mockXmlContent).digest('hex');
      
      // Mock existing completed log (should be ignored)
      mockPrisma.mbsIngestionLog.findFirst.mockResolvedValue({
        id: 1,
        fileHash,
        status: 'completed',
      } as any);

      // Mock new log creation
      mockPrisma.mbsIngestionLog.create.mockResolvedValue({
        id: 2,
        fileHash,
        fileName: mockFileName,
        status: 'processing',
      } as any);

      mockPrisma.mbsItem.upsert.mockResolvedValue({
        id: 1,
        itemNumber: 23,
        createdAt: new Date(),
        lastUpdated: new Date(),
      } as any);

      mockPrisma.mbsIngestionLog.update.mockResolvedValue({} as any);

      const result = await service.ingestXmlFile(mockFilePath, mockFileName, true);

      expect(result.success).toBe(true);
      expect(mockPrisma.mbsIngestionLog.create).toHaveBeenCalled();
    });

    it('should handle XML parsing errors gracefully', async () => {
      const invalidXml = 'invalid xml content';
      mockFs.readFile.mockResolvedValue(invalidXml);

      const fileHash = createHash('sha256').update(invalidXml).digest('hex');
      mockPrisma.mbsIngestionLog.findFirst.mockResolvedValue(null);
      mockPrisma.mbsIngestionLog.create.mockResolvedValue({
        id: 1,
        fileHash,
      } as any);
      mockPrisma.mbsIngestionLog.update.mockResolvedValue({} as any);

      const result = await service.ingestXmlFile(mockFilePath, mockFileName);

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBeDefined();
      
      // Should update log with error
      expect(mockPrisma.mbsIngestionLog.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'failed',
          errorMessage: expect.any(String),
        })
      });
    });
  });

  describe('generateEmbeddings', () => {
    beforeEach(() => {
      mockPrisma.mbsItem.findMany.mockResolvedValue([
        {
          id: 1,
          itemNumber: 23,
          description: 'Professional attendance by a general practitioner',
          category: '1',
          groupName: 'Consultations',
          serviceType: 'GP',
        },
        {
          id: 2,
          itemNumber: 36,
          description: 'Professional attendance by a general practitioner - longer consultation',
          category: '1',
          groupName: 'Consultations',
          serviceType: 'GP',
        },
      ] as any);
    });

    it('should successfully generate embeddings for items', async () => {
      // Mock OpenAI response
      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [
          { embedding: [0.1, 0.2, 0.3] },
          { embedding: [0.4, 0.5, 0.6] },
        ],
      });

      mockPrisma.$executeRaw.mockResolvedValue(undefined);

      const result = await service.generateEmbeddings();

      expect(result.success).toBe(true);
      expect(result.itemsUpdated).toBe(2);
      expect(result.itemsFailed).toBe(0);

      // Verify OpenAI API call
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-large',
        input: [
          'MBS Item 23: Professional attendance by a general practitioner 1 Consultations GP',
          'MBS Item 36: Professional attendance by a general practitioner - longer consultation 1 Consultations GP',
        ],
        encoding_format: 'float',
      });

      // Verify database updates
      expect(mockPrisma.$executeRaw).toHaveBeenCalledTimes(2);
    });

    it('should handle OpenAI API failures gracefully', async () => {
      mockOpenAI.embeddings.create.mockRejectedValue(new Error('API Error'));

      const result = await service.generateEmbeddings();

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('API Error');
    });

    it('should process specific item IDs when provided', async () => {
      const itemIds = [1];
      
      mockPrisma.mbsItem.findMany.mockResolvedValue([
        {
          id: 1,
          itemNumber: 23,
          description: 'Professional attendance by a general practitioner',
          category: '1',
        },
      ] as any);

      mockOpenAI.embeddings.create.mockResolvedValue({
        data: [{ embedding: [0.1, 0.2, 0.3] }],
      });

      mockPrisma.$executeRaw.mockResolvedValue(undefined);

      const result = await service.generateEmbeddings(itemIds);

      expect(result.success).toBe(true);
      expect(mockPrisma.mbsItem.findMany).toHaveBeenCalledWith({
        where: { id: { in: itemIds } },
        select: expect.any(Object),
      });
    });
  });

  describe('updateSearchVectors', () => {
    it('should update search vectors for all items', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(5);

      const result = await service.updateSearchVectors();

      expect(result.success).toBe(true);
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE mbs.items'),
      );
    });

    it('should update search vectors for specific items', async () => {
      const itemIds = [1, 2, 3];
      mockPrisma.$executeRawUnsafe.mockResolvedValue(3);

      const result = await service.updateSearchVectors(itemIds);

      expect(result.success).toBe(true);
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = ANY($1)'),
        itemIds
      );
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.$executeRawUnsafe.mockRejectedValue(new Error('Database Error'));

      const result = await service.updateSearchVectors();

      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('Database Error');
    });
  });

  describe('XML transformation', () => {
    it('should correctly transform XML item data', async () => {
      const mockXmlContent = `<?xml version="1.0"?>
        <MBS>
          <Items>
            <Item>
              <ItemNum>23</ItemNum>
              <Descriptor>Professional attendance by a general practitioner</Descriptor>
              <Category>1</Category>
              <ProviderType>G</ProviderType>
              <ScheduleFee>39.75</ScheduleFee>
              <Benefit75>29.80</Benefit75>
              <HasAnaesthetic>N</HasAnaesthetic>
              <ItemStartDate>01.01.2023</ItemStartDate>
            </Item>
          </Items>
        </MBS>`;

      mockFs.stat.mockResolvedValue({ size: 1000 } as any);
      mockFs.readFile.mockResolvedValue(mockXmlContent);
      mockPrisma.mbsIngestionLog.findFirst.mockResolvedValue(null);
      mockPrisma.mbsIngestionLog.create.mockResolvedValue({ id: 1 } as any);
      mockPrisma.mbsIngestionLog.update.mockResolvedValue({} as any);

      // Capture the upsert call to verify transformation
      let capturedData: any;
      mockPrisma.mbsItem.upsert.mockImplementation((args: any) => {
        capturedData = args.create;
        return Promise.resolve({
          id: 1,
          itemNumber: 23,
          createdAt: new Date(),
          lastUpdated: new Date(),
        });
      });

      await service.ingestXmlFile('/test/path', 'test.xml');

      expect(capturedData).toEqual(expect.objectContaining({
        itemNumber: 23,
        description: 'Professional attendance by a general practitioner',
        category: '1',
        providerType: 'G',
        scheduleFee: 39.75,
        benefit75: 29.80,
        hasAnaesthetic: false,
        itemStartDate: expect.any(Date),
        isActive: true,
      }));
    });
  });
});