import { Controller, Post, Get, Body, Param, UseGuards, Req, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';




@Controller('auth')
export class EmployeeProfileController {
  constructor(
    private readonly authService: AuthService,
    
  ) {}
  @Post('login')
  login(@Body() dto: { employeeNumber: string; password: string }) {
    return this.authService.login(dto);
  }
  

}




