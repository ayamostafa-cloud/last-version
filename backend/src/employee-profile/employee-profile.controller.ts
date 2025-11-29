import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
  Query,

} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import {
  EMPLOYEE_ROLES,
  MANAGER_ROLES,
  HR_ROLES,
  ADMIN_ROLES,
} from '../common/constants/role-groups';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Request } from 'express';
import { EmployeeProfileService } from './employee-profile.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { SelfUpdateDto } from './dto/self-update.dto';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';

import { UnauthorizedException } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';

@Controller('employee-profile')

export class EmployeeProfileController {
  constructor(
    private readonly employeeProfileService: EmployeeProfileService,
  ) {}

  // CREATE (HR/Admin)
  @Post()
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeeProfileService.create(dto);
  }

  // GET ALL
 @Get()
findAll(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 10
) {
  return this.employeeProfileService.findAll(Number(page), Number(limit));
}
  
 @Post('set-password/:id')
setPassword(
  @Param('id') id: string,
  @Body() dto: { password: string }
) {
  return this.employeeProfileService.setPassword(id, dto.password);
}

  // EMPLOYEE SELF-SERVICE UPDATE
@Patch('self-update/:id')
selfUpdate(@Param('id') id: string, @Body() dto: SelfUpdateDto) {
  return this.employeeProfileService.selfUpdate(id, dto);
}
// Employee submits a change request
@Post('change-requests')
@UseGuards(JwtAuthGuard)  // make sure JWT decoded first ✅
createChangeRequest(@Body() dto: CreateChangeRequestDto, @Req() req: any) {
  const userId = req.user?.id;
  if (!userId) throw new UnauthorizedException("Not authenticated ❌");
  return this.employeeProfileService.createChangeRequest(userId, dto); // ✅ 2 args provided
}


// Employee views all their change requests
@Get('change-requests/by-employee/:employeeProfileId')
getEmployeeChangeRequests(@Param('employeeProfileId') employeeProfileId: string) {
  return this.employeeProfileService.getEmployeeChangeRequests(employeeProfileId);
}

// HR approves request
@Patch('change-requests/:id/approve')
approveChangeRequest(@Param('id') id: string) {
  return this.employeeProfileService.approveChangeRequest(id);
}

// HR rejects request
@Patch('change-requests/:id/reject')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  rejectChangeRequest(@Param('id') id: string, @Body('reason') reason: string) {
    return this.employeeProfileService.rejectChangeRequest(id, reason);
  }

// MANAGER: View team summary
@Get('manager/team/:managerId')
  @Roles(...MANAGER_ROLES)
  getTeamSummary(@Param('managerId') managerId: string) {
  return this.employeeProfileService.getTeamSummaryForManager(managerId);
}


// MANAGER: View one employee from team
@Get('manager/team/:managerId/employee/:employeeId')
  @Roles(...MANAGER_ROLES)
  getTeamEmployee(
  @Param('managerId') managerId: string,
  @Param('employeeId') employeeId: string
) {
  return this.employeeProfileService.getTeamEmployeeSummary(managerId, employeeId);
}

// HR audit: view all
  @Get('change-requests/all')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  getAllRequests() {
    return this.employeeProfileService.getAllChangeRequests();
  }

  // Find by UUID
  @Get('change-requests/request/:requestId')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  getByUUID(@Param('requestId') requestId: string) {
    return this.employeeProfileService.findChangeRequestByUUID(requestId);
  }

@Patch('change-requests/:id/withdraw')
withdrawChangeRequest(@Param('id') id: string) {
  return this.employeeProfileService.withdrawChangeRequest(id);
}
    // GET ONE BY ID
  @Get(':id')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  findOne(@Param('id') id: string) {
    return this.employeeProfileService.findOne(id);
  }

  

  // UPDATE (HR/Admin)
  @Patch(':id')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeeProfileService.update(id, dto);
  }


  // DELETE / DEACTIVATE (optional)
  @Delete(':id')
  @Roles(...HR_ROLES, ...ADMIN_ROLES)

  remove(@Param('id') id: string) {
    return this.employeeProfileService.deactivate(id);
  }
@Get('profile/me')
  @UseGuards(JwtAuthGuard)  // ✅ decodes JWT and attaches req.user
  getMyProfile(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException("Not authenticated ❌");
    return this.employeeProfileService.findOne(userId);
  }
  
@Patch('change-requests/:id/approve-dispute')
approveDispute(
  @Param('id') id: string,
  @Body('resolution') resolution: string
) {
  return this.employeeProfileService.approveDispute(id, resolution);
}


  @Post('change-requests/:id/dispute')
submitDispute(
  @Param('id') originalRequestId: string,
  @Body() body: { employeeProfileId: string; dispute: string }
) {
  return this.employeeProfileService.submitDispute({
    employeeProfileId: body.employeeProfileId,
    originalRequestId,
    dispute: body.dispute,
  });
}

// HR resolves a dispute
@Patch('change-requests/:id/resolve-dispute')
resolveDispute(
  @Param('id') id: string,
  @Body('resolution') resolution: string
) {
  return this.employeeProfileService.resolveDispute(id, resolution);

  
}

}



