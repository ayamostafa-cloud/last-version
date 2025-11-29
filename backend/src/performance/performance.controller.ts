import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
} from '@nestjs/common';
import { PerformanceService } from './performance.service';

@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  // ===========================
  //        TEMPLATES
  // ===========================

  @Post('templates')
  createTemplate(@Body() body: any) {
    return this.performanceService.createTemplate(body);
  }

  @Get('templates')
  getAllTemplates() {
    return this.performanceService.getAllTemplates();
  }

  @Get('templates/:id')
  getTemplateById(@Param('id') id: string) {
    return this.performanceService.getTemplateById(id);
  }

  @Patch('templates/:id')
  updateTemplate(@Param('id') id: string, @Body() body: any) {
    return this.performanceService.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string) {
    return this.performanceService.deleteTemplate(id);
  }

  // ===========================
  //          CYCLES
  // ===========================

  @Post('cycles')
  createCycle(@Body() body: any) {
    return this.performanceService.createCycle(body);
  }

  @Get('cycles')
  getAllCycles() {
    return this.performanceService.getAllCycles();
  }

  @Get('cycles/:id')
  getCycleById(@Param('id') id: string) {
    return this.performanceService.getCycleById(id);
  }

  @Patch('cycles/:id')
  updateCycle(@Param('id') id: string, @Body() body: any) {
    return this.performanceService.updateCycle(id, body);
  }

  @Patch('cycles/:id/activate')
  activateCycle(@Param('id') id: string) {
    return this.performanceService.activateCycle(id);
  }

  @Patch('cycles/:id/close')
  closeCycle(@Param('id') id: string) {
    return this.performanceService.closeCycle(id);
  }

  @Patch('cycles/:id/archive')
  archiveCycle(@Param('id') id: string) {
    return this.performanceService.archiveCycle(id);
  }
}
