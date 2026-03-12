import { Request, Response, NextFunction } from 'express';
import ExcelJS from 'exceljs';
import { LetterheadService } from '../services/letterhead.service';
import { ValidationError } from '../errors/AppError';
import { assertPdfSignature } from '../middleware/upload';

export class LetterheadController {
  constructor(private letterheadService: LetterheadService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { departmentId, letterDate, approvalAuthority, description, notes } = req.body;

      if (!departmentId || !letterDate || !approvalAuthority || !description) {
        throw new ValidationError('departmentId, letterDate, approvalAuthority, and description are required');
      }

      if (!req.file) {
        throw new ValidationError('PDF file is required');
      }

      assertPdfSignature(req.file);

      const letterhead = await this.letterheadService.create(
        parseInt(departmentId),
        letterDate,
        approvalAuthority,
        description || null,
        notes || null,
        req.file,
        req.user!
      );
      res.status(201).json(letterhead);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const letterhead = await this.letterheadService.getById(
        parseInt(req.params.id),
        req.user!
      );
      res.json(letterhead);
    } catch (err) {
      next(err);
    }
  };

  getList = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filter = {
        departmentId: req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        approvalAuthority: req.query.approvalAuthority as string,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };
      const result = await this.letterheadService.getList(filter, req.user!);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  download = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { stream, fileName, mimeType } = await this.letterheadService.downloadFile(
        parseInt(req.params.id),
        req.user!
      );
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      (stream as any).pipe(res);
    } catch (err) {
      next(err);
    }
  };

  export = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filter = {
        departmentId: req.query.departmentId ? parseInt(req.query.departmentId as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        approvalAuthority: req.query.approvalAuthority as string,
        search: req.query.search as string,
      };
      const data = await this.letterheadService.getExportData(filter, req.user!);

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Letters');

      sheet.columns = [
        { header: 'Reference Number', key: 'reference_number', width: 20 },
        { header: 'Department', key: 'department_name', width: 20 },
        { header: 'Dept Code', key: 'department_code', width: 12 },
        { header: 'Letter Date', key: 'letter_date', width: 15 },
        { header: 'Approval Authority', key: 'approval_authority', width: 22 },
        { header: 'Description', key: 'description', width: 35 },
        { header: 'Notes', key: 'notes', width: 35 },
        { header: 'File Name', key: 'file_name', width: 25 },
        { header: 'Registered By', key: 'created_by_name', width: 20 },
        { header: 'Registered At', key: 'created_at', width: 20 },
      ];

      // Style header row
      sheet.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE67E22' } };
        cell.alignment = { horizontal: 'center' };
      });

      for (const row of data) {
        sheet.addRow({
          reference_number: row.reference_number,
          department_name: row.department_name,
          department_code: row.department_code,
          letter_date: new Date(row.letter_date).toLocaleDateString('en-US'),
          approval_authority: row.approval_authority,
          description: row.description || '',
          notes: row.notes || '',
          file_name: row.file_name,
          created_by_name: row.created_by_name,
          created_at: new Date(row.created_at).toLocaleString('en-US'),
        });
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="letters_export_${new Date().toISOString().split('T')[0]}.xlsx"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      next(err);
    }
  };

  getNextReference = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const departmentId = parseInt(req.query.departmentId as string);
      if (!departmentId) throw new ValidationError('departmentId is required');
      const reference = await this.letterheadService.getNextReference(departmentId);
      res.json({ nextReference: reference });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { departmentId, letterDate, approvalAuthority, description, notes, justification } = req.body;

      if (!departmentId || !letterDate || !approvalAuthority || !description || !justification) {
        throw new ValidationError('departmentId, letterDate, approvalAuthority, description, and justification are required');
      }

      assertPdfSignature(req.file);

      const letterhead = await this.letterheadService.update(
        parseInt(id),
        {
          departmentId: parseInt(departmentId),
          letterDate,
          approvalAuthority,
          description,
          notes: notes || null,
          justification,
        },
        req.file,
        req.user!
      );
      res.json(letterhead);
    } catch (err) {
      next(err);
    }
  };

  getVersionHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const versions = await this.letterheadService.getVersionHistory(
        parseInt(id),
        req.user!
      );
      res.json(versions);
    } catch (err) {
      next(err);
    }
  };

  archive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { archiveReference, retentionYears = 7 } = req.body;
      
      const result = await this.letterheadService.archive(
        parseInt(id),
        archiveReference,
        parseInt(retentionYears),
        req.user!
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  unarchive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      const result = await this.letterheadService.unarchive(
        parseInt(id),
        req.user!
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getArchiveInfo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const archiveInfo = await this.letterheadService.getArchiveInfo(
        parseInt(id),
        req.user!
      );
      res.json(archiveInfo);
    } catch (err) {
      next(err);
    }
  };
}
