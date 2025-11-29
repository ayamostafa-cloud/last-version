import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  AppraisalTemplate,
  AppraisalTemplateDocument,
} from './models/appraisal-template.schema';

import {
  AppraisalCycle,
  AppraisalCycleDocument,
} from './models/appraisal-cycle.schema';

import {
  AppraisalTemplateType,
  AppraisalCycleStatus,
} from './enums/performance.enums';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(AppraisalTemplate.name)
    private readonly templateModel: Model<AppraisalTemplateDocument>,

    @InjectModel(AppraisalCycle.name)
    private readonly cycleModel: Model<AppraisalCycleDocument>,
  ) {}

  // ===========================
  //        TEMPLATES
  // ===========================

  async createTemplate(body: any) {
    const created = new this.templateModel(body);
    return created.save();
  }

  async getAllTemplates() {
    return this.templateModel.find().lean();
  }

  async getTemplateById(id: string) {
    const template = await this.templateModel.findById(id).lean();
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  async updateTemplate(id: string, body: any) {
    const updated = await this.templateModel
      .findByIdAndUpdate(id, body, { new: true })
      .lean();

    if (!updated) throw new NotFoundException('Template not found');

    return updated;
  }

  async deleteTemplate(id: string) {
    const deleted = await this.templateModel.findByIdAndDelete(id).lean();
    if (!deleted) throw new NotFoundException('Template not found');
    return { message: 'Template deleted', id };
  }

  // ===========================
  //          CYCLES
  // ===========================

  async createCycle(body: any) {
    const created = new this.cycleModel({
      ...body,
      status: body.status ?? AppraisalCycleStatus.PLANNED,
    });

    return created.save();
  }

  async getAllCycles() {
    return this.cycleModel.find().lean();
  }

  async getCycleById(id: string) {
    const cycle = await this.cycleModel.findById(id).lean();
    if (!cycle) throw new NotFoundException('Appraisal cycle not found');
    return cycle;
  }

  async updateCycle(id: string, body: any) {
    const updated = await this.cycleModel
      .findByIdAndUpdate(id, body, { new: true })
      .lean();

    if (!updated) throw new NotFoundException('Appraisal cycle not found');

    return updated;
  }

  async activateCycle(id: string) {
    const updated = await this.cycleModel
      .findByIdAndUpdate(
        id,
        { status: AppraisalCycleStatus.ACTIVE, publishedAt: new Date() },
        { new: true },
      )
      .lean();

    if (!updated) throw new NotFoundException('Cycle not found');
    return updated;
  }

  async closeCycle(id: string) {
    const updated = await this.cycleModel
      .findByIdAndUpdate(
        id,
        { status: AppraisalCycleStatus.CLOSED, closedAt: new Date() },
        { new: true },
      )
      .lean();

    if (!updated) throw new NotFoundException('Cycle not found');
    return updated;
  }

  async archiveCycle(id: string) {
    const updated = await this.cycleModel
      .findByIdAndUpdate(
        id,
        { status: AppraisalCycleStatus.ARCHIVED, archivedAt: new Date() },
        { new: true },
      )
      .lean();

    if (!updated) throw new NotFoundException('Cycle not found');
    return updated;
  }
}
