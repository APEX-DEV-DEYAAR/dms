import { DepartmentRepository } from '../repositories/department.repository';
import { Department } from '../types';

export class DepartmentService {
  constructor(private deptRepo: DepartmentRepository) {}

  async getAll(): Promise<Department[]> {
    return this.deptRepo.findAll();
  }

  async getById(id: number): Promise<Department | null> {
    return this.deptRepo.findById(id);
  }
}
