import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  EmployeeProfile,
  EmployeeProfileDocument,
} from './models/employee-profile.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { SelfUpdateDto } from './dto/self-update.dto';
import { EmployeeProfileChangeRequest } from './models/ep-change-request.schema';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { ProfileChangeStatus } from './enums/employee-profile.enums';
import { randomUUID } from 'crypto';
import { EmployeeStatus } from './enums/employee-profile.enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeeProfileService {
  constructor(
  @InjectModel(EmployeeProfile.name)
  private readonly employeeModel: Model<EmployeeProfileDocument>,

  @InjectModel(EmployeeProfileChangeRequest.name)
  private readonly changeRequestModel: Model<EmployeeProfileChangeRequest>,
) {}

  // -------- CREATE (HR / Admin) --------
  async create(createDto: CreateEmployeeDto) {
    // Mongoose will cast strings to Date/ObjectId as needed
    const created = new this.employeeModel({
      ...createDto,
      dateOfHire: new Date(createDto.dateOfHire),
      contractStartDate: createDto.contractStartDate
        ? new Date(createDto.contractStartDate)
        : undefined,
      contractEndDate: createDto.contractEndDate
        ? new Date(createDto.contractEndDate)
        : undefined,
    });
    return created.save();
  }

  // -------- READ ALL --------
  async findAll(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;

  return this.employeeModel
    .find()
    .skip(skip)
    .limit(limit)
    .populate('primaryDepartmentId')
    .populate('primaryPositionId')
    .populate('supervisorPositionId')
    .lean();
}

  // -------- READ ONE --------
  async findOne(id: string) {
    const employee = await this.employeeModel
      .findById(id)
      .populate('primaryDepartmentId')
      .populate('primaryPositionId')
      .populate('supervisorPositionId')
      .lean();

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }
  // -------- SET / CHANGE PASSWORD (HR/Admin) --------
async setPassword(id: string, password: string) {
  // Step 1: find employee
  const employee = await this.employeeModel.findById(id);
  if (!employee) {
    throw new NotFoundException("Employee not found 🧑‍🏫");
  }

  // Step 2: hash the password (hide it like magic 🔮)
  const hashed = await bcrypt.hash(password, 10);

  // Step 3: save hashed password
  await this.employeeModel.findByIdAndUpdate(
    id,
    { password: hashed },
    { new: true }
  );

  // Step 4: say done ✅
  return { message: "Password updated successfully 🔐", id };
}

  // -------- UPDATE (HR / Admin) --------
  // -------- UPDATE (HR / Admin) --------
  async update(id: string, updateDto: UpdateEmployeeDto) {
    // convert dates if provided
    const payload: any = { ...updateDto };

    if (updateDto.dateOfHire) {
      payload.dateOfHire = new Date(updateDto.dateOfHire);
    }
    if (updateDto.contractStartDate) {
      payload.contractStartDate = new Date(updateDto.contractStartDate);
    }
    if (updateDto.contractEndDate) {
      payload.contractEndDate = new Date(updateDto.contractEndDate);
    }

    const updated = await this.employeeModel
      .findByIdAndUpdate(id, payload, { new: true })
      .lean();

    if (!updated) {
      throw new NotFoundException('Employee not found');
    }

    return updated;
  }
  // -------- DELETE / DEACTIVATE (optional) --------
 
// -------- DEACTIVATE (NOT DELETE) --------


async deactivate(id: string) {
  // Step 1: find employee
  const employee = await this.employeeModel.findById(id);
  if (!employee) {
    throw new NotFoundException("Employee not found 🧑‍🏫");
  }

  // Step 2: remember old status ✅ (schema still untouched)
  const oldStatus = employee.status;

  // Step 3: update employee to inactive using ENUM ✅
  const updated = await this.employeeModel.findByIdAndUpdate(
    id,
    { status: EmployeeStatus.INACTIVE },
    { new: true }
  ).lean();

  // Step 4: return response ✅
  return {
    message: "Employee is now deactivated 😴",
    id,
    oldStatus,
    newStatus: EmployeeStatus.INACTIVE,
    updatedEmployee: updated
  };
}

// ================================
// EMPLOYEE SELF-SERVICE UPDATE
// ================================
  async selfUpdate(employeeId: string, dto: SelfUpdateDto) {
  const allowed = ['phone', 'personalEmail', 'workEmail', 'biography', 'address'];

  // Remove any forbidden fields
  const payload: any = {};
  for (const key of allowed) {
    if (dto[key] !== undefined) {
      payload[key] = dto[key];
    }
  }

  const updated = await this.employeeModel.findByIdAndUpdate(
    employeeId,
    payload,
    { new: true }
  ).lean();

  if (!updated) {
    throw new NotFoundException('Employee not found');
  }

  return updated;
}
// ================================
// CREATE CHANGE REQUEST (Employee)
// ================================
// ================================
// CREATE CHANGE REQUEST (Employee)
// ================================
async createChangeRequest(employeeId: string, dto: CreateChangeRequestDto) {
  // Ensure employee exists
  const employee = await this.employeeModel.findById(employeeId);
  if (!employee) {
    throw new NotFoundException('Employee not found');
  }

  // Store data so approve() can read it later
  const requestDescription = JSON.stringify({
    field: dto.field,
    newValue: dto.newValue,
    reason: dto.reason ?? '',
  });

  const newRequest = new this.changeRequestModel({
    employeeProfile: employeeId,   // FIX
    field: dto.field,
    newValue: dto.newValue,
    reason: dto.reason ?? '',
    requestDescription,            // FIX (required for approval)
    status: ProfileChangeStatus.PENDING,
    submittedAt: new Date(),
  });

  return newRequest.save();
}

// ================================
// GET ALL REQUESTS FOR EMPLOYEE
// ================================
async getEmployeeChangeRequests(employeeProfileId: string) {
  return this.changeRequestModel
    .find({ employeeProfileId })
    .sort({ submittedAt: -1 })
    .lean();
}
// ================================
// HR APPROVES REQUEST
// ================================

// HR APPROVES REQUEST
// ================================

async approveChangeRequest(id: string) {
  const request = await this.changeRequestModel.findById(id);
  if (!request) throw new NotFoundException('Request not found');

  const { field, newValue } = JSON.parse(request.requestDescription);

  const update = { [field]: newValue };

  if (field === 'nationalId' && !/^\d{14}$/.test(newValue)) {
    throw new Error('nationalId must be 14 digits');
  }

  await this.employeeModel.findByIdAndUpdate(request.employeeProfileId, update);
}

async rejectChangeRequest(id: string, reason: string) {
  const request = await this.changeRequestModel.findById(id);
  if (!request) throw new NotFoundException('Request not found');

  request.status = ProfileChangeStatus.REJECTED;
  request.processedAt = new Date();
  request.reason = reason;

  return request.save();
}

// Manager sees list of employees reporting to them (only summary)
// Manager sees list of employees reporting to them (only summary)
async getTeamSummaryForManager(managerId: string) {
  return this.employeeModel
    .find({ supervisorPositionId: managerId }) // ✅ FIXED FIELD
    .select('firstName lastName primaryDepartmentId primaryPositionId employeeStatus')
    .populate('primaryDepartmentId')
    .populate('primaryPositionId')
    .lean();
}

// Manager sees one employee but must belong to their team
async getTeamEmployeeSummary(managerId: string, employeeId: string) {
  const employee = await this.employeeModel
    .findOne({ _id: employeeId, supervisorPositionId: managerId }) // ✅ FIXED FIELD
    .select('firstName lastName primaryDepartmentId primaryPositionId employeeStatus')
    .populate('primaryDepartmentId', 'name')
    .populate('primaryPositionId', 'title')

    .lean();

  if (!employee) {
    throw new NotFoundException('Employee not found in your team');
  }

  return employee;
}


async getAllChangeRequests() {
  return this.changeRequestModel
    .find()
    .sort({ submittedAt: -1 })
    .lean();
}

// Find request by UUID only using existing requestId field
async findChangeRequestByUUID(requestId: string) {
  const request = await this.changeRequestModel.findOne({ requestId }).lean();
  if (!request) {
    throw new NotFoundException('Request not found');
  }
  return request;
}

// ❗ Dispute logic (missing earlier)
  async submitDispute(dto: { employeeProfileId: string; originalRequestId: string; dispute: string }) {
  const requestId = randomUUID(); // REQUIRED

  const created = new this.changeRequestModel({
    requestId, // required
    employeeProfileId: dto.employeeProfileId, // required

    // store the dispute target inside requestDescription
    requestDescription:`disputeFor:${dto.originalRequestId}`,

    reason: dto.dispute, // required
    status: ProfileChangeStatus.PENDING, // using existing enum
    submittedAt: new Date(),
  });

  return created.save();
}

  
   
  async withdrawChangeRequest(id: string) {
  const request = await this.changeRequestModel.findById(id);
  if (!request) throw new NotFoundException('Request not found');

  // Can only withdraw if pending
  if (request.status !== ProfileChangeStatus.PENDING) {
    throw new Error('Only pending requests can be withdrawn');
  }

  request.status = ProfileChangeStatus.REJECTED;
  request.reason = "Withdrawn by employee";
  request.processedAt = new Date();

  await request.save();

  return {
    message: 'Change request withdrawn successfully',
    requestId: request.requestId,
    status: request.status,
  };
}



async resolveDispute(id: string, resolution: string) {
  const dispute = await this.changeRequestModel.findById(id);
  if (!dispute) throw new NotFoundException("Dispute not found");

  // HR resolves dispute (must use enum)
  dispute.status = ProfileChangeStatus.REJECTED;  // The dispute is now closed
  dispute.reason = resolution;
  dispute.processedAt = new Date();

  return dispute.save();
}
async approveDispute(id: string, resolution: string) {
  const dispute = await this.changeRequestModel.findById(id);
  if (!dispute) throw new NotFoundException("Dispute not found");

  // HR approves the dispute (employee wins)
  dispute.status = ProfileChangeStatus.APPROVED;
  dispute.reason = resolution;
  dispute.processedAt = new Date();

  return dispute.save();
}


}