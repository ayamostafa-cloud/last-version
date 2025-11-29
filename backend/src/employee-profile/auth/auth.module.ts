import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeProfile, EmployeeProfileSchema } from '../models/employee-profile.schema';
import { AuthService } from './auth.service';
import { EmployeeProfileController } from './auth.controller';

@Module({
  imports: [
    // Register Employee schema for Auth login
    MongooseModule.forFeature([{ name: 'EmployeeProfile', schema: EmployeeProfileSchema }]),

    // Register JWT
    JwtModule.register({
      global: true,
      secret: 'SUPER_SECRET_KEY',
      signOptions: { expiresIn: '1h' }
    })
  ],
  controllers: [EmployeeProfileController], // ✅ must be the real controller class
  providers: [AuthService]
})
export class AuthModule {}