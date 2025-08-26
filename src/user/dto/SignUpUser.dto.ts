/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Type } from 'class-transformer';
import { IsDate, IsEmail, IsString } from 'class-validator';

export class SignUpUserDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  password?: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsDate()
  @Type(() => Date)
  dob: Date;

  @IsString()
  phoneNo: string;

  @IsString()
  token: string;

  @IsString()
  profilePic: string;
}
