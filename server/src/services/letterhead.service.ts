import { BaseDBAdapter } from '../db';
import { BaseStorageAdapter } from '../storage';
import { DepartmentRepository } from '../repositories/department.repository';
import { LetterheadRepository } from '../repositories/letterhead.repository';
import { AuditRepository } from '../repositories/audit.repository';
import {
  LetterheadWithDetails,
  LetterheadFilter,
  PaginatedResult,
  AuthPayload,
  LetterheadVersionWithDetails,
  UpdateLetterheadInput,
} from '../types';
import { NotFoundError, ForbiddenError, ValidationError } from '../errors/AppError';

type UploadedPdf = { originalname: string; buffer: Buffer; size: number; mimetype: string };

export class LetterheadService {
  constructor(
    private db: BaseDBAdapter,
    private letterheadRepo: LetterheadRepository,
    private deptRepo: DepartmentRepository,
    private auditRepo: AuditRepository,
    private storage: BaseStorageAdapter
  ) {}

  private formatReference(prefix: string, sequence: number): string {
    return `${prefix}-${String(sequence).padStart(5, '0')}`;
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (value === undefined || value === null) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private ensureEditAccess(letterhead: LetterheadWithDetails, user: AuthPayload) {
    if (Number(letterhead.created_by) !== Number(user.userId)) {
      throw new ForbiddenError('You can only edit letters you created');
    }
  }

  async create(
    departmentId: number,
    letterDate: string,
    approvalAuthority: string,
    description: string | null,
    notes: string | null,
    iomNumber: string | null,
    file: UploadedPdf,
    user: AuthPayload
  ): Promise<LetterheadWithDetails> {
    if (user.role === 'department_user' && Number(user.departmentId) !== Number(departmentId)) {
      throw new ForbiddenError('You can only register letterheads for your own department');
    }

    if (!file?.buffer) {
      throw new ValidationError('PDF file is required');
    }

    const cleanDescription = description?.trim();
    if (!cleanDescription) {
      throw new ValidationError('Description is required');
    }

    const cleanApprovalAuthority = approvalAuthority.trim();
    if (!cleanApprovalAuthority) {
      throw new ValidationError('Approval authority is required');
    }

    const letterhead = await this.db.transaction(async (txDb) => {
      const { prefix, sequence } = await this.deptRepo.getNextSequence(departmentId, txDb);
      const referenceNumber = this.formatReference(prefix, sequence);

      const dept = await this.deptRepo.findById(departmentId);
      if (!dept) throw new NotFoundError('Department not found');

      const storedFileName = `${referenceNumber}.pdf`;
      const filePath = await this.storage.save(
        { departmentCode: dept.code, letterDate, approvalAuthority: cleanApprovalAuthority },
        storedFileName,
        file.buffer
      );

      return this.letterheadRepo.create(
        {
          department_id: departmentId,
          reference_number: referenceNumber,
          letter_date: new Date(letterDate),
          approval_authority: cleanApprovalAuthority,
          description: cleanDescription,
          notes: this.normalizeOptionalText(notes),
          iom_number: this.normalizeOptionalText(iomNumber),
          file_name: file.originalname,
          file_path: filePath,
          file_size_bytes: file.size,
          mime_type: file.mimetype,
          created_by: user.userId,
        },
        txDb
      );
    });

    await this.auditRepo.log('letterhead', letterhead.id, 'create', user.userId, `Registered letterhead ${letterhead.reference_number}`);
    return (await this.letterheadRepo.findById(letterhead.id))!;
  }

  async getById(id: number, user: AuthPayload): Promise<LetterheadWithDetails> {
    const letterhead = await this.letterheadRepo.findById(id);
    if (!letterhead) throw new NotFoundError('Letterhead not found');

    if (user.role === 'department_user' && Number(letterhead.department_id) !== Number(user.departmentId)) {
      throw new ForbiddenError('Access denied');
    }

    await this.auditRepo.log('letterhead', id, 'view', user.userId);
    return letterhead;
  }

  async getList(filter: LetterheadFilter, user: AuthPayload): Promise<PaginatedResult<LetterheadWithDetails>> {
    const scopedDeptId = user.role === 'department_user' ? user.departmentId! : undefined;
    return this.letterheadRepo.findFiltered(filter, scopedDeptId);
  }

  async downloadFile(id: number, user: AuthPayload): Promise<{ stream: NodeJS.ReadableStream; fileName: string; mimeType: string }> {
    const letterhead = await this.getById(id, user);
    await this.auditRepo.log('letterhead', id, 'download', user.userId);

    return {
      stream: await this.storage.getReadStream(letterhead.file_path),
      fileName: letterhead.file_name,
      mimeType: letterhead.mime_type,
    };
  }

  async getExportData(filter: LetterheadFilter, user: AuthPayload): Promise<LetterheadWithDetails[]> {
    const scopedDeptId = user.role === 'department_user' ? user.departmentId! : undefined;
    return this.letterheadRepo.findAllFiltered(filter, scopedDeptId);
  }

  async update(id: number, input: UpdateLetterheadInput, file: UploadedPdf | undefined, user: AuthPayload): Promise<LetterheadWithDetails> {
    const existing = await this.letterheadRepo.findById(id);
    if (!existing) throw new NotFoundError('Letterhead not found');

    const justification = input.justification.trim();
    if (!justification) throw new ValidationError('Modification justification is required');

    const description = input.description.trim();
    if (!description) throw new ValidationError('Description is required');

    const approvalAuthority = input.approvalAuthority.trim();
    if (!approvalAuthority) throw new ValidationError('Approval authority is required');

    this.ensureEditAccess(existing, user);

    const department = await this.deptRepo.findById(input.departmentId);
    if (!department) throw new NotFoundError('Department not found');

    const nextNotes = this.normalizeOptionalText(input.notes);
    const nextIomNumber = this.normalizeOptionalText(input.iomNumber);
    const changedFields: string[] = [];

    if (existing.department_id !== input.departmentId) changedFields.push('department');
    if (new Date(existing.letter_date).toISOString().slice(0, 10) !== input.letterDate) changedFields.push('letter date');
    if (existing.approval_authority !== approvalAuthority) changedFields.push('approval authority');
    if ((existing.description || '') !== description) changedFields.push('description');
    if ((existing.notes || null) !== nextNotes) changedFields.push('notes');
    if ((existing.iom_number || null) !== nextIomNumber) changedFields.push('IOM number');
    if (file) changedFields.push('attachment');

    if (changedFields.length === 0) {
      throw new ValidationError('No changes were provided');
    }

    const changeSummary = `Updated ${changedFields.join(', ')}`;

    await this.db.transaction(async (txDb) => {
      let filePath = existing.file_path;
      let fileName = existing.file_name;
      let fileSizeBytes = existing.file_size_bytes;
      let mimeType = existing.mime_type;
      let archivedFilePath: string | null = null;

      if (file) {
        archivedFilePath = await this.storage.archive(existing.file_path);
        const storedFileName = `${existing.reference_number}.pdf`;
        filePath = await this.storage.save(
          {
            departmentCode: department.code,
            letterDate: input.letterDate,
            approvalAuthority,
          },
          storedFileName,
          file.buffer
        );
        fileName = file.originalname;
        fileSizeBytes = file.size;
        mimeType = file.mimetype;
      }

      await this.letterheadRepo.update(
        id,
        {
          department_id: input.departmentId,
          letter_date: new Date(input.letterDate),
          approval_authority: approvalAuthority,
          description,
          notes: nextNotes,
          iom_number: nextIomNumber,
          file_name: fileName,
          file_path: filePath,
          file_size_bytes: fileSizeBytes,
          mime_type: mimeType,
          updated_by: user.userId,
        },
        user.userId,
        changeSummary,
        justification,
        archivedFilePath,
        txDb
      );
    });

    await this.auditRepo.log('letterhead', id, 'update', user.userId, `${changeSummary} | Justification: ${justification}`);
    return (await this.letterheadRepo.findById(id))!;
  }

  async getVersionHistory(id: number, user: AuthPayload): Promise<LetterheadVersionWithDetails[]> {
    await this.getById(id, user);
    return this.letterheadRepo.getVersionHistory(id);
  }

  async getNextReference(departmentId: number): Promise<string> {
    const { prefix, sequence } = await this.deptRepo.peekNextSequence(departmentId);
    return this.formatReference(prefix, sequence);
  }

}
