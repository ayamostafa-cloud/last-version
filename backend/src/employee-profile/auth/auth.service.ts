import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmployeeProfile, EmployeeProfileDocument } from '../models/employee-profile.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(EmployeeProfile.name)
    private readonly employeeModel: Model<EmployeeProfileDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: { employeeNumber: string; password: string }) {
    // Step 1: find employee by employeeNumber
    const employee = await this.employeeModel.findOne({ employeeNumber: dto.employeeNumber });
    if (!employee) {
      throw new NotFoundException("Employee not found ❌");
    }
// If password is missing in DB → stop ❌
if (!employee.password) {
  throw new UnauthorizedException("No password saved for this employee ❌");
}

// Now password is guaranteed to be a real string ✅
const isMatch = await bcrypt.compare(dto.password, employee.password);

    if (!isMatch) {
      throw new UnauthorizedException("Password is wrong ❌");
    }

    // Step 3: generate JWT token 🎫
    const token = this.jwtService.sign({
      id: employee._id,
      role: employee.status, // We'll use this as role for now (ACTIVE/INACTIVE)
    });

    // Step 4: return token ✅
    return { access_token: token };
  }
  generateToken(id: string) {
  return this.jwtService.sign({ id, role: "DEPARTMENT_EMPLOYEE" });
}

}
