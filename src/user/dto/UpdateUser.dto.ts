import { Type } from 'class-transformer';
import { IsDate, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  firstName?: string;

  @IsString()
  lastName?: string;

  @IsDate()
  @Type(() => Date)
  dob?: Date;

  @IsString()
  phoneNo?: string;

  @IsString()
  profilePic?: string;
}
